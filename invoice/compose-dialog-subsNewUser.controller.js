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
    .controller('AddNewSubsUserController', AddNewSubsUserController);

  /** @ngInject */
  function AddNewSubsUserController($mdDialog, selectedMail, category, $scope, $mdToast, notifications, $charge)
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

    vm.usingAvalaraTax = false;

    $scope.checkAvalaraTax= function () {
      $charge.ccapi().getAvalaraTax().success(function(data) {
        //
        if(data!=undefined && data!=null && data!="") {
          vm.usingAvalaraTax = true;

        }
        else{
          vm.usingAvalaraTax = false;
        }
      }).error(function(data) {
        //console.log(data);
        vm.usingAvalaraTax = false;

      })
    }
    $scope.checkAvalaraTax();

    $scope.checkRequired=true;

    $scope.submit = function()
    {

      vm.submitted=true;
      if(vm.editForm.$valid)
      {
        if(!vm.usingAvalaraTax)
        {
          $scope.contentuser.billAddress=document.getElementById('autocomplete').value;
          $scope.contentuser.country=document.getElementById('country').value;
        }
        else
        {
          $scope.contentuser.billAddress = $scope.contentuser.line1+"|"+$scope.contentuser.city+"|"+$scope.contentuser.region+"|"+$scope.contentuser.country;
        }

        var userObj = $scope.contentuser;

        $charge.profile().store(userObj).success(function(data){
          //console.log(data);

          if(data.response=="succeeded")
          {
            notifications.toast("Successfully Created the Profile","success");
            var userObjModified = {
              "profileId":data.data.profileid,
              "profilename":$scope.contentuser.firstName,
              "othername":$scope.contentuser.lastName,
              "email":$scope.contentuser.email,
              "phone":$scope.contentuser.phone,
              "category":$scope.contentuser.category,
              "profile_type" : 'Individual',
              "credit_limit":-1,
              "bill_addr":$scope.contentuser.billAddress,
              "status":true,
              "stripeCustId":null,
            }
            $mdDialog.hide(userObjModified);
          }
          else
          {
            notifications.toast("Creating Profile Failed","error");

          }

        }).error(function(data){
          //console.log(data);
          var errorMsg="Profile creation failed";
          for (key in data.error) {
            errorMsg=data.error[key][0];
            if(errorMsg=="The user or account could not be authenticated."||errorMsg.indexOf('Cannot insert The duplicate key value') >= 0)
            {
              errorMsg = "Profile creation failed - Duplicate Email address";
            }
            break;
          }
          notifications.toast(errorMsg,"error");

        })
      }
      else
      {
        vm.submitted=false;
        angular.element(document.querySelector('#newUserForm')).find('.ng-invalid:visible:first').focus();
      }


      //
    }

    $scope.clearNewUserDetails = function() {
      vm.submitted=false;

      $scope.contentuser={};
      document.getElementById('autocomplete').value = '';
      document.getElementById('locality').value = '';
      document.getElementById('country').value = '';
      document.getElementById('postal_code').value = '';
      $scope.contentuser.category=category;
    }

  }
})();
