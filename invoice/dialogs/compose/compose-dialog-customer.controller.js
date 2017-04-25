////////////////////////////////
// App : Inventory
// File : AddInventoryController
// Owner  : GihanHerath
// Last changed date : 2016/12/28
// Version : 6.0.0.15
/////////////////////////////////

(function ()
{
  'use strict';

  angular
    .module('app.invoice')
    .controller('AddCustomerController', AddCustomerController);

  /** @ngInject */
  function AddCustomerController($mdDialog, selectedMail, category, $scope, $mdToast, notifications, $charge)
  {
    var vm = this;


    vm.hiddenCC = true;
    vm.hiddenBCC = true;

    vm.submitted=false;

    $scope.contentuser={};

    $scope.contentuser.category=category;

    // If replying
    if ( angular.isDefined(selectedMail) )
    {
      vm.form.to = selectedMail.from.email;
      vm.form.subject = 'RE: ' + selectedMail.subject;
      vm.form.message = '<blockquote>' + selectedMail.message + '</blockquote>';
    }

    // Methods
    vm.closeDialog = closeDialog;

    //////////

    function closeDialog()
    {
      $mdDialog.hide();
    }

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.defaultCreditLimit=-1;
    $charge.commondata().getDuobaseFieldsByTableNameAndFieldName("CTS_InvoiceAttributes","InvoicePrefix,PrefixLength,EnableDiscount,SIVEA,SREOP,PartialPayments,FirstReminder,RecurringReminder,InvoiceTerms,CreditLimit").success(function(data) {
      var length=data.length;
      for(var i=0;i<length;i++)
      {
        var obj=data[i][0];
        if(obj.ColumnIndex=="9")
        {
          $scope.defaultCreditLimit = parseFloat(obj.RecordFieldData);

        }
      }

    }).error(function(data) {

    })

    $scope.checkRequired=true;

    $scope.toggleType = function(type) {
      debugger;
      if(type=='Individual')
      {
        $scope.contentuser.business_name="";
        $scope.contentuser.business_contact_no="";
        $scope.contentuser.email_addr="";
        $scope.contentuser.bill_addr="";

        $scope.checkRequired=true;
      }
      else
      {
        $scope.contentuser.first_name="";
        $scope.contentuser.phone="";
        $scope.contentuser.email_addr="";
        $scope.contentuser.bill_addr="";

        $scope.checkRequired=false;
      }
    };

    $scope.submit = function()
    {
      debugger;
      vm.submitted=true;
      if(vm.editForm.$valid == false)
      {
        //$mdToast.show({
        //  template: '<md-toast class="md-toast-error" >Validation Error!</md-toast>',
        //  hideDelay: 2000,
        //  position: 'top right'
        //});
        vm.submitted=false;
      }
      else if($scope.contentuser.profile_type=='Individual')
      {
        if($scope.contentuser.category==undefined||$scope.contentuser.first_name==undefined||$scope.contentuser.email_addr==undefined)
        {
          //$mdToast.show({
          //  template: '<md-toast class="md-toast-error" >Fill the necessary Fields!</md-toast>',
          //  hideDelay: 2000,
          //  position: 'top right'
          //});
          vm.submitted=false;
        }
        else
        {
          if($scope.contentuser.phone==undefined)
          {
            $scope.contentuser.phone="";
          }
          $scope.contentuser.bill_addr=document.getElementById('autocomplete').value;
          $scope.submitContinue();
        }
      }
      else if($scope.contentuser.profile_type=='Business')
      {
        if($scope.contentuser.category==undefined||$scope.contentuser.business_name==undefined||$scope.contentuser.email_addr==undefined)
        {
          //$mdToast.show({
          //  template: '<md-toast class="md-toast-error" >Fill the necessary Fields!</md-toast>',
          //  hideDelay: 2000,
          //  position: 'top right'
          //});
          vm.submitted=false;
        }
        else
        {
          if($scope.contentuser.business_contact_no==undefined)
          {
            $scope.contentuser.business_contact_no="";
          }
          $scope.contentuser.bill_addr=document.getElementById('autocomplete2').value;
          $scope.submitContinue();
        }
      }


      //debugger;
    }

    $scope.submitContinue = function() {
      $scope.contentuser.status=true;
      $scope.contentuser.last_name="";
      $scope.contentuser.nic_ssn="";
      $scope.contentuser.date_of_birth="";
      $scope.contentuser.gender="";
      //$scope.contentuser.bill_city="";
      //$scope.contentuser.bill_country="";
      //$scope.contentuser.bill_zip_post="";
      $scope.contentuser.bill_city=document.getElementById('locality').value;
      $scope.contentuser.bill_country=document.getElementById('country').value;
      $scope.contentuser.bill_zip_post=document.getElementById('postal_code').value;
      $scope.contentuser.ship_city=$scope.contentuser.bill_city;
      $scope.contentuser.ship_country=$scope.contentuser.bill_country;
      $scope.contentuser.ship_zip_post=$scope.contentuser.bill_zip_post;
      $scope.contentuser.business_reg_no="";
      $scope.contentuser.business_reg_date="";
      $scope.contentuser.business_contact_name="";
      $scope.contentuser.other_info="";
      $scope.contentuser.verification_code="";
      $scope.contentuser.credit_limit=$scope.defaultCreditLimit;
      $scope.contentuser.ship_addr=$scope.contentuser.bill_addr;
      if($scope.contentuser.profile_type=='Individual')
      {
        $scope.contentuser.business_name="";
        $scope.contentuser.business_contact_no="";
      }
      else if($scope.contentuser.profile_type=='Business')
      {
        $scope.contentuser.first_name="";
        $scope.contentuser.phone="";
      }
      var userObj = $scope.contentuser;

      //debugger;
      $charge.profile().store(userObj).success(function(data) {
        debugger;
        if(data.error!="00000")
        {
          if(data.error=="Cannot proceed, Profile count has reached!")
          {
            notifications.toast("Sorry, Cannot Create profiles! Maximum Profile Limit Reached!","error");
          }
          else
          {
            notifications.toast(data.error,"error");
          }
          vm.submitted=false;
          //closeDialog();
        }
        else if(data.id) {
          console.log(data);
          notifications.toast("Successfully Created User!","success");
          $scope.contentuser.profileId=data.id;
          vm.submitted=false;

          debugger;
          $mdDialog.hide($scope.contentuser);
        }
      }).error(function(data) {
        //debugger;
        console.log(data);
        vm.submitted=false;
      })
    };

    $scope.clearNewUserDetails = function() {
      vm.submitted=false;

      $scope.contentuser={};
      $scope.contentuser.first_name="";
      $scope.contentuser.email_addr="";
      $scope.contentuser.business_contact_no="";
      $scope.contentuser.phone="";
      $scope.contentuser.business_name="";
      $scope.contentuser.bill_addr="";
      document.getElementById('autocomplete').value = '';
      document.getElementById('autocomplete2').value = '';
      document.getElementById('locality').value = '';
      document.getElementById('country').value = '';
      document.getElementById('postal_code').value = '';
      $scope.contentuser.profile_type='Individual';
      $scope.contentuser.category=category;
    }
  }
})();
