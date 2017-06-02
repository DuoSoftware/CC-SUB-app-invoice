
(function ()
{
  'use strict';

  angular
    .module('app.invoice')
    .controller('CustomProductController', CustomProductController);

  /** @ngInject */
  function CustomProductController($mdDialog, selectedMail,$state,$scope,$filter,$charge,notifications,$rootScope,decimalPoint)
  {
    var vm = this;

    vm.hiddenCC = true;
    vm.hiddenBCC = true;
    $scope.content={};
    $scope.content.decimalPoint=decimalPoint;
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

    $scope.productSubmit=false;
    $scope.saveProduct = function(){
      //debugger;
      $scope.content.status=true;
      $scope.isAdded=false;
      if(vm.editForm.$valid == true) {
        $scope.productSubmit=true;
        if (isAvailable) {
          $scope.spinnerAdd = true;
          //$scope.content.product_name=self.searchText;
          //debugger;
          if ($scope.content.quantity_of_unit == undefined || $scope.content.quantity_of_unit == "")
            $scope.content.quantity_of_unit = 0;
          if ($scope.content.cost_price == undefined || $scope.content.cost_price == "")
            $scope.content.cost_price = 0;
          //if($scope.content.tax==null ||$scope.content.tax=="")
          //    $scope.content.tax="0";
          //debugger;
          if ($scope.content.apply_tax == undefined || $scope.content.apply_tax == null || $scope.content.apply_tax == "false" || $scope.content.apply_tax == false) {
            $scope.content.apply_tax = false;
            $scope.content.tax = "0";
          }
          else {
            var taxgrp = $filter('filter')($scope.taxGroup, {taxgroupcode: $scope.content.tax.trim()})[0];
            //debugger;
            $scope.content.tax = taxgrp.taxgroupid;
          }
          //debugger;
          if ($scope.content.sku == undefined || $scope.content.sku == null || $scope.content.sku == "false" || $scope.content.sku == false) {
            $scope.content.sku = false;
            $scope.content.minimun_stock_level = 0;
          }
          //if($scope.content.files !=null) {
          //$scope.content.attachment = $scope.content.files;
          // }
          $scope.content.attachment = "app/core/cloudcharge/img/noimage.png";
          var req = $scope.content;
          //debugger;
          $charge.product().store(req).success(function (data) {
            // debugger;
            if (data.id) {
              $scope.productSubmit=false;
              notifications.toast("Record Inserted, Product Code " + req.code, "success");
              //$scope.isAdded = false;
              //$scope.clearFields();
              //$rootScope.isCleared = true;
              var product = {}
              product.code = req.code;
              product.product_name = req.product_name;
              product.price_of_unit = req.price_of_unit;
              product.status = true;
              product.sku=0;
              product.tax=req.tax;
              product.apply_tax=req.apply_tax;
              product.productId=data.id;
              $mdDialog.hide(product);

            }
          }).error(function (data) {
            //console.log(data);
            $scope.productSubmit=false;
          })
        }
        else {
          $scope.chkProductCode($scope.content.code);
        }
      }

    }

    var isAvailable;
    $scope.validateProduct=function (ev)
    {
      if(ev!=null) {
        if (ev.length < 3) {
          //notifications.toast("Please enter more than 3 characters", "error");
          //$scope.content.code = "";
        }
        else {
          $scope.chkProductCode(ev);
        }
      }
    }

    $scope.chkProductCode= function (ev) {
      $charge.product().getByCode(ev).success(function (data) {
        isAvailable=true;
        notifications.toast(ev +" has been already added" , "error");
        $scope.content.code="";
      }).error(function (status) {
        //debugger;
        if(status!=204) {
          notifications.toast("Error occurred while checking product code", "error");
          isAvailable=false;
        }
        else
        {
          isAvailable=true;
        }
      });
    }
    $scope.isAdded=false;
    $scope.clearFields= function () {
      vm.editForm.$setPristine();
      vm.editForm.$setUntouched();
      $scope.content.product_name='';
      //self.searchText='';
      $scope.content.files=[];
      $scope.content.descroption="";
      $scope.content.code="";
      $scope.content.quantity_of_unit="";
      $scope.content.price_of_unit=null;
      $scope.content.cost_price=null;
      $scope.content.tax="0";
      $scope.content.sku="false";
      $scope.content.apply_tax="false";
      $scope.content.status=true;
      $scope.content.uom="";
      $scope.content.category="";
      $scope.content.brand="";
      //$scope.content.files=[];
      $scope.content.minimun_stock_level=0;
      //$('#deletebtn').click();
      $state.go($state.current, {}, {reload: $scope.isAdded});
    }


    var skipGrp= 0,takeGrp=100;
    $scope.taxGroup=[];
    $charge.tax().allgroups(skipGrp,takeGrp,"asc").success(function(data) {
      //debugger;
      skipGrp += takeGrp;
      // console.log(data);
      //if($scope.loading) {
      // returned data contains an array of 2 sentences
      for (var i = 0; i < data.length; i++) {
        $scope.taxGroup.push(data[i]);

      }
      $scope.loadTaxGrp(skipGrp,takeGrp);
    }).error(function(data) {
      //console.log(data);
    })


    $scope.loadTaxGrp= function (skipGrp,takeGrp) {
      $charge.tax().allgroups(skipGrp,takeGrp,"asc").success(function(data) {
        //debugger;
        skipGrp += takeGrp;
        // console.log(data);
        //if($scope.loading) {
        // returned data contains an array of 2 sentences
        for (var i = 0; i < data.length; i++) {
          $scope.taxGroup.push(data[i]);

        }
      }).error(function(data) {
        //console.log(data);
      })
    }
  }
})();
