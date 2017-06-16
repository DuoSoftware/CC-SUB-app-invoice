
(function ()
{
  'use strict';

  angular
    .module('app.invoice')
    .controller('AddInvoiceController', AddInvoiceController);

  /** @ngInject */
  function AddInvoiceController($mdDialog, selectedInvoice,base64Content,adminData, $scope, $charge,notifications)
  {
    var vm = this;


    vm.hiddenCC = true;
    vm.hiddenBCC = true;
    vm.readonly = false;
    vm.removable = false;
    $scope.addAttachment = true;
    $scope.recipients=[];
    $scope.selectedUser = [];
    //$scope.focusedItemName='';
    $scope.hideSendButton = false;

    // If replying
    if ( angular.isDefined(selectedInvoice) )
    {
      $scope.selectedInvoice = selectedInvoice;
      //$scope.selectedUser = [selectedInvoice.person_name];
      $scope.selectedInvoice.email=$scope.selectedInvoice.email_addr;
      $scope.recipients.push({"display":selectedInvoice.person_name,"value":selectedInvoice});

      $scope.bodycontent = '';
      if($scope.selectedInvoice.guInvID) {
        var req = {
          "app": "Invoice",
          "id": $scope.selectedInvoice.guInvID //"678848B9-13FC-BDFB-BD01-0B6463CDE939";
        }

        $charge.document().getDefaultEmailBody(req).success(function (data) {
          if(data.error === "00000") {
            $scope.bodycontent = data.body.body;
            $scope.hideSendButton = true;
          }
        }).error(function (data) {
          $scope.hideSendButton = false;
        });
      }else {
        $scope.hideSendButton = true;

        $scope.bodycontent = '<p>Dear ' + selectedInvoice.person_name + ',' + "</p><p></p>" + '<p>Thank You for your business.' + "</p>" + '<p>Your invoice '
          + $scope.selectedInvoice.invoiceNo + ' can be viewed, printed or downloaded as a PDF file from the link below.' + '</p>'
          + '<p>We look forward to doing more business with you.</p>';
      }

      $scope.subject='Invoice -' + $scope.selectedInvoice.invoiceNo + ' from Subscription';

      if(adminData!=null) {
        var tenantName=adminData.Name;
        adminData.email = adminData.Email;
        $scope.selectedUser.push({"display": adminData.Username, "value": adminData})
      }

    }

    vm.autocompleteDemoRequireMatch = true;
    $scope.selectedInvoice=selectedInvoice;

    $scope.profilelist = [];

    var skipprofiles=0;
    var takeprofiles=10;

    function loadAll() {

      $charge.profile().all(skipprofiles,takeprofiles,'asc').success(function(data){
        console.log(data);
        skipprofiles+=takeprofiles;
        for (var i = 0; i < data.length; i++) {
          var obj=data[i];

          if(obj.status==0)
          {

          }
          else if(obj.profile_type=='Business')
          {
            $scope.profilelist.push({
              display : obj.business_name,
              value : {profilename : obj.business_name, profileId : obj.profileId, othername : obj.business_contact_name, profile_type : obj.profile_type,bill_addr : obj.bill_addr, category : obj.category, email : obj.email_addr}
            });
          }
          else if(obj.profile_type=='Individual')
          {
            $scope.profilelist.push({
              display : obj.first_name,
              value : {profilename : obj.first_name, profileId : obj.profileId, othername : obj.last_name, profile_type : obj.profile_type,bill_addr : obj.bill_addr, category : obj.category, email : obj.email_addr}
            });
          }

        }
        //loadAll();
        $scope.filteredUsers = $scope.profilelist;

        //for (i = 0, len = data.length; i<len; ++i){
        //    $scope.allBanks.push ({display: data[i].BankName, value:{TenantID:data[i].TenantID, value:data[i].BankName.toLowerCase()}});
        //}

      }).error(function(data){
        //alert ("Error getting all banks");
      });

    }
    loadAll();

    var self = this;
    // list of `state` value/display objects
    //self.tenants        = loadAll();
    self.readonly = false;
    self.selectedItem = null;
    self.searchText = null;
    self.numberChips = [];
    self.numberChips2 = [];
    self.numberBuffer = '';
    self.autocompleteDemoRequireMatch = true;
    $scope.transformChip = transformChip;

    //self.querySearch   = querySearch;
    // ******************************
    // Internal methods
    // ******************************
    /**
     * Search for tenants... use $timeout to simulate
     * remote dataservice call.
     */

    $scope.querySearch = function querySearch (query) {

      //Custom Filter
      var results=[];
      var len=0;
      for (var i = 0,len = $scope.filteredUsers.length; i<len; ++i){
        //console.log($scope.allBanks[i].value.value);

        if($scope.filteredUsers[i].value.profilename!=""&&$scope.filteredUsers[i].value.profilename!=undefined)
        {
          if($scope.filteredUsers[i].value.profilename.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.filteredUsers[i]);
            continue;
          }
        }
        if($scope.filteredUsers[i].value.othername!=""&&$scope.filteredUsers[i].value.othername!=undefined)
        {
          if($scope.filteredUsers[i].value.othername.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.filteredUsers[i]);
            continue;
          }
        }
      }
      return results;
    }

    var skip,take;
    var tempProfileList;
    $scope.filteredUsers = [];
    $scope.isAutoTODisabled = false;
    //var autoElem = angular.element('#invoice-auto');
    $scope.searchMre=false;
    $scope.loadProfileByKeyword= function (keyword, elem) {
      if(!$scope.searchMre) {
        //debugger;
        if ($scope.profilelist.length == 9) {
          if (keyword != undefined) {
            if (keyword.length == 3) {
              if(elem=='to'){
                $scope.isAutoTODisabled = true;
              }else{
                $scope.isAutoCCDisabled = true;
              }
              skip = 0;
              take = 10;
              var tempProfileList = [];
              $scope.filteredUsers = [];
              $charge.profile().filterByKey(keyword,skip,take).success(function (data) {
                for (var i = 0; i < data.length; i++) {
                  var obj = data[i];
                  if(obj.profile_type=='Individual')
                  {
                    tempProfileList.push({
                      display : obj.first_name,
                      value : {profilename : obj.first_name, profileId : obj.profileId, othername : obj.last_name, profile_type : obj.profile_type, bill_addr : obj.bill_addr, category : obj.category, email : obj.email_addr}
                    });
                  }
                  else if(obj.profile_type=='Business') {
                    tempProfileList.push({
                      display : obj.business_name,
                      value : {profilename : obj.business_name, profileId : obj.profileId, othername : obj.business_contact_name, profile_type : obj.profile_type, bill_addr : obj.bill_addr, category : obj.category, email : obj.email_addr}
                    });
                  }

                }
                $scope.filteredUsers = tempProfileList;
                //autoElem.focus();
                if(elem=='to'){
                  $scope.isAutoTODisabled = false;
                }else{
                  $scope.isAutoCCDisabled = false;
                }
                setTimeout(function(){
                  if(elem=='to'){
                    document.querySelector('#acProfileIdPayment1').focus();
                  }else{
                    document.querySelector('#acProfileIdPayment2').focus();
                  }
                },0);
                if (data.length < take)
                  $scope.searchMre = true;
                //skip += take;
                //$scope.loadPaging(keyword, rows, index, status, skip, take);
              }).error(function (data) {
                if(elem=='to'){
                  $scope.isAutoTODisabled = false;
                }else{
                  $scope.isAutoCCDisabled = false;
                }
                setTimeout(function(){
                  if(elem=='to'){
                    document.querySelector('#acProfileIdPayment1').focus();
                  }else{
                    document.querySelector('#acProfileIdPayment2').focus();
                  }
                },0);
                //autoElem.empty();
                //debugger;
                //vm.products = [];
                //vm.selectedProduct = null;
              });
            }
            else if(keyword.length>3)
            {
              //debugger;
              skip = 0;
              take = 10;
              tempProfileList = [];
              if(elem=='to'){
                $scope.isAutoTODisabled = true;
              }else{
                $scope.isAutDisabled = true;
              }
              $scope.filteredUsers = [];
              $charge.profile().filterByKey(keyword,skip,take).success(function (data) {
                for (var i = 0; i < data.length; i++) {
                  var obj = data[i];
                  if(obj.profile_type=='Individual')
                  {
                    tempProfileList.push({
                      display : obj.first_name,
                      value : {profilename : obj.first_name, profileId : obj.profileId, othername : obj.last_name, profile_type : obj.profile_type, bill_addr : obj.bill_addr, category : obj.category, email : obj.email_addr}
                    });
                  }
                  else if(obj.profile_type=='Business') {
                    tempProfileList.push({
                      display : obj.business_name,
                      value : {profilename : obj.business_name, profileId : obj.profileId, othername : obj.business_contact_name, profile_type : obj.profile_type, bill_addr : obj.bill_addr, category : obj.category, email : obj.email_addr}
                    });
                  }

                }
                $scope.filteredUsers = tempProfileList;
                //debugger;
                if(elem=='to'){
                  $scope.isAutoTODisabled = false;
                }else{
                  $scope.isAutoCCDisabled = false;
                }

                setTimeout(function(){
                  if(elem=='to'){
                    document.querySelector('#acProfileIdPayment1').focus();
                  }else{
                    document.querySelector('#acProfileIdPayment2').focus();
                  }
                },0);

                if (data.length < take)
                  $scope.searchMre = true;
              }).error(function (data) {
                if(elem=='to'){
                  $scope.isAutoTODisabled = false;
                }else{
                  $scope.isAutoCCDisabled = false;
                }
                setTimeout(function(){
                  if(elem=='to'){
                    document.querySelector('#acProfileIdPayment1').focus();
                  }else{
                    document.querySelector('#acProfileIdPayment2').focus();
                  }
                },0);
                //autoElem.empty();
              });
            }
            else if (keyword.length == 0 || keyword == null) {
              $scope.filteredUsers = $scope.profilelist;
              $scope.searchMre = false;
            }
          }
          else if (keyword == undefined) {
            $scope.filteredUsers = $scope.profilelist;
            $scope.searchMre = false;
          }
        }
      }
      else if (keyword == undefined || keyword.length == 0) {
        $scope.filteredUsers = $scope.profilelist;
        $scope.searchMre = false;
      }
    }


    $scope.toggleProfileSearchMre= function (ev) {
      //debugger;
      if (ev.keyCode === 8) {
        $scope.searchMre = false;
      }
    }

    function transformChip(chip) {
      // debugger;
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }

      // Otherwise, create a new one
      return { name: chip, type: 'new' }
    }

    // Methods
    $scope.closeDialog = closeDialog;

    vm.newVeg = function(chip) {
      return {
        name: chip,
        type: 'unknown'
      };
    };

    //////////

    function closeDialog()
    {
      $mdDialog.hide();
    }




    //$scope.subject = '';
    $scope.sendMail= function () {
      $scope.hideSendButton = false;
      $scope.cc=[];
      $scope.to=[];
      for(var i=0;i<$scope.recipients.length;i++)
      {
        $scope.to.push({  "name": $scope.recipients[i].display ,  "email": $scope.recipients[i].value.email});
      }

      for(var i=0;i<$scope.selectedUser.length;i++)
      {
        $scope.cc.push({  "name": $scope.selectedUser[i].display ,  "email": $scope.selectedUser[i].value.email});
      }
      var req={
        "app": "Invoice",
        "id": $scope.selectedInvoice.guInvID,
        "to": $scope.to,//[{  "name": "Suvethan",  "email": "suvethan@duosoftware.com" }],
        "from": [],
        "cc": $scope.cc,//[{  "name": "Buddhika",  "email": "buddhika@duosoftware.com" }, {  "name": "Gihan",  "email": "gihan@duosoftware.com" }],
        "bcc": [],
        "body": $scope.bodycontent,
        "subject": $scope.subject
      }

      $charge.document().sendMail(req).success(function(data) {
        //var parsedData=JSON.parse(data);
        notifications.toast(data.message, "success");
        $scope.hideSendButton = true;
        closeDialog();
      }).error(function (data) {
       // var parsedData=JSON.parse(data);
        $scope.hideSendButton = true;
        notifications.toast(data.message, "error");
        closeDialog();
      });
    }
  }
})();
