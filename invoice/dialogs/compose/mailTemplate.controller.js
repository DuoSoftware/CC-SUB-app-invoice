(function ()
{
  'use strict';

  angular
    .module('app.invoice')
    .controller('MailTemplateController', MailTemplateController);

  /** @ngInject */
  function MailTemplateController($mdDialog, selectedInvoice, $scope)
  {
    var vm = this;

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
              value : {profilename : obj.business_name, profileId : obj.profileId, othername : obj.business_contact_name, profile_type : obj.profile_type}
            });
          }
          else if(obj.profile_type=='Individual')
          {
            $scope.profilelist.push({
              display : obj.first_name,
              value : {profilename : obj.first_name, profileId : obj.profileId, othername : obj.last_name, profile_type : obj.profile_type}
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
    self.selectedItem  = null;
    self.searchText    = null;
    self.querySearch   = querySearch;
    // ******************************
    // Internal methods
    // ******************************
    /**
     * Search for tenants... use $timeout to simulate
     * remote dataservice call.
     */

    function querySearch (query) {

      debugger;
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
    vm.isAutoDisabled = false;
    //var autoElem = angular.element('#invoice-auto');
    $scope.searchMre=false;
    $scope.loadProfileByKeyword= function (keyword) {
      debugger;
      if(!$scope.searchMre) {
        //debugger;
        if ($scope.profilelist.length == 9) {
          if (keyword != undefined) {
            if (keyword.length == 3) {
              vm.isAutoDisabled = true;
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
                vm.isAutoDisabled = false;
                //autoElem.focus();
                setTimeout(function(){
                  document.querySelector('#acProfileIdPayment').focus();
                },0);
                if (data.length < take)
                  $scope.searchMre = true;
                //skip += take;
                //$scope.loadPaging(keyword, rows, index, status, skip, take);
              }).error(function (data) {
                vm.isAutoDisabled = false;
                setTimeout(function(){
                  document.querySelector('#acProfileIdPayment').focus();
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
              vm.isAutoDisabled = true;
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
                vm.isAutoDisabled = false;
                //debugger;
                setTimeout(function(){
                  document.querySelector('#acProfileIdPayment').focus();
                },0);

                if (data.length < take)
                  $scope.searchMre = true;
              }).error(function (data) {
                vm.isAutoDisabled = false;
                setTimeout(function(){
                  document.querySelector('#acProfileIdPayment').focus();
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

    $scope.transformChip =  function transformChip(chip) {
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }

      // Otherwise, create a new one
      return { name: chip, type: 'new' }
    }


    // Methods
    vm.closeDialog = closeDialog;

    //////////

    function closeDialog()
    {
      $mdDialog.hide();
    }
  }
})();
