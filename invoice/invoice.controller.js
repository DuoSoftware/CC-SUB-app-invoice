(function ()
{
	'use strict';

	angular
		.module('app.invoice')
		.controller('InvoiceController', InvoiceController);

	/** @ngInject */
	function InvoiceController($scope, $document, $timeout, $mdDialog, $mdMedia, $mdSidenav,$charge,$productHandler,$filter,$rootScope,notifications,$state,$http,$azureSearchHandle)
	{
		var vm = this;

		vm.appInnerState = "default";
		vm.pageTitle="Create New";
		vm.checked = [];
		vm.colors = ['blue-bg', 'blue-grey-bg', 'orange-bg', 'pink-bg', 'purple-bg'];
		vm.showFilters=true;
		vm.selectedInvoice = {};
		vm.toggleSidenav = toggleSidenav;

		vm.responsiveReadPane = undefined;
		vm.activeInvoicePaneIndex = 0;
		vm.dynamicHeight = false;

		vm.scrollPos = 0;
		vm.scrollEl = angular.element('#content');


		function gst(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
			}
			//
			return null;
		}

		///
		//////////
		////////////
		/////////////
		$scope.issubscriptionappuse = true; // if subscription module uses this is true else false
		if(gst("category") === 'invoice') {
			$scope.issubscriptionappuse = false;//"invoice";
		}
		/////////////
		///////////
		//////
		////


		//vm.invoices = Invoice.data;
		//console.log(vm.invoices);
		//invoice data getter !
		//vm.selectedInvoice = vm.invoices[0];
		vm.selectedMailShowDetails = false;


		// Methods
		vm.checkAll = checkAll;
		vm.closeReadPane = closeReadPane;
		vm.addInvoice = toggleinnerView;
		vm.isChecked = isChecked;
		vm.selectInvoice = selectInvoice;
		vm.toggleStarred = toggleStarred;
		vm.toggleCheck = toggleCheck;
		vm.closeInfoPane = closeInfoPane;
		vm.isAutoDisabled = false;
		$scope.showInpageReadpane = false;

		//////////

		// Watch screen size to activate responsive read pane
		$scope.$watch(function ()
		{
			return $mdMedia('gt-md');
		}, function (current)
		{
			vm.responsiveReadPane = !current;
		});

		// Watch screen size to activate dynamic height on tabs
		$scope.$watch(function ()
		{
			return $mdMedia('xs');
		}, function (current)
		{
			vm.dynamicHeight = current;
		});






		/**
		 * Select product
		 *
		 * @param product
		 */

		function extractEmailTemplate(paymentData, callback) {
			$scope.currEmailTemplate = $scope.tempSelectedTemplate;
			//Removing meta data
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<!doctype html>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<html lang="en">', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<head>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<meta name="viewport"', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<meta http-equiv="X-UA-Compatible" content="ie=edge">', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<meta charset="UTF-8">', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<title>Document</title>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('</head>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('<body>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('</body>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('</html>', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.trim();

			//Adding payment information
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%companyName%', $scope.content.companyName);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%companyPhone%', $scope.content.companyPhone);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%companyEmail%', $scope.content.companyEmail);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%companyAddress%', $scope.content.companyAddress);
			if($scope.emailTemplateName == 'emailTemplate3.html' || $scope.emailTemplateName == 'emailTemplate4.html')
				$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%companyLogo%', $scope.content.companyLogo);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%personName%', vm.selectedInvoice.person_name);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%otherName%', '');
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%bill_addr%', vm.selectedInvoice.bill_addr);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%phone%', vm.selectedInvoice.phone);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%email_addr%', vm.selectedInvoice.email_addr);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%invoiceNo%', vm.selectedInvoice.invoiceNo);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%invoiceDate%', $filter('date')(new Date(vm.selectedInvoice.invoiceDate), 'MMMM d, y', null));
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%dueDate%', vm.selectedInvoice.dueDate);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%invoiceDate% - %dueDate%', $filter('date')(new Date(vm.selectedInvoice.invoiceDate), 'yyyy.MM.dd', null) +' - '+ $filter('date')(new Date(vm.selectedInvoice.dueDate), 'yyyy.MM.dd', null));

			//list
			var listMarkup = "";
			angular.forEach(vm.selectedInvoice.invoiceDetails, function (item) {
				listMarkup += '<div class="list-header" style="padding: 7px 5px;overflow: hidden;"><div style="color: #555;width: 20%;float: left;">'+item.name+'</div><div style="color: #555;width: 20%;float: left;text-align: right">'+item.unitPrice+'</div><div style="width: 2%;float: left;height: 10px;"></div><div style="color: #555;width: 18%;float: left">1</div><div style="color: #555;width: 20%;float: left">'+item.promotion+'</div><div style="color: #555;width: 20%;float: left;text-align: right">'+item.unitPrice+'</div></div>';
			});
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%listItems%', listMarkup);

			//Sub details
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%additionalcharge%', vm.selectedInvoice.rate);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%discAmt%', vm.selectedInvoice.discAmt);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%discount%', vm.selectedInvoice.discount);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%subTotal%', vm.selectedInvoice.subTotal);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%tax%', vm.selectedInvoice.tax);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%invoiceAmount%', vm.selectedInvoice.invoiceAmount);

			//Footer
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%greeting%', $scope.content.greeting);
			$scope.currEmailTemplate = $scope.currEmailTemplate.replace('%disclaimer%', $scope.content.disclaimer);
			callback();
		}

		function selectInvoice(invoice)
		{
			// vm.selectedInvoice = invoice;
			vm.selectedInvoice=$scope.openInvoiceLst(invoice);
			vm.showFilters=false;
			$scope.showInpageReadpane = true;
			// $timeout(function ()
			// {
			// 	vm.activeInvoicePaneIndex = 1;
			//
			// 	// Store the current scrollPos
			// 	vm.scrollPos = vm.scrollEl.scrollTop();
			//
			// 	// Scroll to the top
			// 	vm.scrollEl.scrollTop(0);
			// });
		}

		function closeInfoPane() {
			$scope.showInpageReadpane = false;
		}

		/**
		 * Close read pane
		 */
		function closeReadPane()
		{
			vm.activeInvoicePaneIndex = 0;
			vm.showFilters=true;
			$timeout(function ()
			{
				vm.scrollEl.scrollTop(vm.scrollPos);
			}, 650);
		}

		/**
		 * Toggle starred
		 *
		 * @param mail
		 * @param event
		 */
		function toggleStarred(mail, event)
		{
			event.stopPropagation();
			mail.starred = !mail.starred;
		}

		/**
		 * Toggle checked status of the mail
		 *
		 * @param invoice
		 * @param event
		 */
		function toggleCheck(invoice, event)
		{
			if ( event )
			{
				event.stopPropagation();
			}

			var idx = vm.checked.indexOf(invoice);

			if ( idx > -1 )
			{
				vm.checked.splice(idx, 1);
			}
			else
			{
				vm.checked.push(invoice);
			}
		}

		/**
		 * Return checked status of the invoice
		 *
		 * @param invoice
		 * @returns {boolean}
		 */
		function isChecked(invoice)
		{
			return vm.checked.indexOf(invoice) > -1;
		}

		/**
		 * Check all
		 */
		function checkAll()
		{
			if ( vm.allChecked )
			{
				vm.checked = [];
				vm.allChecked = false;
			}
			else
			{
				angular.forEach(vm.invoices, function (invoice)
				{
					if ( !isChecked(invoice) )
					{
						toggleCheck(invoice);
					}
				});

				vm.allChecked = true;
			}
		}


		/**
		 * Toggle sidenav
		 *
		 * @param sidenavId
		 */
		function toggleSidenav(sidenavId)
		{
			$mdSidenav(sidenavId).toggle();
		}

		/**
		 * Toggle innerview
		 *
		 */

		function toggleinnerView(){
			if(vm.appInnerState === "default"){
				//vm.appInnerState = "add";
				vm.pageTitle="View Invoices";
				vm.showFilters=false;
			}else{
				if(vm.editInvoice != undefined && vm.editInvoice.$dirty ){
					var confirm = $mdDialog.confirm()
						.title('Are you sure?')
						.textContent('Fields have changed and you might have unsaved data. Are you sure you want to leave this page?')
						.ariaLabel('Are you sure?')
						.targetEvent()
						.ok('Yes')
						.cancel('Stay');

					$mdDialog.show(confirm).then(function() {
						vm.editInvoice.$pristine = false;
						vm.editInvoice.$dirty = false;
						$scope.clearFields();
						vm.appInnerState = "default";
						vm.pageTitle="Create New";
						vm.showFilters=true;
					}, function() {
					});
				}else {
					vm.appInnerState = "default";
					vm.pageTitle="Create New";
					vm.showFilters=true;
				}
			}
		}

		//addCtrl

		//var skip=0;
		//var take=100;
		$scope.a = {};
		$scope.content = {};
		$scope.content = {};
		$scope.a.amountMod=0;
		$scope.a.quantity=1;
		$scope.invoicetypes = ['One Time', 'Installment', 'Recurring'];
		$scope.frequencies = ['Weekly', 'Monthly', 'Daily', 'Yearly'];
		$scope.categories=['Customer','Supplier','Dealer'];
		$scope.companyLogo="";
		var isValid=false;
		$scope.content={};
		$scope.promotionObj={};
		$scope.productlist=[];
		$scope.isBaseCurrency=true;
		$scope.rows=[];
		$scope.content.stat=false;
		$scope.content.invoiceDate = new Date();
		$scope.content.dueDate=new Date();
		$scope.content.netamt=0;
		$scope.content.invoiceType='One Time';
		if($scope.content.invoiceType=='One Time')
			$scope.content.occurrence=0;
		$scope.content.gupromotionid="";
		$scope.content.promocode="";
		$scope.content.discount=0;
		$scope.content.additionalcharge=0;
		$scope.content.advance=true;

		$scope.content.PromoAmt=0;
		$scope.content.taxAmt=0;
		$scope.tempProduct=[];
		$scope.tempTaxArray=[];
		$scope.promoLists=[];
		$scope.content.status="credit";
		$scope.paymentMethods=['Cash','Card'];
		$scope.last=false;
		var prefixInvoice;
		var lenPrefix;
		var lenQuotPrefix;
		var prefixQuotation;
		var prefixQLength=0;
		$scope.invoiceTerms=[];
		$scope.content.invoiceTerm="DueonReceipt";

		var dataInvoice={};
		dataInvoice.RecordFieldData=localStorage.getItem("invoicePrefix");
		invoicePrefix=dataInvoice;
		prefixInvoice=localStorage.getItem("invoicePrefix");


		vm.discountEnabled=true;
		vm.sendAutoMail=false;
		vm.allowPartial=false;
		vm.itemTotal = 0;
		//$scope.isRowDisabled=true;


		var dataInvoice1={}
		dataInvoice1.RecordFieldData=localStorage.getItem("prefixLength");
		prefixLength=dataInvoice1;
		lenPrefix=dataInvoice1.RecordFieldData;


		$charge.settingsapp().getDuobaseValuesByTableName("CTS_CompanyAttributes").success(function(data) {
			$scope.CompanyProfile=data;
			$scope.content.companyName=data[0].RecordFieldData;
			$scope.content.companyAddress=data[1].RecordFieldData;
			$scope.content.companyPhone=data[2].RecordFieldData;
			$scope.content.companyEmail=data[3].RecordFieldData;
			$scope.content.companyLogo=data[4].RecordFieldData;
			$scope.content.companyLogo=(data[4].RecordFieldData=="")?"":data[4].RecordFieldData=="Array"?"":data[4].RecordFieldData;
		}).error(function(data) {
			$scope.CompanyProfile=[];
		})


		$charge.settingsapp().getDuobaseValuesByTableName("CTS_FooterAttributes").success(function(data) {
			$scope.FooterData=data;
			$scope.content.greeting=data[0].RecordFieldData;
			$scope.content.disclaimer=data[1].RecordFieldData!=""?atob(data[1].RecordFieldData):"";
		}).error(function(data) {
		})

		$charge.settingsapp().getDuobaseValuesByTableName("CTS_QuotationAttributes").success(function(data) {
			//
			prefixQuotation=data[0].RecordFieldData!=""?data[0].RecordFieldData:"";
			prefixQLength=data[1];
			lenQuotPrefix=prefixQLength!=0? parseInt(prefixQLength.RecordFieldData):0;

		}).error(function(data) {
			prefixQuotation="";
			lenQuotPrefix=0;
		})

		$charge.settingsapp().getDuobaseValuesByTableName("CTS_InvoiceAttributes").success(function(data) {
			//
			vm.discountEnabled=data[2].RecordFieldData==""?true:data[2].RecordFieldData=="1"?false:true;
			vm.sendAutoMail=data[3].RecordFieldData==""?false:data[3].RecordFieldData=="1"?true:false;
			vm.allowPartial=data[5].RecordFieldData==""?false:true;
			$scope.invoiceTerms = data[8].RecordFieldData != "" ? JSON.parse(data[8].RecordFieldData) : "";
			$scope.invoiceReminders = data[6].RecordFieldData != "" ? JSON.parse(data[6].RecordFieldData) : [];
		}).error(function(data) {
			$scope.invoiceReminders=[];
		})



		var isSubmitValid=true;
		$scope.showConfirmation = function(ev) {
			if(document.querySelector('input[name=acQuotation]').innerText != ""){
				$scope.isInvoiceQuoteEmpty = false;
			}
			// Appending dialog to document.body to cover sidenav in docs app
			//if($scope.content.invoiceType == "One Time" && $scope.content.category!=undefined) {
			if (vm.editInvoice.$valid == true) {

				for(var i=0;i<$scope.rows.length;i++) {
					//
					if($scope.rows[i].product==null) {
						self.searchText[i]='';
						isSubmitValid=false;
						break;
					}
				}
				if(isSubmitValid) {
					var confirm = $mdDialog.confirm()
						.title('Would you like to proceed Invoice?')
						.textContent('You cannot revert this action again for a active Invoice!')
						.ariaLabel('Lucky day')
						.targetEvent(ev)
						.ok('Please do it!')
						.cancel('No!');

					$mdDialog.show(confirm).then(function () {
						$scope.submit();
					}, function () {

					});
				}
				else
				{
					isSubmitValid=true;
				}
			}else{
				angular.element(document.querySelector('#invoiceForm')).find('.ng-invalid:visible:first').focus();
			}
			//}
			//else
			//{
			//  if($scope.content.frequency!=undefined && $scope.content.category!=undefined) {
			//    var confirm = $mdDialog.confirm()
			//      .title('Would you like to proceed Invoice?')
			//      .textContent('You cannot revert this action again for a active Invoice!')
			//      .ariaLabel('Lucky day')
			//      .targetEvent(ev)
			//      .ok('Please do it!')
			//      .cancel('No!');
			//
			//    $mdDialog.show(confirm).then(function () {
			//      $scope.submit();
			//    }, function () {
			//
			//    });
			//}
			//}
		};

		$scope.paymentMethodHandler =  function (selection){
			if(selection=='cash'){
				vm.editInvoice.paymentMethod = 'cash';
			}else{
				vm.editInvoice.paymentMethod = 'credit';
			}
		}

		$scope.isInvoiceQuoteEmpty = true;

		$scope.submit = function () {

			$scope.isAdded = false;
			//if($scope.content.bill_addr!="") {
			if (vm.editInvoiceForm.$valid == true) {
				vm.submitted = true;
				$scope.spinnerInvoice = true;
				$scope.invoiceDetails = [];
				$scope.productsDet = [];
				//if (!isValid) {    // this is to validate promotion if needs
				//
				var unitPrice = vm.editInvoice.amount = (vm.itemTotal + vm.editInvoice.additionalcharge - vm.editInvoice.discount);
				vm.editInvoice.invoiceType = "Manual";

				for (var i = 0; i < $scope.rows.length; i++) {
					var productObj = $scope.rows[i].product;
					var totalPrice = $scope.rows[i].rowAmtDisplay;

					var promotion = 0;
					if($scope.rows[i].promotion)
					{
						promotion = $scope.rows[i].promotion;
					}

					var promotionId = '';
					if($scope.rows[i].promotionId)
					{
						promotionId = $scope.rows[i].promotionId;
					}
debugger;
					var qty = $scope.rows[i].qty;
					var unitPrice = $scope.rows[i].rowAmtDisplay;
					// var unitPrice = calcAmt[i].rowAmt;
					if (productObj != null) {
						$scope.invoiceDetails.push({
							paid: "false",
							paidAmount: 0,
							taxAmount: productObj.taxAmount,
							qty: qty,
							itemDescription: "",
							itemType: "",
							guItemID: productObj.guproductID,
							lineID: "",
							totalPrice: totalPrice,
							unitPrice: unitPrice,
							discount: promotion,
							startDate: vm.editInvoice.invoiceDate,
							uom: "",
							subTotal: totalPrice,
							promotionId: promotionId,
							"code":productObj.code
						});
					}
				}

				if($scope.rows.length <= 0){

					notifications.toast("Please add invoice products", "Error");
					$scope.isAdded = false;
					vm.submitted = false;
					return;

				}


				if(vm.editInvoice.invoiceOccurence != "Installment")
				{
					vm.editInvoice.occurence = -1;
				}

				if(!vm.editInvoice.promotion)
				{
					vm.editInvoice.promotion = '';
				}

				var accountID = vm.editInvoice.profile.profileId;
				var invoiceAmount = vm.itemTotal + vm.editInvoice.additionalcharge - vm.editInvoice.discount;
				var moduleType = $scope.issubscriptionappuse ? 'subscription' : 'invoice';

				if(vm.editInvoice.invoiceInterval === undefined)
				{
					vm.editInvoice.invoiceInterval = -1;
				}

				var req = {
					"email": vm.editInvoice.profile.email,
					"products": $scope.invoiceDetails,
					"note": vm.editInvoice.remarks,
					"startDate": $filter('date')(new Date(vm.editInvoice.invoiceDate), 'yyyy-MM-dd'),
					"invoiceType": vm.editInvoice.invoiceOccurence,
					"invoicePeriod": vm.editInvoice.invoiceingPeriod,
					"invoiceInterval": vm.editInvoice.invoiceInterval,
					"occurrence": vm.editInvoice.occurence,
					"payMethod": vm.editInvoice.paymentMethod,
					"otherDisc": vm.editInvoice.discount,
					"miscCharges": vm.editInvoice.additionalcharge,
					"gupromotionId": vm.editInvoice.gupromotionId,
					"moduleType" : moduleType
				}

				$charge.invoicing().insert(req).success(function (data) {
					if (data != null || data != undefined) {
						notifications.toast("Invoice has been processed", "success");
						$scope.isAdded = true;
						$scope.clearFields();
					}
					else {
						$mdDialog.show(
							$mdDialog.alert()
								.parent(angular.element(document.querySelector('#invoice')))
								.clickOutsideToClose(false)
								.title('Error')
								.textContent('An error occurred. Please try again in a few minutes.')
								.ariaLabel('Alert Dialog Demo')
								.ok('Ok'));
						$scope.isAdded = false;
					}
					vm.submitted = false;
				}).error(function (data) {
					notifications.toast("Error while creating invoice", "error");
					$scope.clearFields();
					vm.submitted = false;
				})
			}
		}




		$scope.clearFields= function () {
			vm.editInvoiceForm.$setPristine();
			vm.editInvoiceForm.$setUntouched();
			$scope.rows=[];
			$scope.promoLists=[];
			vm.submitted=false;
			$scope.tempProduct=[];
			$scope.tempTaxArray=[];
			$scope.addNewRow();
			$scope.content.stat=false;
			$scope.content.invoiceDate = new Date();
			$scope.content.dueDate=new Date();
			$scope.content.netamt=0;
			$scope.content.invoiceType='One Time';
			if($scope.content.invoiceType=='One Time')
				$scope.content.occurrence=0;
			$scope.content.gupromotionid="";
			$scope.content.promocode="";
			self.searchPromo=null;
			$scope.content.notes="";
			$scope.content.discount=0;
			$scope.content.additionalcharge=0;
			$scope.content.PromoAmt=0;
			$scope.content.taxAmt=0;
			$scope.content.category="Customer";
			self.searchText=[];
			self.searchProfile="";
			self.searchQuotation    = "";
			$scope.content.bill_addr = "";
			$scope.filteredUsers=[];
			$scope.content.payMethod="";
			$scope.content.payAmt="";
			$scope.content.status="credit";
			$scope.content.preferredCurrency=$scope.baseCurrency;
			$scope.content.invoiceTerm="Custom";
			$scope.content.frequency="";
			rate=1;
			$scope.exchangeRate="";
			$scope.divEnabled = true;
			$scope.requiredStatus =false;
			insufficientStocks=[];
			$scope.productsDet=[];
			$scope.products=[];
			// $scope.loadAllProducts(0,100);
			// $scope.loadA
			$state.go($state.current, {}, {reload: $scope.isAdded});

		};


		/*
		 Pay For Invoice
		 */

		$scope.payForInvoice= function (invoice) {
			//
			var confirm = $mdDialog.confirm()
				.title('Confirmation')
				.textContent('Pay the full payment of '+invoice.invoiceAmount+' to this invoice?')
				.ariaLabel('Lucky day')
				.ok('Yes')
				.cancel('No');

			$mdDialog.show(confirm).then(function () {
				var req={
					"customer": invoice.first_name,
					"guCustomerID": invoice.profileId,
					"guAccountID": invoice.profileId,
					"paymentDate": new Date(),
					"paymentMethod": "Cash",
					"amount": invoice.invoiceAmount/invoice.rate,
					"bankCharges": "0",
					"currency":invoice.currency,
					"rate":invoice.rate,
					"note": "note1",
					"guTranID": "12345",
					"guInvID":invoice.guInvID
				}
				$charge.payment().makePaymentForInvoice(req).success(function (data) {
					//
					$scope.paymentPrefix=localStorage.getItem("paymentPrefix");
					$scope.paymentPrefix=($scope.paymentPrefix!=null)?localStorage.getItem("paymentPrefix"):($scope.paymentPrefix!=undefined)?localStorage.getItem("paymentPrefix"):"";
					var prefixLengthPayment=localStorage.getItem("paymentPrefixLength");
					$scope.lenPrefixPayment=prefixLengthPayment!=0? parseInt(prefixLengthPayment):0;
					var paymentNum=$filter('numberFixedLen')(data.id,$scope.lenPrefixPayment);
					var referenceNo=$scope.paymentPrefix+paymentNum;
					$scope.showValidationDialog('info','Your payment has been successfully done. Your payment reference no - ' + referenceNo,'Success Payment')
					vm.selectedInvoice.invoiceStatus='Paid';
				}).error(function (data) {
					$scope.showValidationDialog('info','Unexpected error occurred while make payment.','Error');
				})
			}, function () {

			});


		}

		/*
		 Cancel Invoice
		 */
		$scope.cancelInvoice= function (invoice) {
			//

			var confirm = $mdDialog.confirm()
				.title('Confirmation')
				.textContent('Do you want to cancel this invoice?')
				.ariaLabel('Lucky day')
				.ok('Yes')
				.cancel('No');

			$mdDialog.show(confirm).then(function () {
				var stock=[];
				for(var i=0;i<invoice.invoiceDetails.length;i++)
				{
					var productObj=invoice.invoiceDetails[i];
					if (productObj.sku) {
						var req={
							"itemID":productObj.productId ,
							"itemCode": productObj.code,
							"qty": productObj.gty,
							"guTranID": "123456",
							"UpdateStockType": "Add"
						}
						stock.push(req);
					}
				}
				var req={
					"Stock": stock,
					"Billing": {
						"invoiceNo": invoice.code,
						"isTransaction": true,
						"guTranId": ""
					},
					"isTransaction": true,
					"guAccountID": invoice.profileId
				}

				$charge.flowtrans().cancelBilling(req).success(function (data) {
					//
					$scope.showValidationDialog('info',data.message,'Success');
					vm.selectedInvoice.invoiceStatus='void';
				}).error(function (data) {
					$scope.showValidationDialog('info',data.message,'Error');
				})
			}, function () {

			});

		}

		//newly added code
		var skipProd=0;
		var takeProd=10;
		$scope.loading = true;
		$scope.more = function(){
			$scope.isSpinnerShown=true;
			//
			$productHandler.getClient().CustomLoadProductByScroll(skipProd,takeProd).onComplete(function(data)
			{
				//
				//if(data.length<takeProd)
				//  $scope.last=true;
				if($scope.loading) {
					for (var i = 0; i < data.length; i++) {
						$scope.productlist.push(data[i]);
					}
				}
				//
				$scope.loading = false;
				skipProd += takeProd;
				$scope.addNewRow();
				$scope.isSpinnerShown=false;
			}).onError(function(data)
			{
				$scope.isSpinnerShown=false;
				$scope.last=true;
				$scope.addNewRow();

			});
		};
		// we call the function twice to populate the list
		//$scope.more();




		//08-09-2016
		var skip,take;
		var tempList;
		var autoElem = angular.element('#invoice-auto');
		//$scope.searchMre=false;
		$scope.loadByKeyword= function (keyword,rows,index,status) {
			$scope.waitForProductKeyword=keyword;
			if(!rows[index].searchMre) {
				//
				if ($scope.productlist.length == 10) {
					if (keyword != undefined) {
						if (keyword.length == 3) {
							rows[index].isAutoDisabled = true;
							skip = 0;
							take = 100;
							tempList = [];
							rows[index].productlst = [];
							$charge.product().filterByKey(keyword, skip, take).success(function (data) {
								for (var i = 0; i < data.length; i++) {
									tempList.push(data[i]);
								}
								rows[index].productlst = tempList;
								rows[index].isAutoDisabled = false;
								var rowId=rows[index].productId;
								var rowId='#'+rowId;
								setTimeout(function(){
									document.querySelector(rowId).focus();
								},0);
								//

								if (data.length < take)
									rows[index].searchMre = true;
								$timeout.cancel($scope.waitForProduct);
								//skip += take;
								//$scope.loadPaging(keyword, rows, index, status, skip, take);
							}).error(function (data) {
								rows[index].isAutoDisabled = false;
								autoElem.empty();

								var rowId=rows[index].productId;
								var rowId='#'+rowId;
								setTimeout(function(){
									document.querySelector(rowId).focus();
								},0);
								//
								//vm.products = [];
								//vm.selectedProduct = null;
							});
						}
						else if(keyword.length>3)
						{
							//
							skip = 0;
							take = 100;
							tempList = [];
							rows[index].isAutoDisabled = true;
							rows[index].productlst = [];
							$charge.product().filterByKey(keyword, skip, take).success(function (data) {
								for (var i = 0; i < data.length; i++) {
									tempList.push(data[i]);
								}
								rows[index].productlst = tempList;
								rows[index].isAutoDisabled = false;
								if (data.length < take)
									rows[index].searchMre = true;
								$timeout.cancel($scope.waitForProduct);

								var rowId=rows[index].productId;
								var rowId='#'+rowId;
								setTimeout(function(){
									document.querySelector(rowId).focus();
								},0);
							}).error(function (data) {
								rows[index].isAutoDisabled = false;
								autoElem.empty();
								var rowId=rows[index].productId;
								var rowId='#'+rowId;
								setTimeout(function(){
									document.querySelector(rowId).focus();
								},0);
							});
						}
						else if (keyword.length == 0 || keyword == null) {
							rows[index].productlst = $scope.productlist;
							rows[index].searchMre = false;
						}
					}
					else if (keyword == undefined) {
						rows[index].productlst = $scope.productlist;
						rows[index].searchMre = false;
					}
				}
			}
			else if (keyword == undefined || keyword.length == 0) {
				rows[index].productlst = $scope.productlist;
				rows[index].searchMre = false;
			}
			//else if(keyword.length>3)
			//{
			//
			//  if(!$scope.searchMre)
			//  {
			//    $scope.loadByKeyword(keyword,rows,index,status);
			//  }
			//}
		}

		var currencyDetails = [];

		$scope.validateProduct= function (row,index,existingRow) {
			if(row!=null) {
				if($scope.issubscriptionappuse){
					var existingProduct = $filter('filter')($scope.tempProduct, { productId: row.guPlanID })[0];
					//
					if (existingProduct!=null) {

						notifications.toast("Product has been already taken.", "error");
						//var itemIndex = $scope.tempProduct.indexOf(existingProduct);
						self.searchText.splice(index, 1);
					}
					else
					{
						//
						//$scope.tempProduct.push({
						//  productId:row.guPlanID
						//});

						$scope.tempProduct.splice(index, index, {
							productId:row.guPlanID
						});

					}
				}else{
					var existingProduct = $filter('filter')($scope.tempProduct, { productId: row.guproductID })[0];
					//
					if (existingProduct!=null) {

						notifications.toast("Product has been already taken.", "error");
						//var itemIndex = $scope.tempProduct.indexOf(existingProduct);
						self.searchText.splice(index, 1);
					}
					else
					{
						//
						//$scope.tempProduct.push({
						//  productId:row.guproductID
						//});

						$scope.tempProduct.splice(index, index, {
							productId:row.guproductID
						});

					}
				}

				$scope.calcQty(row,index);

			}
			else
			{


				if(existingRow.qty!=undefined)
				{
					var existingProd = currencyDetails[index];
					//var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
					if(existingProd.status=="new") {
						var val = existingProd.rowAmt;
						if ($scope.tempTaxArray.length != 0)
							var taxVal = $scope.tempTaxArray[index] == undefined ? 0 : $scope.tempTaxArray[index].taxAmt;
						else
							var taxVal = 0;
					}
					else
					{
						if(existingProd.status=="initial") {
							if(existingProd.stockstatus == "initial") {
								var taxVal = 0;
								var val = 0;
							}
							else
							{
								var val = existingProd.rowAmt;
								if ($scope.tempTaxArray.length != 0)
									var taxVal = $scope.tempTaxArray[index] == undefined ? 0 : $scope.tempTaxArray[index].taxAmt;
								else
									var taxVal = 0;
							}
						}
						else
						{
							var val = existingProd.rowAmt;
							if ($scope.tempTaxArray.length != 0)
								var taxVal = $scope.tempTaxArray[index] == undefined ? 0 : $scope.tempTaxArray[index].taxAmt;
							else
								var taxVal = 0;
						}
					}
					//var taxVal = $scope.tempTaxArray[index].taxAmt;
					$scope.content.netamt = $scope.content.netamt - (val*existingProd.qty);
					$scope.content.taxAmt = $scope.content.taxAmt - taxVal;
					//if(row.product ==null)
					//$scope.content.PromoAmt = $scope.content.PromoAmt - existingRow.promotion;
					currencyDetails.splice(index, 1);
					$scope.tempProduct.splice(index, 1);
					$scope.tempTaxArray.splice(index, 1);
					existingRow.qty = 1;
					existingRow.taxDisplay = 0;
					existingRow.promotion = 0;
					existingRow.rowAmtDisplay = "";
					existingRow.product = null;
				}
				else
				{
					currencyDetails.splice(index, 1);
					$scope.tempProduct.splice(index, 1);
				}
			}

		}

		$scope.calcQty=function(row,index)
		{


			if($scope.rows[index].product!=null) {

				$scope.rows[index].product.taxAmount = 0;

				if($scope.rows[index].product.rate === undefined)
				{$scope.rows[index].product.rate = 1;}

				if($scope.rows[index].product.taxID !=undefined) {
					$charge.billing().calcTax($scope.rows[index].product.taxID, $scope.rows[index].product.unitPrice / $scope.rows[index].product.rate).success(function (data) {
						$scope.rows[index].product.taxAmount = data.tax;
						if ($scope.issubscriptionappuse) {
							$scope.rows[index].rowAmtDisplay = ($scope.rows[index].product.unitPrice * $scope.rows[index].qty) + $scope.rows[index].product.taxAmount;
						} else {
							$scope.rows[index].rowAmtDisplay = ($scope.rows[index].product.price_of_unit * $scope.rows[index].qty) + $scope.rows[index].product.taxAmount;
						}
					}).error(function (data) {
						$scope.rows[index].product.taxAmount = 0;
					});
				}

				if($scope.issubscriptionappuse)
				{
					$scope.rows[index].rowAmtDisplay = ($scope.rows[index].product.unitPrice * $scope.rows[index].qty)+$scope.rows[index].product.taxAmount;
				}else {
					$scope.rows[index].rowAmtDisplay = ($scope.rows[index].product.price_of_unit * $scope.rows[index].qty)+$scope.rows[index].product.taxAmount;
				}
			}
			else
			{
				$scope.rows[index].rowAmtDisplay = $scope.rows[index].rowAmtDisplay * $scope.rows[index].qty;
			}
		}



		$scope.calcItemAmt=function(row,index)
		{
			row.quotationRowDetailsLoaded = false;
//
			if(row.product.sku!=0) {
				$charge.stock().getStock(row.product.productId).success(function (data) {
					stockAvailable = data.qty;
					if (row.qty <= stockAvailable) {
						var incrementQtyProd = currencyDetails[index];
						incrementQtyProd.qty=row.qty;
						currencyDetails.splice(index,1);
						currencyDetails.splice(index,index,incrementQtyProd);
						if(incrementQtyProd.status=="new") {
							currencyDetails[index]["status"] = "initial";
							currencyDetails[index]["stockstatus"] = "new";
						}
						else if(incrementQtyProd.status=="initial")
							currencyDetails[index]["status"]="old";
						//vm.submitted=false;
						var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
						if(insufficientStockDet!=null || insufficientStockDet!=undefined) {
							var itemIndex = insufficientStocks.indexOf(insufficientStockDet);
							insufficientStocks.splice(itemIndex);
						}
						//
						if(insufficientStocks.length==0)
							vm.submitted=false;
						$scope.calcTotal(row,index);
						if(row.product.apply_tax!=0) {
							$scope.spinnerInvoice = true;
							//
							$charge.billing().calcTax(row.product.tax, row.product.price_of_unit/rate).success(function (data) {
								if($scope.content.preferredCurrency!=undefined) {
									row.tax = rate*data.tax;
									row.taxDisplay=(Math.round(rate*data.tax * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));

								}
								else
								{
									row.tax = data.tax;
									row.taxDisplay=(Math.round(data.tax* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
								}
								var existingTax = $filter('filter')($scope.tempTaxArray, {taxIndex:row.product.productId })[0];
								if (existingTax==undefined) {
									//$scope.tempTaxArray.push({
									//  taxIndex:row.product.productId,
									//  taxAmt:row.tax,
									//  taxDisplay:row.taxDisplay,
									//  baseAmt:data.tax
									//});
									$scope.tempTaxArray.splice(index, index, {
										taxIndex:row.product.productId,
										taxAmt:row.tax,
										taxDisplay:row.taxDisplay,
										baseAmt:data.tax
									});
									//
									row.quotationRowDetailsLoaded = true;
									$scope.content.taxAmt=0;
									for(var i=0;i<$scope.tempTaxArray.length;i++)
									{
										$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
									}

								}
								else
								{
									//var index=$scope.tempTaxArray.indexOf(existingTax);
									//$scope.tempTaxArray.splice(index,1);
									//$scope.tempTaxArray.push({
									//    taxIndex:row.product.productId,
									//    taxAmt:row.tax,
									//    baseAmt:data.tax
									//});
									existingTax.taxAmt=row.tax;
									$scope.content.taxAmt=0;
									for(var i=0;i<$scope.tempTaxArray.length;i++)
									{
										$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
									}
									row.quotationRowDetailsLoaded = true;
								}
								$scope.spinnerInvoice = false;
							}).error(function (data) {
								//17-10-2016
								$mdDialog.show(
									$mdDialog.alert()
										.parent(angular.element(document.querySelector('#invoice')))
										.clickOutsideToClose(false)
										.title('Error')
										.textContent('Unexpected error occured while calculating tax.')
										.ariaLabel('Alert Dialog Demo')
										.ok('Ok')).finally(function() {
									var rowId=row.qtyId;
									var rowId='#'+rowId;
									//setTimeout(function(){
									document.querySelector(rowId).focus();
									//},0);
								});

								$scope.spinnerInvoice = false;
								row.tax=0;
								row.taxDisplay=0;
								//$scope.tempTaxArray.push({
								//  taxIndex:row.product.productId,
								//  taxAmt:row.tax,
								//  taxDisplay:row.taxDisplay,
								//  baseAmt:0
								//});

								$scope.tempTaxArray.splice(index, index, {
									taxIndex:row.product.productId,
									taxAmt:row.tax,
									taxDisplay:row.taxDisplay,
									baseAmt:0
								});
								row.quotationRowDetailsLoaded = true;
							})
						}
						else
						{
							row.tax=0;
							row.taxDisplay=0;
							//$scope.tempTaxArray.push({
							//  taxIndex:row.product.productId,
							//  taxAmt:row.tax,
							//  taxDisplay:row.taxDisplay,
							//  baseAmt:0
							//});

							$scope.tempTaxArray.splice(index, index, {
								taxIndex:row.product.productId,
								taxAmt:row.tax,
								taxDisplay:row.taxDisplay,
								baseAmt:0
							});
							row.quotationRowDetailsLoaded = true;
						}
					}
					else {
						notifications.toast("Insufficient Stock", "error");

						var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
						if(insufficientStockDet==null || insufficientStockDet==undefined) {
							insufficientStocks.push(
								{
									"rowId": index,
									"productId": row.product.productId
								});
						}
						var existingProd = currencyDetails[index];
						if(existingProd.status=="new") {
							currencyDetails[index]["status"] = "initial";
							currencyDetails[index]["stockstatus"] = "initial";
						}
						else if(existingProd.status=="initial")
							currencyDetails[index]["status"]="old";
						//
						var val = existingProd.rowAmt;
						if($scope.tempTaxArray.length!=0)
							var taxVal = $scope.tempTaxArray[index]==undefined?0:$scope.tempTaxArray[index].taxAmt;
						else
							var taxVal=0;

						row.product = null;
						//vm.submitted=true;
						//if(insufficientStocks.length!=0)
						vm.submitted=true;
						row.quotationRowDetailsLoaded = true;
					}
					if($scope.promoLists.length!=0)
						$scope.chkClaimedPromo();
				}).error(function (data) {
					notifications.toast("Unexpected error while getting stock.", "error");
					row.qty = 1;
					//vm.submitted=true;
					//row.submitted=true;
					var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
					if(insufficientStockDet==null || insufficientStockDet==undefined) {
						insufficientStocks.push(
							{
								"rowId": index,
								"productId": row.product.productId
							});
					}

					//if(insufficientStocks.length!=0)
					vm.submitted=true;

					row.quotationRowDetailsLoaded = true;
				})
			}
			else
			{
				var incrementQtyProd = currencyDetails[index];
				incrementQtyProd.qty=row.qty;
				currencyDetails.splice(index,1);
				currencyDetails.splice(index,index,incrementQtyProd);
				if(incrementQtyProd.status=="new") {
					currencyDetails[index]["status"] = "initial";
					currencyDetails[index]["stockstatus"] = "new";
				}
				else if(incrementQtyProd.status=="initial")
					currencyDetails[index]["status"]="old";
				var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
				if(insufficientStockDet!=null || insufficientStockDet!=undefined) {
					var itemIndex = insufficientStocks.indexOf(insufficientStockDet);
					insufficientStocks.splice(itemIndex);
				}
				if(insufficientStocks.length==0)
					vm.submitted=false;
				$scope.calcTotal(row,index);
				if(row.product.apply_tax!=0) {
					$scope.spinnerInvoice = true;
					$charge.billing().calcTax(row.product.tax, row.product.price_of_unit/rate).success(function (data) {
						if($scope.content.preferredCurrency!=undefined) {
							row.tax = rate*data.tax;
							row.taxDisplay=(Math.round(rate*data.tax * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
						}
						else
						{
							row.tax = data.tax;
							row.taxDisplay=(Math.round(data.tax* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
						}
						var existingTax = $filter('filter')($scope.tempTaxArray, {taxIndex:row.product.productId })[0];
						if (existingTax==undefined) {
							//$scope.tempTaxArray.push({
							//  taxIndex:row.product.productId,
							//  taxAmt:row.tax,
							//  taxDisplay:row.taxDisplay,
							//  baseAmt:data.tax
							//});

							$scope.tempTaxArray.splice(index, index, {
								taxIndex:row.product.productId,
								taxAmt:row.tax,
								taxDisplay:row.taxDisplay,
								baseAmt:data.tax
							});
							row.quotationRowDetailsLoaded = true;
							$scope.content.taxAmt=0;
							for(var i=0;i<$scope.tempTaxArray.length;i++)
							{
								$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
							}

						}
						else
						{
							existingTax.taxAmt=row.tax;
							$scope.content.taxAmt=0;
							for(i=0;i<$scope.tempTaxArray.length;i++)
							{
								$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
							}
							row.quotationRowDetailsLoaded = true;
						}
						$scope.spinnerInvoice = false;
					}).error(function (data) {
						//17-10-2016
						$mdDialog.show(
							$mdDialog.alert()
								.parent(angular.element(document.querySelector('#invoice')))
								.clickOutsideToClose(false)
								.title('Error')
								.textContent('Unexpected error occured while calculating tax.')
								.ariaLabel('Alert Dialog Demo')
								.ok('Ok')).finally(function() {
							var rowId=row.qtyId;
							var rowId='#'+rowId;
							//setTimeout(function(){
							document.querySelector(rowId).focus();
							//},0);
						});
						$scope.spinnerInvoice = false;
						row.tax=0;
						row.taxDisplay=0;
						//$scope.tempTaxArray.push({
						//  taxIndex:row.product.productId,
						//  taxAmt:row.tax,
						//  taxDisplay:row.taxDisplay,
						//  baseAmt:0
						//});

						$scope.tempTaxArray.splice(index, index, {
							taxIndex:row.product.productId,
							taxAmt:row.tax,
							taxDisplay:row.taxDisplay,
							baseAmt:0
						});
						row.quotationRowDetailsLoaded = true;
					})
				}
				else
				{
					row.tax=0;
					row.taxDisplay=0;
					//$scope.tempTaxArray.push({
					//  taxIndex:row.product.productId,
					//  taxAmt:row.tax,
					//  taxDisplay:row.taxDisplay,
					//  baseAmt:0
					//});

					$scope.tempTaxArray.splice(index, index, {
						taxIndex:row.product.productId,
						taxAmt:row.tax,
						taxDisplay:row.taxDisplay,
						baseAmt:0
					});
					row.quotationRowDetailsLoaded = true;
				}

				if($scope.promoLists.length!=0)
					$scope.chkClaimedPromo();
			}
			//
			//if(self.searchPromo!=null)
			//{
			//  $scope.showValidationDialog('info','You have to apply promotion again after changes.','Notification');
			//  self.searchPromo=null;
			//  $scope.chkPromo(index);
			//}
			//

		}


		$scope.calcTotal=function(row,index)
		{
			//
			var calcAmtVal = $filter('filter')(calcAmt, { rowIndex: row.product.productId })[0];
			if (calcAmtVal== null || calcAmtVal == undefined) {
				calcAmt.push({
					rowIndex: row.product.productId,
					rowAmt: row.product.price_of_unit,
					rowAmtDisplay:(Math.round(row.product.price_of_unit* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint)),
					rate:rate
				});
				var calcAmtVal = $filter('filter')(calcAmt, { rowIndex: row.product.productId })[0];
			}
			else {
			}
			var unitPrice;
			if (row.qty == "" || row.qty == undefined) {
				convertedQty = 0;
				if(calcAmtVal== null || calcAmtVal == undefined) {
					unitPrice = calcAmt[index].rowAmt;
					row.product.price_of_unit = calcAmt[index].rowAmt;
					row.rowAmtDisplay=calcAmt[index].rowAmtDisplay;
				}
				else {
					row.product.price_of_unit = calcAmtVal.rowAmt;
					row.rowAmtDisplay=calcAmtVal.rowAmtDisplay;
					unitPrice=calcAmtVal.rowAmt;
				}
			}
			else
				convertedQty = parseInt(row.qty);
			var convertedQty, convertedAmt;
			var netTotal = 0;
			var count = 1;

			if(calcAmtVal== null || calcAmtVal == undefined) {
				unitPrice = calcAmt[index].rowAmt;
			}
			else {
				unitPrice=calcAmtVal.rowAmt;
			}
			convertedAmt = parseFloat(unitPrice);

			var totalAmt = convertedAmt * convertedQty;
			row.product.price_of_unit = totalAmt;
			row.rowAmtDisplay=(Math.round(row.product.price_of_unit* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
			for (var i = 0; i < $scope.rows.length; i++) {
				if($scope.rows[i].product!=null || $scope.rows[i].product!= undefined) {
					var perItem = $scope.rows[i].product.price_of_unit;
					netTotal += perItem;
				}
			}
			$scope.content.netamt = netTotal;
		}


		$scope.toggleSearchMre= function (rows,ev,index,txt,status) {

			if (ev.keyCode === 8) {
				$timeout.cancel($scope.waitForProduct);
				$scope.waitForProduct = $timeout(function myFunction() {
					rows[index].searchMre = false;
					if (txt.length == 1) {
						if (rows[index].qty != undefined) {
							var existingProd = currencyDetails[index];
							if(existingProd!=undefined || existingProd !=null)
								var val = existingProd.rowAmt;
							else
								var val=0;
							if($scope.tempTaxArray.length!=0)
								var taxVal = $scope.tempTaxArray[index]==undefined?0:$scope.tempTaxArray[index].taxAmt;
							else
								var taxVal=0;

							//var taxVal = $scope.tempTaxArray[index].taxAmt;
							$scope.content.netamt = $scope.content.netamt - val;
							$scope.content.taxAmt = $scope.content.taxAmt - taxVal;
							$scope.content.PromoAmt = $scope.content.PromoAmt - rows[index].promotion;
							currencyDetails.splice(index, 1);
							$scope.tempProduct.splice(index, 1);
							$scope.tempTaxArray.splice(index, 1);
							rows[index].qty = 1;
							rows[index].taxDisplay = 0;
							rows[index].promotion = 0;
							rows[index].rowAmtDisplay = "";
							rows[index].product = null;
						}
						else {
							currencyDetails.splice(index, 1);
							$scope.tempProduct.splice(index, 1);
						}
					}
					$scope.loadByKeyword($scope.waitForProductKeyword,rows,index,status);
				},1000);
			}
		}

		//$scope.disableLoader= function (previous,index) {
		//  if(previous)
		//}



		$scope.loadPaging= function (keyword,rows,index,status,skip, take) {
			$charge.product().filterByKey(keyword, skip, take).success(function (data) {
				for(var i=0;i<data.length;i++)
				{
					tempList.push(data[i]);
				}
			}).error(function (data) {
				if(tempList.length>0) {
					rows[index].productlst = tempList;
				}
			});
		}
		//newly added code end


		//11-10-2016
		/*
		 Due date changes added started
		 */
		$scope.changeDueDate= function (ev) {
			//
			if(ev!="Custom") {
				if(ev!="DueonReceipt")
				{
					var changedDueDate = moment($scope.content.invoiceDate).add(parseInt(ev.termDays), 'day')._d;
					$scope.content.dueDate = changedDueDate;
				}
				else
				{
					$scope.content.dueDate = $scope.content.invoiceDate;
				}
			}
		}

		$scope.getDueDate= function () {
			//
			$scope.content.invoiceTerm="Custom";
			if($scope.content.dueDate<$scope.content.invoiceDate)
			{
				notifications.toast("Due date cannot be less than invoice date.", "error");
				$scope.content.dueDate=$scope.content.invoiceDate;
			}
		}
		/*
		 Due date changes added finished
		 */

		//
		var self = this;
		//self.searchText=[];
		//self.searchText.push({searchText:{searchText1:""}},{searchText:{searchText2:""}},{searchText:{searchText3:""}},{searchText:{searchText4:""}},{searchText:{searchText5:""}});
		//self.tenants        = loadAll();
		self.selectedItem  = null;
		self.searchText    = [];
		//
		$scope.querySearch =function(query,index) {
			//
			//Custom Filter
			var results=[];
			if(!isQuotation) {
				for (var i = 0;i < $scope.rows[index].productlst.length; i++) {

					//console.log($scope.allBanks[i].value.value);
					//
					//if($scope.rows[index].productlst[i].product_name.toLowerCase().indexOf(query.toLowerCase()) !=-1)
					{
						if ($scope.rows[index].productlst[i].
							code.toLowerCase().startsWith(query.toLowerCase())) {
							results.push($scope.rows[index].productlst[i]);
						}

					}
				}
			}
			//
			return results;
		}


		//





		var prodcount=0;
		$scope.addNewRow=function()
		{
			var product={};
			product.productlst=angular.copy($scope.products);
			//
			product.promotion=0;
			product.taxDisplay=0;
			product.rowAmtDisplay=0;
			product.qty=1;
			product.qtyId='acQty'+prodcount;
			product.product_name='';
			product.searchMre=false;
			product.isAutoDisabled=false;
			product.quotationRowDetailsLoaded = true;
			product.productId='acProduct'+ prodcount;
			//product.submitted=false;
			//product.newProduct=true;
			$scope.rows.push(product);

			prodcount++;
		}
		//$scope.isRowDisabled=true;
		$scope.addrow = function () {
			if($scope.tempProduct.length==$scope.rows.length)
			{
				$scope.isRowDisabled=false;
			}
			else
			{
				angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('md-autocomplete md-input-container').addClass('md-input-invalid');
				angular.element(document.querySelector('.prod-row-wrap')).find('.add-item-row:last').find('md-autocomplete md-input-container input').focus();
				//notifications.toast("Please select a valid product.", "error");
				$scope.isRowDisabled=true;
			}
			if(!$scope.isRowDisabled) {
				if (isQuotation)
					isQuotation = false;
				//row.newProduct=false;
				$scope.addNewRow();
				//NEWLY ADDED CODE
				$scope.last = false;
				//$scope.searchMre=false;
				skipProd = 0;
				$scope.isRowDisabled=false;
			}
		}


		//$scope.$watch(function ()
		//{
		//  vm.submitted = false;
		//}, function ()
		//{
		//  vm.submitted = true;
		//});


		$scope.removerow = function (index) {
			//
			if($scope.rows.length!=1) {
				if ($scope.rows[index].product != undefined || $scope.rows[index].product != null) {
					if ($scope.rows[index].qty != undefined) {
						var val = $scope.rows[index].product.price_of_unit;
						$scope.content.netamt = $scope.content.netamt - val;
					}
					var existingTax = $filter('filter')($scope.tempTaxArray, {taxIndex: $scope.rows[index].product.productId})[0];
					if(existingTax!=undefined) {
						var itemIndex = $scope.tempTaxArray.indexOf(existingTax);
						$scope.content.taxAmt -= $scope.tempTaxArray[itemIndex].taxAmt;
						//
						$scope.tempTaxArray.splice(itemIndex, 1);
					}
					currencyDetails.splice(index, 1);
				}
				if($scope.rows[index].promotion!=undefined)
					$scope.content.PromoAmt -= $scope.rows[index].promotion;
				//
				self.searchText.splice(index, 1);
				$scope.tempProduct.splice(index, 1);

				calcAmt.splice(index, 1);
				//currencyDetails.splice(index, 1);
				$scope.rows.splice(index, 1);
				var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
				if(insufficientStockDet!=null || insufficientStockDet!=undefined) {
					var itemIndex = insufficientStocks.indexOf(insufficientStockDet);
					insufficientStocks.splice(itemIndex);
				}
				if(insufficientStocks.length==0)
					vm.submitted=false;
				prodcount--;
			}
		}


		$scope.removerows = function () {
			//
			for(var i=0; i<$scope.rows.length;i++) {
				if ($scope.rows[i].product != undefined || $scope.rows[i].product != null) {
					if ($scope.rows[i].qty != undefined) {
						var val = $scope.rows[i].product.price_of_unit;
						$scope.content.netamt = $scope.content.netamt - val;
					}
					var existingTax = $filter('filter')($scope.tempTaxArray, {taxIndex: $scope.rows[i].product.productId})[0];
					if (existingTax != undefined) {
						var itemIndex = $scope.tempTaxArray.indexOf(existingTax);
						$scope.content.taxAmt -= $scope.tempTaxArray[itemIndex].taxAmt;
						//
						$scope.tempTaxArray.splice(itemIndex, 1);
					}
				}
				if ($scope.rows[i].promotion != undefined)
					$scope.content.PromoAmt -= $scope.rows[i].promotion;
				//
				self.searchText.splice(i, 1);
				$scope.tempProduct.splice(i, 1);

				calcAmt.splice(i, 1);
				currencyDetails.splice(i, 1);
				$scope.rows.splice(i, 1);
				self.searchQuotation=null;
				isQuotation=false;
				prodcount = 0;
			}
		}


		$scope.setAmount=function(product,index)
		{

			// console.log(product);
			var amt=product.product.price_of_unit;
			var prod_name=product.product;
			$scope.content.amount=amt;
			$scope.content.qty=1;
			$scope.content.netamt=amt;

		}
		var calcAmt=[];
		var stockAvailable;
		var insufficientStocks=[];
		$scope.calcItemAmt=function(row,index)
		{
			row.quotationRowDetailsLoaded = false;
//
			if(row.product.sku!=0) {
				$charge.stock().getStock(row.product.productId).success(function (data) {
					stockAvailable = data.qty;
					if (row.qty <= stockAvailable) {
						var incrementQtyProd = currencyDetails[index];
						incrementQtyProd.qty=row.qty;
						currencyDetails.splice(index,1);
						currencyDetails.splice(index,index,incrementQtyProd);
						if(incrementQtyProd.status=="new") {
							currencyDetails[index]["status"] = "initial";
							currencyDetails[index]["stockstatus"] = "new";
						}
						else if(incrementQtyProd.status=="initial")
							currencyDetails[index]["status"]="old";
						//vm.submitted=false;
						var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
						if(insufficientStockDet!=null || insufficientStockDet!=undefined) {
							var itemIndex = insufficientStocks.indexOf(insufficientStockDet);
							insufficientStocks.splice(itemIndex);
						}
						//
						if(insufficientStocks.length==0)
							vm.submitted=false;
						$scope.calcTotal(row,index);
						if(row.product.apply_tax!=0) {
							$scope.spinnerInvoice = true;
							//
							$charge.billing().calcTax(row.product.tax, row.product.price_of_unit/rate).success(function (data) {
								if($scope.content.preferredCurrency!=undefined) {
									row.tax = rate*data.tax;
									row.taxDisplay=(Math.round(rate*data.tax * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));

								}
								else
								{
									row.tax = data.tax;
									row.taxDisplay=(Math.round(data.tax* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
								}
								var existingTax = $filter('filter')($scope.tempTaxArray, {taxIndex:row.product.productId })[0];
								if (existingTax==undefined) {
									//$scope.tempTaxArray.push({
									//  taxIndex:row.product.productId,
									//  taxAmt:row.tax,
									//  taxDisplay:row.taxDisplay,
									//  baseAmt:data.tax
									//});
									$scope.tempTaxArray.splice(index, index, {
										taxIndex:row.product.productId,
										taxAmt:row.tax,
										taxDisplay:row.taxDisplay,
										baseAmt:data.tax
									});
									//
									row.quotationRowDetailsLoaded = true;
									$scope.content.taxAmt=0;
									for(var i=0;i<$scope.tempTaxArray.length;i++)
									{
										$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
									}

								}
								else
								{
									//var index=$scope.tempTaxArray.indexOf(existingTax);
									//$scope.tempTaxArray.splice(index,1);
									//$scope.tempTaxArray.push({
									//    taxIndex:row.product.productId,
									//    taxAmt:row.tax,
									//    baseAmt:data.tax
									//});
									existingTax.taxAmt=row.tax;
									$scope.content.taxAmt=0;
									for(var i=0;i<$scope.tempTaxArray.length;i++)
									{
										$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
									}
									row.quotationRowDetailsLoaded = true;
								}
								$scope.spinnerInvoice = false;
							}).error(function (data) {
								//17-10-2016
								$mdDialog.show(
									$mdDialog.alert()
										.parent(angular.element(document.querySelector('#invoice')))
										.clickOutsideToClose(false)
										.title('Error')
										.textContent('Unexpected error occured while calculating tax.')
										.ariaLabel('Alert Dialog Demo')
										.ok('Ok')).finally(function() {
									var rowId=row.qtyId;
									var rowId='#'+rowId;
									//setTimeout(function(){
									document.querySelector(rowId).focus();
									//},0);
								});

								$scope.spinnerInvoice = false;
								row.tax=0;
								row.taxDisplay=0;
								//$scope.tempTaxArray.push({
								//  taxIndex:row.product.productId,
								//  taxAmt:row.tax,
								//  taxDisplay:row.taxDisplay,
								//  baseAmt:0
								//});

								$scope.tempTaxArray.splice(index, index, {
									taxIndex:row.product.productId,
									taxAmt:row.tax,
									taxDisplay:row.taxDisplay,
									baseAmt:0
								});
								row.quotationRowDetailsLoaded = true;
							})
						}
						else
						{
							row.tax=0;
							row.taxDisplay=0;
							//$scope.tempTaxArray.push({
							//  taxIndex:row.product.productId,
							//  taxAmt:row.tax,
							//  taxDisplay:row.taxDisplay,
							//  baseAmt:0
							//});

							$scope.tempTaxArray.splice(index, index, {
								taxIndex:row.product.productId,
								taxAmt:row.tax,
								taxDisplay:row.taxDisplay,
								baseAmt:0
							});
							row.quotationRowDetailsLoaded = true;
						}
					}
					else {
						notifications.toast("Insufficient Stock", "error");

						var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
						if(insufficientStockDet==null || insufficientStockDet==undefined) {
							insufficientStocks.push(
								{
									"rowId": index,
									"productId": row.product.productId
								});
						}
						var existingProd = currencyDetails[index];
						if(existingProd.status=="new") {
							currencyDetails[index]["status"] = "initial";
							currencyDetails[index]["stockstatus"] = "initial";
						}
						else if(existingProd.status=="initial")
							currencyDetails[index]["status"]="old";
						//
						var val = existingProd.rowAmt;
						if($scope.tempTaxArray.length!=0)
							var taxVal = $scope.tempTaxArray[index]==undefined?0:$scope.tempTaxArray[index].taxAmt;
						else
							var taxVal=0;
						////if($scope.content.netamt!=0)
						////  $scope.content.netamt = $scope.content.netamt - val;
						////else
						////  $scope.content.netamt=0;
						//$scope.content.taxAmt = $scope.content.taxAmt - taxVal;
						//$scope.content.PromoAmt = $scope.content.PromoAmt - row.promotion;
						//currencyDetails.splice(index, 1);
						//$scope.tempProduct.splice(index, 1);
						//$scope.tempTaxArray.splice(index, 1);
						//self.searchText.splice(index, 1);
						//row.qty = 1;
						//row.taxDisplay = 0;
						//row.promotion = 0;
						//row.rowAmtDisplay = "";
						row.product = null;
						//vm.submitted=true;
						//if(insufficientStocks.length!=0)
						vm.submitted=true;
						row.quotationRowDetailsLoaded = true;
					}
					if($scope.promoLists.length!=0)
						$scope.chkClaimedPromo();
				}).error(function (data) {
					notifications.toast("Unexpected error while getting stock.", "error");
					row.qty = 1;
					//vm.submitted=true;
					//row.submitted=true;
					var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
					if(insufficientStockDet==null || insufficientStockDet==undefined) {
						insufficientStocks.push(
							{
								"rowId": index,
								"productId": row.product.productId
							});
					}

					//if(insufficientStocks.length!=0)
					vm.submitted=true;

					row.quotationRowDetailsLoaded = true;
				})
			}
			else
			{
				var incrementQtyProd = currencyDetails[index];
				incrementQtyProd.qty=row.qty;
				currencyDetails.splice(index,1);
				currencyDetails.splice(index,index,incrementQtyProd);
				if(incrementQtyProd.status=="new") {
					currencyDetails[index]["status"] = "initial";
					currencyDetails[index]["stockstatus"] = "new";
				}
				else if(incrementQtyProd.status=="initial")
					currencyDetails[index]["status"]="old";
				var insufficientStockDet = $filter('filter')(insufficientStocks, {rowId:index })[0];
				if(insufficientStockDet!=null || insufficientStockDet!=undefined) {
					var itemIndex = insufficientStocks.indexOf(insufficientStockDet);
					insufficientStocks.splice(itemIndex);
				}
				if(insufficientStocks.length==0)
					vm.submitted=false;
				$scope.calcTotal(row,index);
				if(row.product.apply_tax!=0) {
					$scope.spinnerInvoice = true;
					$charge.billing().calcTax(row.product.tax, row.product.price_of_unit/rate).success(function (data) {
						if($scope.content.preferredCurrency!=undefined) {
							row.tax = rate*data.tax;
							row.taxDisplay=(Math.round(rate*data.tax * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
						}
						else
						{
							row.tax = data.tax;
							row.taxDisplay=(Math.round(data.tax* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
						}
						var existingTax = $filter('filter')($scope.tempTaxArray, {taxIndex:row.product.productId })[0];
						if (existingTax==undefined) {
							//$scope.tempTaxArray.push({
							//  taxIndex:row.product.productId,
							//  taxAmt:row.tax,
							//  taxDisplay:row.taxDisplay,
							//  baseAmt:data.tax
							//});

							$scope.tempTaxArray.splice(index, index, {
								taxIndex:row.product.productId,
								taxAmt:row.tax,
								taxDisplay:row.taxDisplay,
								baseAmt:data.tax
							});
							row.quotationRowDetailsLoaded = true;
							$scope.content.taxAmt=0;
							for(var i=0;i<$scope.tempTaxArray.length;i++)
							{
								$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
							}

						}
						else
						{
							existingTax.taxAmt=row.tax;
							$scope.content.taxAmt=0;
							for(i=0;i<$scope.tempTaxArray.length;i++)
							{
								$scope.content.taxAmt+=$scope.tempTaxArray[i].taxAmt;
							}
							row.quotationRowDetailsLoaded = true;
						}
						$scope.spinnerInvoice = false;
					}).error(function (data) {
						//17-10-2016
						$mdDialog.show(
							$mdDialog.alert()
								.parent(angular.element(document.querySelector('#invoice')))
								.clickOutsideToClose(false)
								.title('Error')
								.textContent('Unexpected error occured while calculating tax.')
								.ariaLabel('Alert Dialog Demo')
								.ok('Ok')).finally(function() {
							var rowId=row.qtyId;
							var rowId='#'+rowId;
							//setTimeout(function(){
							document.querySelector(rowId).focus();
							//},0);
						});
						$scope.spinnerInvoice = false;
						row.tax=0;
						row.taxDisplay=0;
						//$scope.tempTaxArray.push({
						//  taxIndex:row.product.productId,
						//  taxAmt:row.tax,
						//  taxDisplay:row.taxDisplay,
						//  baseAmt:0
						//});

						$scope.tempTaxArray.splice(index, index, {
							taxIndex:row.product.productId,
							taxAmt:row.tax,
							taxDisplay:row.taxDisplay,
							baseAmt:0
						});
						row.quotationRowDetailsLoaded = true;
					})
				}
				else
				{
					row.tax=0;
					row.taxDisplay=0;
					//$scope.tempTaxArray.push({
					//  taxIndex:row.product.productId,
					//  taxAmt:row.tax,
					//  taxDisplay:row.taxDisplay,
					//  baseAmt:0
					//});

					$scope.tempTaxArray.splice(index, index, {
						taxIndex:row.product.productId,
						taxAmt:row.tax,
						taxDisplay:row.taxDisplay,
						baseAmt:0
					});
					row.quotationRowDetailsLoaded = true;
				}

				if($scope.promoLists.length!=0)
					$scope.chkClaimedPromo();
			}
			//
			//if(self.searchPromo!=null)
			//{
			//  $scope.showValidationDialog('info','You have to apply promotion again after changes.','Notification');
			//  self.searchPromo=null;
			//  $scope.chkPromo(index);
			//}
			//

		}


		$scope.calcTotalTax= function (row,index) {
			//
			$scope.calcItemAmt(row,index);



		}
		$scope.calcTotal=function(row,index)
		{
			//
			var calcAmtVal = $filter('filter')(calcAmt, { rowIndex: row.product.productId })[0];
			if (calcAmtVal== null || calcAmtVal == undefined) {
				calcAmt.push({
					rowIndex: row.product.productId,
					rowAmt: row.product.price_of_unit,
					rowAmtDisplay:(Math.round(row.product.price_of_unit* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint)),
					rate:rate
				});
				var calcAmtVal = $filter('filter')(calcAmt, { rowIndex: row.product.productId })[0];
			}
			else {
			}
			var unitPrice;
			if (row.qty == "" || row.qty == undefined) {
				convertedQty = 0;
				if(calcAmtVal== null || calcAmtVal == undefined) {
					unitPrice = calcAmt[index].rowAmt;
					row.product.price_of_unit = calcAmt[index].rowAmt;
					row.rowAmtDisplay=calcAmt[index].rowAmtDisplay;
				}
				else {
					row.product.price_of_unit = calcAmtVal.rowAmt;
					row.rowAmtDisplay=calcAmtVal.rowAmtDisplay;
					unitPrice=calcAmtVal.rowAmt;
				}
			}
			else
				convertedQty = parseInt(row.qty);
			var convertedQty, convertedAmt;
			var netTotal = 0;
			var count = 1;

			if(calcAmtVal== null || calcAmtVal == undefined) {
				unitPrice = calcAmt[index].rowAmt;
			}
			else {
				unitPrice=calcAmtVal.rowAmt;
			}
			convertedAmt = parseFloat(unitPrice);

			var totalAmt = convertedAmt * convertedQty;
			row.product.price_of_unit = totalAmt;
			row.rowAmtDisplay=(Math.round(row.product.price_of_unit* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
			for (var i = 0; i < $scope.rows.length; i++) {
				if($scope.rows[i].product!=null || $scope.rows[i].product!= undefined) {
					var perItem = $scope.rows[i].product.price_of_unit;
					netTotal += perItem;
				}
			}
			$scope.content.netamt = netTotal;
		}

		$scope.FilterUsers=function(category)
		{
			//
			$scope.filteredUsers = [];
			$scope.filteredtempUsers = [];
			self.searchProfile = "";
			$scope.content.bill_addr = "";
			var selectedCat = category;
			$scope.loadUsersByCat(selectedCat, skipUsr, takeUsr);
		}




		$scope.clearText= function () {
			if($scope.content.bill_addr =="")
				self.searchProfile="";
		}

		$scope.accountId;
		$scope.GetAddr=function(name,val)
		{
			var selectedProfile = vm.editInvoice.profile;
			if (name != "") {
				var users = $scope.filteredUsers;
				if (val == 0) {
					var selectedName = name.profilename;
					vm.editInvoice.bill_addr = "";
					for (var i = 0; i < users.length; i++) {
						var obj = users[i];
						if (obj.profilename == selectedName) {
							vm.editInvoice.bill_addr = obj.bill_addr;
							vm.editInvoice.accountId = obj.profileId;
							//$scope.getQuotationByUser(obj.profileId);
						}

					}
				}
				else if (val == 1) {
					//
					var selectedName = name;
					vm.editInvoice.bill_addr = "";
					for (var i = 0; i < users.length; i++) {
						var obj = users[i];
						if (obj.profilename == selectedName) {
							//
							vm.editInvoice.bill_addr = obj.bill_addr;
							//$scope.getQuotationByUser(obj.profileId);
						}

					}
				}
			}
		}


		var skip,take;
		var tempProfileList;
		var autoElem = angular.element('#invoice-auto');
		$scope.searchMre=false;
		$scope.loadProfileByKeyword= function (keyword,category) {
			//
			$scope.waitForProfileKeyword=keyword;
			if(!$scope.searchMre) {
				//
				if ($scope.filteredtempUsers.length == 10) {
					if (keyword != undefined) {
						if (keyword.length == 3) {
							vm.isAutoDisabled = true;
							skip = 0;
							take = 100;
							var tempProfileList = [];
							$scope.filteredUsers = [];
							$charge.profile().filterByCatKey(skip,take,category,keyword).success(function (data) {
								for (var i = 0; i < data.length; i++) {
									var obj = data[i];
									if(obj.profile_type=='Individual')
									{
										tempProfileList.push({
											profilename : obj.first_name,
											profileId : obj.profileId,
											othername : obj.last_name,
											profile_type : obj.profile_type,
											bill_addr:obj.bill_addr,
											category:obj.category,
											email:obj.email_addr,
											credit_limit:obj.credit_limit
										});
									}
									else if(obj.profile_type=='Business') {
										tempProfileList.push({
											profilename : obj.business_name,
											profileId : obj.profileId,
											othername : obj.business_contact_name,
											profile_type : obj.profile_type,
											bill_addr:obj.bill_addr,
											category:obj.category,
											email:obj.email_addr,
											credit_limit:obj.credit_limit

										});
									}

								}
								$scope.filteredUsers = tempProfileList;
								vm.isAutoDisabled = false;
								//autoElem.focus();
								setTimeout(function(){
									document.querySelector('#acProfileId').focus();
								},0);
								if (data.length < take)
									$scope.searchMre = true;
								$timeout.cancel($scope.waitForSearchMore);
								//skip += take;
								//$scope.loadPaging(keyword, rows, index, status, skip, take);
							}).error(function (data) {
								vm.isAutoDisabled = false;
								setTimeout(function(){
									document.querySelector('#acProfileId').focus();
								},0);
								//autoElem.empty();
								//
								//vm.products = [];
								//vm.selectedProduct = null;
							});
						}
						else if(keyword.length>3)
						{
							//
							skip = 0;
							take = 100;
							tempProfileList = [];
							vm.isAutoDisabled = true;
							$scope.filteredUsers = [];
							$charge.profile().filterByCatKey(skip,take,category,keyword).success(function (data) {
								for (var i = 0; i < data.length; i++) {
									var obj = data[i];
									if(obj.profile_type=='Individual')
									{
										tempProfileList.push({
											profilename : obj.first_name,
											profileId : obj.profileId,
											othername : obj.last_name,
											profile_type : obj.profile_type,
											bill_addr:obj.bill_addr,
											category:obj.category,
											email:obj.email_addr
										});
									}
									else if(obj.profile_type=='Business') {
										tempProfileList.push({
											profilename : obj.business_name,
											profileId : obj.profileId,
											othername : obj.business_contact_name,
											profile_type : obj.profile_type,
											bill_addr:obj.bill_addr,
											category:obj.category,
											email:obj.email_addr

										});
									}

								}
								$scope.filteredUsers = tempProfileList;
								vm.isAutoDisabled = false;
								setTimeout(function(){
									document.querySelector('#acProfileId').focus();
								},0);

								if (data.length < take)
									$scope.searchMre = true;
								$timeout.cancel($scope.waitForSearchMore);
							}).error(function (data) {
								vm.isAutoDisabled = false;
								setTimeout(function(){
									document.querySelector('#acProfileId').focus();
								},0);
								//autoElem.empty();
							});
						}
						else if (keyword.length == 0 || keyword == null) {
							$scope.filteredUsers = $scope.filteredtempUsers;
							$scope.searchMre = false;
						}
					}
					else if (keyword == undefined) {
						$scope.filteredUsers = $scope.filteredtempUsers;
						$scope.searchMre = false;
					}
				}
			}
			else if (keyword == undefined || keyword.length == 0) {
				$scope.filteredUsers = $scope.filteredtempUsers;
				$scope.searchMre = false;
			}
		}


		$scope.toggleProfileSearchMre= function (ev,category) {
			//
			if (ev.keyCode === 8) {
				$timeout.cancel($scope.waitForSearchMore);
				$scope.waitForSearchMore = $timeout(function myFunction() {
					$scope.searchMre = false;
					$scope.loadProfileByKeyword($scope.waitForProfileKeyword,category);
				},1000);
			}
		}


		$scope.checkPromotion = function(promoCode){

			if(!promoCode || promoCode === '')
			{
				return;
			}

			$charge.coupon().getByCode(promoCode).success(function (data) {

				//if(vm.editInvoice.discount)
				//  vm.editInvoice.discount += data['0'].discountamount;
				//else
				//  vm.editInvoice.discount = data['0'].discountamount;

				vm.editInvoice.gupromotionId = data[0].gucouponid;

				$scope.calcPromotionToProducts(data);

			}).error(function (error) {
				vm.editInvoice.promotion = '';
				vm.editInvoice.gupromotionId = '';
				notifications.toast(error.error, "error");
			})
		}

		$scope.calcPromotionToProducts= function (data) {

			if($scope.rows.length >= 1 && $scope.rows[0].product != null) {

				for (var i = 0; i < $scope.rows.length; i++) {

					if(data[0].associateplan === 1) {
						for (var ii = 0; ii < data.couponDetails.length; ii++) {
							if (data.couponDetails[ii].guDetailid === ($scope.rows[i].product.guproductID)) {
								$scope.rows[i].promotion = data[0].discountamount * $scope.rows[i].qty;
								$scope.rows[i].promotionId = data[0].gucouponid;

								$scope.rows[i].rowAmtDisplay -= data[0].discountamount * $scope.rows[i].qty;
							}
						}

					}else{
						$scope.rows[i].promotion = data[0].discountamount * $scope.rows[i].qty;
						$scope.rows[i].promotionId = data[0].gucouponid;

						$scope.rows[i].rowAmtDisplay -= data[0].discountamount * $scope.rows[i].qty;
					}


				}

			}

		}
		//var skipPromo= 0,takePromo=100;
		$scope.promotionList=[];
		//$scope.loadPublicPromotions= function (skipPromo,takePromo) {
		//	$charge.promotion().getPublicPromotion(skipPromo,takePromo,'asc',1).success(function (data) {
		//		for(var i=0;i<data.length;i++) {
		//			$scope.promotionList.push(data[i]);
		//		}
		//		skipPromo+=takePromo;
		//		//
		//		$scope.loadPublicPromotions(skipPromo,takePromo);
		//	}).error(function () {
		//
		//	})
		//}
		//$scope.loadPublicPromotions(0,100);
		//
		////$scope.promoLists=[];
		//$scope.isPromoFreeze=false;
		//$scope.chkPromo=function(index)
		//{
		//	$scope.promoLists=[];
		//	if($scope.content.profile!=null) {
		//		var promocode = vm.searchPromo;
		//
		//		//
		//		var arrayCount;
		//		isValid = false;
		//		//$scope.content.PromoAmt=0;
		//		if (promocode == "" || promocode == undefined) {
		//			isValid = true;
		//			$scope.content.gupromotionid = "";
		//			if (index != undefined || index != "") {
		//				$scope.content.PromoAmt = 0;
		//				//$scope.rows[index].promotion = 0;
		//				for(var i=0;i<$scope.rows.length;i++)
		//				{
		//					$scope.rows[i].promotion = 0;
		//				}
		//			}
		//		}
		//		else {
		//			$scope.isPromoFreeze=true;
		//			$scope.content.PromoAmt = 0;
		//			$charge.promotion().getPromotionByCodeAndAccount(promocode, $scope.content.profile.profileId).success(function (data) {
		//				$scope.validPromo = true;
		//				isValid = true;
		//				//$scope.content.PromoAmt=0;
		//				$scope.content.gupromotionid = data[0].gupromotionid;
		//
		//				if($scope.promoLists.length==0) {
		//					$scope.promotionObj = data;
		//					$scope.promoLists=data;
		//				}
		//				var promoObjLen = $scope.promotionObj.length;
		//				var rowsLen = $scope.rows.length;
		//				if (promoObjLen >= rowsLen)
		//					arrayCount = promoObjLen;
		//				else if (promoObjLen < rowsLen)
		//					arrayCount = rowsLen;
		//				for (var i = 0; i < rowsLen; i++) {
		//					var productObj = $scope.rows[i].product;
		//					if(productObj!=null || productObj !=undefined) {
		//						var promotionObj = $filter('filter')($scope.promotionObj, {guproductId: productObj.productId})[0];
		//						//if(data[0].promoall==true)
		//						//{
		//						//  promotionObj.amount=data[0].amount;
		//						//}
		//
		//						//
		//						if (promotionObj != null || promotionObj != undefined) {
		//							if (promotionObj.type == "2") {
		//								$scope.content.PromoAmt += parseFloat(promotionObj.amount*$scope.rows[i].qty);
		//								$scope.rows[i].promotion = parseFloat(promotionObj.amount*$scope.rows[i].qty);
		//							}
		//							else if (promotionObj.type == "1") {
		//								$scope.content.PromoAmt += parseFloat((promotionObj.amount / 100) * productObj.price_of_unit);
		//								$scope.rows[i].promotion = parseFloat((promotionObj.amount / 100) * productObj.price_of_unit);
		//							}
		//						}
		//						else {
		//							var promoObj = $filter('filter')($scope.promotionObj, {guproductId: -999})[0];
		//							if (promoObj != undefined) {
		//								if (promoObj.type == "2") {
		//									$scope.content.PromoAmt += parseFloat(promoObj.amount*$scope.rows[i].qty);
		//									$scope.rows[i].promotion = parseFloat(promoObj.amount*$scope.rows[i].qty);
		//								}
		//								else if (promoObj.type == "1") {
		//									$scope.content.PromoAmt += parseFloat((promoObj.amount / 100) * productObj.price_of_unit);
		//									$scope.rows[i].promotion = parseFloat((promoObj.amount / 100) * productObj.price_of_unit);
		//								}
		//							}
		//							else {
		//								$scope.content.PromoAmt += 0;
		//								$scope.rows[i].promotion = 0;
		//							}
		//						}
		//					}
		//					else
		//					{
		//						notifications.toast('Product is not selected', "error");
		//						self.searchPromo = null;
		//					}
		//
		//				}
		//				$scope.isPromoFreeze=false;
		//			}).error(function (data) {
		//				//
		//				if(data.error!=undefined)
		//					notifications.toast(data.error, "error");
		//				else
		//					notifications.toast('Invalid promotion code', "error");
		//				self.searchPromo = null;
		//				$scope.content.PromoAmt += 0;
		//				for (var i = 0; i < $scope.rows.length; i++) {
		//					$scope.rows[i].promotion = 0;
		//				}
		//
		//				$scope.isPromoFreeze=false;
		//			})
		//		}
		//	}
		//	else
		//	{
		//		notifications.toast('Profile name is not selected.', "error");
		//		self.searchPromo = null;
		//		$scope.isPromoFreeze=false;
		//	}
		//}
		//
		//$scope.chkClaimedPromo= function () {
		//	$scope.content.PromoAmt = 0;
		//	for(var i=0;i<$scope.rows.length;i++) {
		//		var productObj = $scope.rows[i].product;
		//		if(productObj!=null || productObj !=undefined) {
		//			var promotionObj = $filter('filter')($scope.promoLists, {guproductId: productObj.productId})[0];
		//			//if($scope.promoLists[0].promoall==true)
		//			//{
		//			//  promotionObj.amount=data[0].amount;
		//			//}
		//
		//			//
		//			if (promotionObj != null || promotionObj != undefined) {
		//				if (promotionObj.type == "2") {
		//					$scope.content.PromoAmt += parseFloat(promotionObj.amount*$scope.rows[i].qty);
		//					$scope.rows[i].promotion = parseFloat(promotionObj.amount*$scope.rows[i].qty);
		//				}
		//				else if (promotionObj.type == "1") {
		//					$scope.content.PromoAmt += parseFloat((promotionObj.amount / 100) * productObj.price_of_unit);
		//					$scope.rows[i].promotion = parseFloat((promotionObj.amount / 100) * productObj.price_of_unit);
		//				}
		//			}
		//			else {
		//
		//				var promoObj = $filter('filter')($scope.promotionObj, {guproductId: -999})[0];
		//				if (promoObj != undefined) {
		//					if (promoObj.type == "2") {
		//						$scope.content.PromoAmt += parseFloat(promoObj.amount*$scope.rows[i].qty);
		//						$scope.rows[i].promotion = parseFloat(promoObj.amount*$scope.rows[i].qty);
		//					}
		//					else if (promoObj.type == "1") {
		//						$scope.content.PromoAmt += parseFloat((promoObj.amount / 100) * productObj.price_of_unit);
		//						$scope.rows[i].promotion = parseFloat((promoObj.amount / 100) * productObj.price_of_unit);
		//					}
		//				}
		//				else {
		//					$scope.content.PromoAmt += 0;
		//					$scope.rows[i].promotion = 0;
		//				}
		//			}
		//		}
		//	}
		//}


		var self = this;
		//self.selectedPromotion  = null;
		//self.searchPromo    = null;
		////
		//$scope.queryPromotion =function(query) {
		//	var results=[];
		//	//
		//	for (var i = 0; i<$scope.promotionList.length; ++i){
		//		//if($scope.filteredQuotation[i].invoiceNo!=null) {
		//		if ($scope.promotionList[i].promotioncode.startsWith(query)) {
		//			results.push($scope.promotionList[i]);
		//		}
		//		else if ($scope.promotionList[i].promotioncode.toLowerCase().startsWith(query.toLowerCase())) {
		//			results.push($scope.promotionList[i]);
		//		}
		//		// }
		//	}
		//	//
		//	return results;
		//}

		$scope.customValidation=function(ev)
		{
			if(ev!='One Time') {
				if(ev!='Installement') {
					$scope.content.isFrequency = true;
					$scope.content.isOccurence = true;
				}
				else
				{
					$scope.content.isFrequency = true;
					$scope.content.isOccurence = false;
				}
			}
			else
			{
				$scope.content.isFrequency = false;
				$scope.content.isOccurence = false;
				$scope.content.occurrence=0;
			}
		}
		$scope.divEnabled=true;
		$scope.enablePayment= function (ev) {
			if(ev=="true") {
				vm.submitted=true;
				$charge.payment().getPaidAdvance($scope.accountId).success(function(data) {
					//
					if(data>0) {
						$scope.price=$filter('isoCurrency')(data,$scope.baseCurrency,$rootScope.decimalPoint);
						$scope.showValidationDialog('confirm','This customer currently has advance of '+$scope.price + ' Apply credits to settle this invoice.','Confirmation')
					}
					else
					{
						$scope.showValidationDialog('info','This customer does not have any advanced payments.','Insufficient advance')
						//$scope.content.status="credit";
					}

				}).error(function (status) {

				})

			}
			else if(ev=="false")
			{
				$scope.showValidationDialog('info','If this customer has pending balance, this invoice be applied prior to settling pending balance.','Reminder')
				$scope.divEnabled = ev == "false" ? false : true;
				$scope.requiredStatus =ev == "false" ? true : false;
			}
			else
			{
				$scope.divEnabled = ev == "false" ? false : true;
				$scope.requiredStatus =ev == "false" ? true : false;
			}
		}

		$scope.content.payOnline=false;
		$scope.content.payMethod ="Cash";
		$scope.content.payAmt =0;
		$scope.enablePayOnline= function (ev) {
			if(!ev)
			{
				$scope.divEnabled = true;
				$scope.requiredStatus =false;
				$scope.content.status ="credit";
				$scope.content.payMethod ="Cash";
				$scope.content.payAmt =0;
			}
		}

		$scope.showValidationDialog = function(type,title,header) {
			if(type=="confirm") {
				var confirm = $mdDialog.confirm()
					.title(header)
					.textContent(title)
					.ariaLabel('Lucky day')
					.ok('Yes')
					.cancel('No!');

				$mdDialog.show(confirm).then(function () {
					$scope.divEnabled = true;
					$scope.requiredStatus = false;
					vm.submitted = false;
				}, function () {
					vm.submitted = false;
					$scope.content.status="credit";
				});
			}
			else if(type=="info")
			{
				$mdDialog.show(
					$mdDialog.alert()
						.parent(angular.element(document.querySelector('#invoice')))
						.clickOutsideToClose(false)
						.title(header)
						.textContent(title)
						.ariaLabel('Alert Dialog Demo')
						.ok('Ok'));
				vm.submitted = false;
				if(header!="Reminder")
					$scope.content.status="credit";
			}
		}

		//11-07-2016
		$scope.prefferedCurrencies=[];
		$charge.settingsapp().getDuobaseValuesByTableName("CTS_GeneralAttributes").success(function(data) {
			//
			$rootScope.decimalPoint=2;//parseInt(data[6].RecordFieldData);
			$rootScope.step=($rootScope.decimalPoint/$rootScope.decimalPoint)/Math.pow(10,$rootScope.decimalPoint);
			$scope.baseCurrency=data[0].RecordFieldData;
			$scope.prefferedCurrencies.push($scope.baseCurrency);
			$scope.content.preferredCurrency=$scope.baseCurrency;

			var temparr = data[4].RecordFieldData.trimLeft().split(" ");
			for (var i = 0; i < temparr.length; i++) {
				$scope.prefferedCurrencies.push(temparr[i]);
			}
		}).error(function(data) {
		})


		var rate=1;
		$scope.calcRate = function (ev) {
			$scope.spinnerInvoice=true;
//
			if($scope.content.preferredCurrency!=$scope.baseCurrency) {
				$scope.content.taxAmt = 0;
				//var param=$scope.baseCurrency+'_'+$scope.content.preferredCurrency;
				$charge.currency().calcCurrency(1,$scope.baseCurrency,$scope.content.preferredCurrency).success(function (data) {
					var result = data;
					//rate = parseFloat(result.toFixed(parseInt($rootScope.decimalPoint)));
					rate = parseFloat(result);
					//$scope.exchangeRate = rate.toFixed(parseInt($rootScope.decimalPoint));
					$scope.exchangeRate = rate;
					$scope.spinnerInvoice = false;
					if (calcAmt.length != 0) {
						if ($scope.baseCurrency != $scope.content.preferredCurrency) {
							for (var i = 0; i < $scope.rows.length; i++) {
								var existingRow = $filter('filter')(currencyDetails, {rowIndex: $scope.rows[i].product.productId})[0];
								if (existingRow != null) {
									if($scope.content.invoiceType=="Installment") {
										var occurence=parseInt($scope.content.occurrence);
										$scope.rows[i].product.price_of_unit = (rate * existingRow.rowAmt)/occurence;
									}
									else
									{
										$scope.rows[i].product.price_of_unit = (rate * existingRow.rowAmt)
									}
									$scope.rows[i].rowAmtDisplay = $scope.rows[i].product.price_of_unit.toFixed(parseInt($rootScope.decimalPoint));
									$scope.rows[i].tax = rate * $scope.tempTaxArray[i].baseAmt;
									$scope.rows[i].taxDisplay=(Math.round(rate * $scope.tempTaxArray[i].baseAmt * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
									$scope.tempTaxArray[i].taxAmt = $scope.rows[i].tax;
									$scope.content.taxAmt += $scope.rows[i].tax;
									$scope.multiCurrencyCalc($scope.rows[i], i, rate);
								}
							}
							var netTotal = 0;
							for (var i = 0; i < $scope.rows.length; i++) {
								var perItem = $scope.rows[i].product.price_of_unit;
								netTotal += perItem;
							}
							$scope.content.netamt = netTotal;
						}
					}
				}).error(function (data) {
					rate = 1;
					$scope.spinnerInvoice = false;
				})

				//$charge.currency().calcCurrency(param).success(function (data) {
				//  //var el = document.createElement('html');
				//  //el.innerHTML = data;
				//  //$scope.isBaseCurrency = false;
				//  //var element = el.getElementsByTagName('span');
				//  //var results = element[0].innerHTML.split(" ");
				//  //
				//  var results=data.results;
				//  var result = results[param];
				//  rate = parseFloat(result.val.toFixed(parseInt($rootScope.decimalPoint)));
				//  $scope.exchangeRate = rate.toFixed(parseInt($rootScope.decimalPoint));
				//  $scope.spinnerInvoice = false;
				//  if (calcAmt.length != 0) {
				//    if ($scope.baseCurrency != $scope.content.preferredCurrency) {
				//      for (var i = 0; i < $scope.rows.length; i++) {
				//        var existingRow = $filter('filter')(currencyDetails, {rowIndex: $scope.rows[i].product.productId})[0];
				//        if (existingRow != null) {
				//          if($scope.content.invoiceType=="Installment") {
				//            var occurence=parseInt($scope.content.occurrence);
				//            $scope.rows[i].product.price_of_unit = (rate * existingRow.rowAmt)/occurence;
				//          }
				//          else
				//          {
				//            $scope.rows[i].product.price_of_unit = (rate * existingRow.rowAmt)
				//          }
				//          $scope.rows[i].rowAmtDisplay = $scope.rows[i].product.price_of_unit.toFixed(parseInt($rootScope.decimalPoint));
				//          $scope.rows[i].tax = rate * $scope.tempTaxArray[i].baseAmt;
				//          $scope.rows[i].taxDisplay=(Math.round(rate * $scope.tempTaxArray[i].baseAmt * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
				//          $scope.tempTaxArray[i].taxAmt = $scope.rows[i].tax;
				//          $scope.content.taxAmt += $scope.rows[i].tax;
				//          $scope.multiCurrencyCalc($scope.rows[i], i, rate);
				//        }
				//      }
				//      var netTotal = 0;
				//      for (var i = 0; i < $scope.rows.length; i++) {
				//        var perItem = $scope.rows[i].product.price_of_unit;
				//        netTotal += perItem;
				//      }
				//      $scope.content.netamt = netTotal;
				//    }
				//  }
				//}).error(function (data) {
				//  rate = 1;
				//  $scope.spinnerInvoice = false;
				//})
			}
			else
			{
				$scope.changeToBaseCurrency();
				$scope.spinnerInvoice = false;
			}
		}


		$scope.multiCurrencyCalc= function (row,index,rate) {
			if (row.qty == "" || row.qty == undefined) {
				convertedQty = 0;
				row.product.price_of_unit = currencyDetails[index].rowAmt;
				row.rowAmtDisplay=(Math.round(row.product.price_of_unit* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
			}
			else
				convertedQty = parseInt(row.qty);
			var convertedQty, convertedAmt;
			var currencyCalc;
			var count = 1;
			var unitPrice = currencyDetails[index].rowAmt;

			convertedAmt = parseFloat(unitPrice);
			if($scope.content.invoiceType=="Installment") {
				var occurence = parseInt($scope.content.occurrence);
				currencyCalc = (convertedAmt * rate)/occurence;
			}
			else
			{
				currencyCalc = convertedAmt * rate;
			}
			calcAmt[index].rowAmt=currencyCalc;
			var totalAmt = currencyCalc * convertedQty;
			row.product.price_of_unit = totalAmt;
			row.rowAmtDisplay=(Math.round(row.product.price_of_unit* Math.pow(10,parseInt($rootScope.decimalPoint)))/ Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
		}

		$scope.changeToBaseCurrency= function () {
			//
			for (var i = 0; i < $scope.rows.length; i++) {
				//
				if($scope.rows[i].product!=undefined || $scope.rows[i].product!=null) {
					//$scope.rows[i].product.price_of_unit = Math.round($scope.rows[i].product.price_of_unit / rate);
					$scope.rows[i].product.price_of_unit = $scope.rows[i].product.price_of_unit / rate;
					$scope.rows[i].rowAmtDisplay = $scope.rows[i].product.price_of_unit.toFixed(parseInt($rootScope.decimalPoint));
					$scope.rows[i].tax = (parseFloat($scope.rows[i].tax / rate).toFixed(2));
					$scope.rows[i].taxDisplay=(Math.round($scope.rows[i].tax * Math.pow(10,parseInt($rootScope.decimalPoint))) / Math.pow(10,parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint));
				}
			}
			$scope.content.netamt=$scope.content.netamt/rate;
			$scope.content.taxAmt=$scope.content.taxAmt/rate;
			$scope.content.additionalcharge=Math.round(($scope.content.additionalcharge != undefined) ? ($scope.content.additionalcharge/rate).toFixed(2) : 0);
			$scope.content.discount=Math.round(($scope.content.discount/rate).toFixed(2));
			$scope.isBaseCurrency=true;
			$scope.exchangeRate="";
			$scope.content.preferredCurrency=$scope.baseCurrency;
			rate=1;
		}



		//$scope.loadAllQuotations();
		$scope.getQuotationByUser=function(accoId)
		{
			$scope.filteredQuotation=[];
			$charge.billing().quotationByAccountId(accoId).success(function(data) {
				for (var i = 0, len = data.length; i < len; i++)
				{
					//
					var invoiceDate=moment(data[i].invoiceDate).format('LL');
					var invoice={};
					data[i]['invoice_type']=data[i].invoiceType;
					data[i]['code']=data[i].invoiceNo;
					data[i]['code']=$filter('numberFixedLen')(data[i]['code'],lenQuotPrefix);
					//data[i]['code']=data[i].invoiceNo;
					data[i]['prefix']=lenQuotPrefix;
					data[i]['invoiceNo']=prefixQuotation+data[i]['code'];
					data[i]['invoiceDate']=invoiceDate;
					data[i]['invoiceAmount']=data[i].invoiceAmount*data[i].rate;
					data[i]['client'] = data[i].profile_type=="Individual"?data[i].first_name:data[i].business_name;
				}
				$scope.filteredQuotation=data;
			}).error(function (data) {

			})

			//for (var i = 0; i<$scope.quotations.length; ++i){
			//  if($scope.quotations[i].guAccountID==accoId)
			//  {
			//    $scope.filteredQuotation.push($scope.quotations[i]);
			//  }
			//}
		}

		var self = this;
		self.selectedItem  = null;
		self.searchQuotation    = null;
		//
		$scope.queryQuotation =function(query,index) {
			var results=[];
			//
			for (var i = 0; i<$scope.filteredQuotation.length; ++i){
				if($scope.filteredQuotation[i].invoiceNo!=null) {
					if ($scope.filteredQuotation[i].invoiceNo.toString().startsWith(query)) {
						results.push($scope.filteredQuotation[i]);
					}
					else if ($scope.filteredQuotation[i].invoiceNo.toString().toLowerCase().startsWith(query.toLowerCase())) {
						results.push($scope.filteredQuotation[i]);
					}
				}
			}
			//
			return results;
		}


		var isQuotation=false;
		$scope.quotationNo="";
		$scope.getQuotationDetails= function (quotation) {
			//
			//row.quotationRowDetailsLoaded = true;
			$scope.quotationNo=quotation.code;
			if (quotation != null) {
				$scope.rows = [];
				self.searchText=[];
				isQuotation=true;
				$charge.billing().quotationByIdWithAllData(quotation.code).success(function(data) {
					var quotationDet = data[0].quotationDetails;
					//
					$charge.stock().checkStockForQuotation(quotationDet[0].guInvID).success(function (data) {
						if (data.status) {
							var expiryDate = moment(quotation.dueDate).format('YYYY-MM-DD');
							var invoiceDate = moment($scope.content.invoiceDate).format('YYYY-MM-DD');
							if(expiryDate>=invoiceDate) {
								var currencyRate = quotation.rate;
								for (var i = 0; i < quotationDet.length; i++) {

									$scope.tempProduct.push({
										productId: quotationDet[i].guItemID
									});

									//var currentProduct = $filter('filter')($scope.productlist, {productId: quotationDet[i].guItemID})[0];
									var currentProduct = {};
									currentProduct.productId = parseInt(quotationDet[i].guItemID);
									currentProduct.price_of_unit = quotationDet[i].unitPrice;
									currentProduct.code = quotationDet[i].code;
									currentProduct.tax = (quotationDet[i].taxid == undefined) ? 0 : quotationDet[i].taxid;
									currentProduct.sku = quotationDet[i].sku;

									var product = {}
									product.qty = parseInt(quotationDet[i].gty);
									if (currentProduct != null) {
										currencyDetails.push({
											rowIndex: currentProduct.productId,
											rowAmt: currentProduct.price_of_unit,
											rate: currencyRate,
											qty:product.qty,
											status:"new",
											stockstatus:"new"
										});
										$scope.tempTaxArray.push({
											taxIndex: quotationDet[i].guItemID,
											taxAmt: quotationDet[i].tax * currencyRate,
											taxDisplay: quotationDet[i].tax.toFixed(parseInt($rootScope.decimalPoint)),
											baseAmt: quotationDet[i].tax
										});
										calcAmt.push({
											rowIndex: quotationDet[i].guItemID,
											rowAmt: quotationDet[i].unitPrice,
											rowAmtDisplay: (Math.round(quotationDet[i].unitPrice * Math.pow(10, parseInt($rootScope.decimalPoint))) / Math.pow(10, parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint)),
											rate: currencyRate
										});

										product.row = {};
										product.product = currentProduct;
										product.product.price_of_unit = quotationDet[i].totalPrice * currencyRate;
										product.rowAmtDisplay = quotationDet[i].totalPrice * currencyRate;
									}
									product.newProduct = true;
									product.taxDisplay = quotationDet[i].tax * currencyRate;
									product.promotion = 0;
									product.quotationRowDetailsLoaded=true;
									$scope.rows.push(product);
									self.searchText.push(currentProduct.code);
								}
								//
								$scope.content.netamt = quotation.subTotal * currencyRate;
								$scope.content.taxAmt = quotation.tax * currencyRate;
								$scope.content.discount = quotation.discAmt != 0 ? quotation.discAmt * currencyRate : 0;
								$scope.content.additionalcharge = quotation.additionalcharge != 0 ? quotation.additionalcharge * currencyRate : 0;
								$scope.content.preferredCurrency = quotation.currency;
								$scope.content.PromoAmt = 0;
								$scope.exchangeRate = parseFloat(currencyRate).toFixed(parseInt($rootScope.decimalPoint));
								rate = parseFloat(currencyRate);
							}
							else
							{
								var confirm = $mdDialog.confirm()
									.title('Confirmation')
									.textContent('This quotation is expired. Do you wish to continue?')
									.ariaLabel('Lucky day')
									.ok('Yes')
									.cancel('No!');

								$mdDialog.show(confirm).then(function () {
									var currencyRate = quotation.rate;
									for (var i = 0; i < quotationDet.length; i++) {

										$scope.tempProduct.push({
											productId: quotationDet[i].guItemID
										});
										//var currentProduct = $filter('filter')($scope.productlist, {productId: quotationDet[i].guItemID})[0];
										var currentProduct = {};
										currentProduct.productId = parseInt(quotationDet[i].guItemID);
										currentProduct.price_of_unit = quotationDet[i].unitPrice;
										currentProduct.code = quotationDet[i].code;
										currentProduct.tax = (quotationDet[i].taxid == undefined) ? 0 : quotationDet[i].taxid;
										currentProduct.sku = quotationDet[i].sku;

										var product = {}
										product.qty = parseInt(quotationDet[i].gty);
										if (currentProduct != null) {
											currencyDetails.push({
												rowIndex: currentProduct.productId,
												rowAmt: currentProduct.price_of_unit,
												rate: currencyRate,
												qty:product.qty,
												status:"new",
												stockstatus:"new"
											});
											$scope.tempTaxArray.push({
												taxIndex: quotationDet[i].guItemID,
												taxAmt: quotationDet[i].tax * currencyRate,
												taxDisplay: quotationDet[i].tax.toFixed(parseInt($rootScope.decimalPoint)),
												baseAmt: quotationDet[i].tax
											});
											calcAmt.push({
												rowIndex: quotationDet[i].guItemID,
												rowAmt: quotationDet[i].unitPrice,
												rowAmtDisplay: (Math.round(quotationDet[i].unitPrice * Math.pow(10, parseInt($rootScope.decimalPoint))) / Math.pow(10, parseInt($rootScope.decimalPoint))).toFixed(parseInt($rootScope.decimalPoint)),
												rate: currencyRate
											});

											product.row = {};
											product.product = currentProduct;
											product.product.price_of_unit = quotationDet[i].totalPrice * currencyRate;
											product.rowAmtDisplay = quotationDet[i].totalPrice * currencyRate;
										}
										product.newProduct = true;
										product.taxDisplay = quotationDet[i].tax * currencyRate;
										product.promotion = 0;
										product.quotationRowDetailsLoaded=true;
										$scope.rows.push(product);
										self.searchText.push(currentProduct.code);
									}
									//
									$scope.content.netamt = quotation.subTotal * currencyRate;
									$scope.content.taxAmt = quotation.tax * currencyRate;
									$scope.content.discount = quotation.discAmt != 0 ? quotation.discAmt * currencyRate : 0;
									$scope.content.additionalcharge = quotation.additionalcharge != 0 ? quotation.additionalcharge * currencyRate : 0;
									$scope.content.preferredCurrency = quotation.currency;
									$scope.content.PromoAmt = 0;
									$scope.exchangeRate = parseFloat(currencyRate).toFixed(parseInt($rootScope.decimalPoint));
									rate = parseFloat(currencyRate);
								}, function () {
									isQuotation=false;
									self.searchQuotation=null;
									$scope.isAdded=false;
									$scope.clearFields();
								});

							}
						}
						else
						{
							isQuotation=false;
							self.searchQuotation=null;
							var title='';
							var selectedProduct;
							for(var key in data.info) {
								selectedProduct=$filter('filter')(quotationDet, {guItemID: key})[0];
								title+='Product Code : '+selectedProduct.code;
							}
							$mdDialog.show(
								$mdDialog.alert()
									.parent(angular.element(document.querySelector('#invoice')))
									.clickOutsideToClose(false)
									.title('Insufficient Quantity')
									.textContent(title)
									.ariaLabel('Alert Dialog Demo')
									.ok('Ok'));
							//$scope.addNewRow();
							$scope.isAdded=false;
							$scope.clearFields();
						}
					}).error(function () {
						isQuotation=false;
						$scope.addNewRow();
						self.searchQuotation=null;

					})

				}).error(function () {

				})
			}
		}


		//addCtrl



		//invoice list ctrl functions

		var skip=0;
		var take=50;
		var invoicePrefix;
		var invoiceDate;
		var prefixLength;
		$scope.invoices=[];
		$scope.users=[];
		$scope.showMore = false;

		//this function fetches a random text and adds it to array
		$scope.moreInvoice = function(){

			$scope.listLoaded = 'loading';
			vm.invoices=[];
			$charge.invoice().all(skip,take,"desc").success(function(data) {


				for (var i = 0, len = data.length; i < len; i++)
				{
					//var invoice={};
					//invoice.invoiceNo=prefixInvoice;
					invoiceDate=moment(data[i].invoiceDate).format('LL');
					//invoice.invoice_type = data[i].invoiceType;
					//
					//invoice.code=data[i].invoiceNo;
					//invoice.invoiceAmount=data[i].invoiceAmount*data[i].rate;
					//invoice.currency=data[i].currency;
					//invoice.invoiceDate=invoiceDate;
					data[i]['guInvID']=data[i].guInvID
					data[i]['invoice_type']=data[i].invoiceType;
					data[i]['code']=data[i].invoiceNo;
					data[i]['code']=$filter('numberFixedLen')(data[i]['code'],lenPrefix);
					data[i]['currency']=data[i].currency;
					data[i]['prefix']=lenPrefix;
					data[i]['invoiceNo']=prefixInvoice+data[i]['code'];
					data[i]['invoiceDate']=invoiceDate;
					data[i]['invoiceAmount']=data[i].invoiceAmount*data[i].rate;
					data[i]['client'] = data[i].profile_type=="Individual"?data[i].first_name:data[i].business_name;

					$scope.invoices.push(data[i]);

				}
				//$scope.invoices=data;

				vm.invoices=$scope.invoices;
				//var dsdsa = $filter('filter')(vm.invoices, mySearch);

				vm.selectedInvoice = vm.invoices[0];

				$scope.listLoaded = 'loaded';

				if(data.length === take) {
					skip += take;
					$scope.showMore = true;
				}else{
					$scope.showMore = false;
				}
			}).error(function(data) {
				$scope.listLoaded = 'loaded';

			})
		};


		//full text search invoice start

		//	var skip,take;
		var tempInvoiceList;
		var originalKeyword;
		$scope.loadInvoiceByKeyword= function (keyword) {

			if(keyword.length > 2 && $scope.invoices.length >= 50) {
				$scope.listLoaded = 'loading';
				skip = 0;
				tempInvoiceList = [];
				$charge.invoice().filterByKey(keyword, skip, take).success(function (data) {
					for (var i = 0; i < data.length; i++) {
						invoiceDate=moment(data[i].invoiceDate).format('LL');
						data[i]['guInvID']=data[i].guInvID
						data[i]['invoice_type']=data[i].invoiceType;
						data[i]['code']=data[i].invoiceNo;
						data[i]['code']=$filter('numberFixedLen')(data[i]['code'],lenPrefix);
						data[i]['currency']=data[i].currency;
						data[i]['prefix']=lenPrefix;
						data[i]['invoiceNo']=prefixInvoice+data[i]['code'];
						data[i]['invoiceDate']=invoiceDate;
						data[i]['invoiceAmount']=data[i].invoiceAmount*data[i].rate;
						data[i]['client'] = data[i].profile_type=="Individual"?data[i].first_name:data[i].business_name;
						tempInvoiceList.push(data[i]);

						$scope.listLoaded = 'loaded';
						$scope.showMore = false;
					}
					vm.invoices = tempInvoiceList;
				}).error(function (data) {
					vm.invoices = [];
					$scope.showMore = false;
					$scope.listLoaded = 'loaded';
				})

			}
			else if (keyword.length == 0 || keyword == null) {
				vm.invoices = $scope.invoices;
			}
		}


		$scope.loadInvoiceByPaging= function (keyword,skip, take,len) {
			$charge.invoice().filterByKey(keyword, skip, take,len).success(function (data) {
				for(var i=0;i<data.length;i++)
				{
					data[i]['code']=data[i].invoiceNo;
					data[i]['code']=$filter('numberFixedLen')(data[i]['code'],lenPrefix);
					//data[i]['code']=data[i].invoiceNo;
					data[i]['prefix']=lenPrefix;
					data[i]['invoiceNo']=prefixInvoice+'-'+data[i]['code'];
					data[i]['invoiceDate']=invoiceDate;
					data[i]['invoiceAmount']=data[i].invoiceAmount*data[i].rate;
					data[i]['client'] = data[i].profile_type=="Individual"?data[i].first_name:data[i].business_name;
					data[i]['invoice_type']=data[i].invoiceType;
					tempInvoiceList.push(data[i]);

				}
				skip += take;
				$scope.loadInvoiceByPaging(keyword, skip, take,len);
			}).error(function (data) {
				if(tempInvoiceList.length>0) {
					vm.invoices = tempInvoiceList;
					//$scope.openProduct(vm.products[0]);
				}
				else
				{
					vm.invoices=[];
				}
			});
		}
		//full text search invoice end

		//invoice by type start
		$scope.getInvoiceByType= function (type) {
			var skipType=0,takeType=50;
			$charge.invoice().getInvoiceByType(type, skipType, takeType,'desc').success(function (data) {
				for(var i=0;i<data.length;i++)
				{
					data[i]['code']=data[i].invoiceNo;
					data[i]['code']=$filter('numberFixedLen')(data[i]['code'],lenPrefix);
					//data[i]['code']=data[i].invoiceNo;
					data[i]['prefix']=lenPrefix;
					data[i]['invoiceNo']=prefixInvoice+'-'+data[i]['code'];
					data[i]['invoiceDate']=invoiceDate;
					data[i]['invoiceAmount']=data[i].invoiceAmount*data[i].rate;
					data[i]['client'] = data[i].profile_type=="Individual"?data[i].first_name:data[i].business_name;
					data[i]['invoice_type']=data[i].invoiceType;
				}
				vm.invoices=data;
			}).error(function(data){
				vm.invoices=[];
			});
		}
		//invoice by type end


		//invoice by status start
		$scope.getInvoiceByStatus= function (status) {
			var skipType=0,takeType=50;
			$charge.invoice().getInvoiceByStatus(status, skipType, takeType,'desc').success(function (data) {
				for(var i=0;i<data.length;i++)
				{
					data[i]['code']=data[i].invoiceNo;
					data[i]['code']=$filter('numberFixedLen')(data[i]['code'],lenPrefix);
					//data[i]['code']=data[i].invoiceNo;
					data[i]['prefix']=lenPrefix;
					data[i]['invoiceNo']=prefixInvoice+'-'+data[i]['code'];
					data[i]['invoiceDate']=invoiceDate;
					data[i]['invoiceAmount']=data[i].invoiceAmount*data[i].rate;
					data[i]['client'] = data[i].profile_type=="Individual"?data[i].first_name:data[i].business_name;
					data[i]['invoice_type']=data[i].invoiceType;
				}
				vm.invoices=data;
			}).error(function(data){
				vm.invoices=[];
			});
		}
		//invoice by status end

		//get all invoices filter start
		$scope.getAllInvoices= function () {
			vm.invoices=$scope.invoices;
		}
		//get all invoices filter end

		$scope.loadmore = function(take){

			$scope.spinnerInvoice=true;
			$charge.invoice().all(skip,take,"desc").success(function(data) {
				//
				if(data.length<take)
					$scope.lastSet=true;
				data.forEach(function(inv){
					//
					var accountID=inv.guAccountID;
					var invoiceDate=moment(inv.invoiceDate).format('LL');
					//

					var user = $scope.getUserByID(accountID);
					var invoice={};
					if(user!=null) {
						invoice.person_name = user.profilename;
						invoice.othername=user.othername;
					}
					invoice.invoice_type = inv.invoiceType;

					invoice.code=inv.invoiceNo;
					invoice.invoiceDate=invoiceDate;
					if(inv.paidAmount==0)
						invoice.status='Not paid';
					else if(inv.paidAmount>0 && inv.paidAmount<inv.invoiceAmount)
						invoice.status='Partial Paid';
					else if(inv.paidAmount==inv.invoiceAmount)
						invoice.status='Paid';
					//invoice.status='Paid';
					$scope.invoices.push(invoice);

				});
				for (var i = 0; i < $scope.invoices.length; ++i) {
					if ($scope.invoices[i].status == "Paid") {
						$scope.invoices[i].StatusColor = "green";
					} else if ($scope.invoices[i].status == "Partial Paid") {
						$scope.invoices[i].StatusColor = "skyblue";
					}
					else if ($scope.invoices[i].status == "Not paid") {
						$scope.invoices[i].StatusColor = "orange";
					}
					else if ($scope.invoices[i].status == "Void") {
						$scope.invoices[i].StatusColor = "red";
					}

				}
				$scope.spinnerInvoice=false;
				skip += take;

			}).error(function(data) {
				//response=data;
				//
				var da=$scope.invoices;
				$scope.lastSet=true;
				$scope.spinnerInvoice=false;
			})
		};
		var skipUsr= 0,takeUsr=1000;
		$scope.loadingUsers = true;
		//$scope.loadUsers = function(){
		//
		//  $charge.profile().all(skipUsr,takeUsr,'asc').success(function(data)
		//  {
		//    console.log(data);
		//    if($scope.loadingUsers)
		//    {
		//      for (var i = 0; i < data.length; i++) {
		//        var obj = data[i];
		//        if(obj.profile_type=='Individual')
		//        {
		//          $scope.users.push({
		//            profilename : obj.first_name,
		//            profileId : obj.profileId,
		//            othername : obj.last_name,
		//            profile_type : obj.profile_type,
		//            bill_addr:obj.bill_addr,
		//            category:obj.category,
		//            email:obj.email_addr
		//          });
		//        }
		//        else if(obj.profile_type=='Business') {
		//          $scope.users.push({
		//            profilename : obj.business_name,
		//            profileId : obj.profileId,
		//            othername : obj.business_contact_name,
		//            profile_type : obj.profile_type,
		//            bill_addr:obj.bill_addr,
		//            category:obj.category,
		//            email:obj.email_addr
		//
		//          });
		//        }
		//
		//      }
		//
		//      skipUsr += takeUsr;
		//      $scope.loadUsers();
		//    }
		//
		//  }).error(function(data)
		//  {
		//    //console.log(data);
		//    $scope.isSpinnerShown=false;
		//    $scope.more();
		//  })
		//
		//};
		//$scope.loadUsers();
		$scope.moreInvoice();



		$scope.loadInvoiceDetail = function(data){

			$scope.invProducts=[];
			var invoiceDetails=data[0].invoiceDetails;
			var count=invoiceDetails.length;
			var productName;
			var status=false;
			var totDiscount=0;
			//var address = $scope.GetAddress(invoice.person_name);
			// var address = $filter('filter')($scope.users, { profilename: invoice.person_name })[0];
			// $scope.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
			//var prefixInvoice=invoicePrefix !="" ? invoicePrefix.RecordFieldData:"INV";
			var exchangeRate=parseFloat(data[0].rate);
			$scope.selectedInvoice={};
			$scope.selectedInvoice = data[0];
			$scope.selectedInvoice.guInvID=data[0].guInvID;

			var array =  $scope.selectedInvoice.period.split(',');
			$scope.selectedInvoice.periodStartDate =  array[0];
			$scope.selectedInvoice.periodEndDate =  array[1];


			//var invoiceNum=invoice.invoiceNo;
			//$scope.selectedInvoice.invoiceNo=invoiceNum;
			$scope.selectedInvoice.bill_addr = data[0].bill_addr;
			$scope.selectedInvoice.person_name = data[0].profile_type=="Individual"?data[0].first_name + " " + data[0].last_name:data[0].business_name;
			$scope.selectedInvoice.email_addr = data[0].email_addr;
			$scope.selectedInvoice.phone=data[0].phone;
			$scope.selectedInvoice.subTotal=angular.copy(data[0].subTotal*exchangeRate);
			$scope.selectedInvoice.discAmt=data[0].discAmt*exchangeRate;
			//$scope.selectedInvoice.invoiceNo=prefixInvoice;
			$scope.selectedInvoice.additionalcharge=data[0].additionalcharge*exchangeRate;
			$scope.selectedInvoice.invoiceAmount=data[0].invoiceAmount*exchangeRate;
			$scope.selectedInvoice.tax=data[0].tax*exchangeRate;
			$scope.selectedInvoice.dueDate=moment(data[0].dueDate.toString()).format('LL');
			$scope.selectedInvoice.logo=$scope.content.companyLogo;
			$scope.selectedInvoice.currency=data[0].currency;
			$scope.selectedInvoice.rate=exchangeRate;
			$scope.selectedInvoice.invoiceDetails=invoiceDetails;
			$scope.selectedInvoice.companyName=$scope.content.companyName;
			$scope.selectedInvoice.companyAddress=$scope.content.companyAddress;
			$scope.selectedInvoice.companyPhone=$scope.content.companyPhone;
			$scope.selectedInvoice.companyEmail=$scope.content.companyEmail;
			$scope.selectedInvoice.companyLogo=$scope.content.companyLogo;
			invoiceDetails.forEach(function(inv){
				inv.product_name= inv.product_name;
				inv.unitPrice= inv.unitPrice*exchangeRate;
				inv.gty= inv.gty;
				inv.totalPrice=(inv.unitPrice * inv.gty) - inv.discount;
				totDiscount=totDiscount+inv.discount*exchangeRate;
				inv.promotion=totDiscount});

			$scope.selectedInvoice.subTotal = 0;
			for(var i=0;i<invoiceDetails.length;i++){

				$scope.selectedInvoice.subTotal += invoiceDetails[i].totalPrice;
			}


			$scope.selectedInvoice.discount=totDiscount;
			vm.selectedInvoice=$scope.selectedInvoice;
			vm.selectedInvoice.transactionType = invoice.transactionType;
			//$scope.showAdvancedInvoice(ev,vm.selectedInvoice);
			invoice.isDialogLoading = false;

			extractEmailTemplate(vm.selectedInvoice, function () {
				var preview = $('#print-content');
				preview.children().remove();
				preview.append($scope.currEmailTemplate);
				$scope.isReadLoaded = true;
			});

		}


		$scope.editOff = true;
		$scope.isReadLoaded = true;
		$scope.openInvoiceLst = function(invoice)
		{
			$scope.isReadLoaded = false;
			vm.selectedInvoiceList = invoice;

			if($scope.issubscriptionappuse){
				$charge.invoice().getByGuinvId(invoice.guInvID).success(function (data) {
					$scope.loadInvoiceDetail(data);
				}).error(function (data) {
					// console.log(data);
					$scope.spinnerInvoice = false;
					$scope.isReadLoaded = true;
				});

			}else {

				$charge.invoice().getByGuinvIdForInvoiceModule(invoice.guInvID).success(function (data) {
					$scope.loadInvoiceDetail(data);
				}).error(function (data) {
					// console.log(data);
					$scope.spinnerInvoice = false;
					$scope.isReadLoaded = true;
				});
			}
		}


		vm.editInvoice={};
		vm.editInvoice.remarks="";
		vm.editInvoice.invoiceDate=new Date();
		vm.editInvoice.dueDate=new Date();



		function getDomainName() {
			var _st = gst("domain");
			return (_st != null) ? _st : "cogni"; //"248570d655d8419b91f6c3e0da331707 51de1ea9effedd696741d5911f77a64f";
		}

		function getDomainExtension() {
			var _st = gst("extension_mode");
			return (_st != null) ? _st : "test"; //"248570d655d8419b91f6c3e0da331707 51de1ea9effedd696741d5911f77a64f";
		}


		var skipUsr= 0,takeUsr=1000;
		$scope.filteredUsers=[];
    $scope.loadUsersByCat= function (skipUsr,takeUsr) {

      var jsonData = {
        "url": "https://cloudchargesearch.search.windows.net/indexes/profiles/docs/search?api-version=2016-09-01",
        "searchBy": "*",
        "searchFields": "",
        "take": takeUsr,
        "skip": skipUsr,
        "orderby": "createddate desc"
      }

      $charge.searchhelper().searchRequest(jsonData).success(function(data)
      {
        skipUsr += takeUsr;
        for (var i = 0; i < data.value.length; i++) {
          if(data.value[i].status==0)
          {
            data.value[i].status=false;
          }
          else
          {
            data.value[i].status=true;
          }
          data.value[i].createddate = new Date(data.value[i].createddate);
          //tempList.push(data.value[i]);

        }

        if(data.value.length<takeUsr)
          vm.lastProfile=true;
        for (var i = 0; i < data.value.length; i++) {
          var obj = data.value[i];

          $scope.filteredUsers.push({
            profilename : obj.first_name,
            profileId : obj.profileId,
            othername : obj.last_name,
            bill_addr:obj.bill_addr,
            email:obj.email_addr,
            credit_limit:obj.credit_limit
          });
        }

        if(data.value.length<takeUsr){
          $scope.isdataavailable=false;
          $scope.hideSearchMore=true;
          skipUsr = 0;
        }
        else if(data.value.length!=0 && data.value.length>=takeUsr)
        {
          //skipUsr+=takeUsr;
          $scope.loadUsersByCat(skipUsr,takeUsr);
        }

      }).error(function(data)
      {
        $scope.isloadDone = true;
        skipUsr = 0;
      })

    }

		$scope.loadUsersByCat(skipUsr,takeUsr);


		//var skipPlan= 0,takePlan=10;
		var skipDetail= 0,takeDetail=10;
		$scope.products=[];

		$scope.loadAllProducts = function(skipDetail,takeDetail)
		{
			$charge.product().all(skipDetail,takeDetail,"desc").success(function(data)
			{
				skipDetail += takeDetail;
				for (var i = 0; i < data.length; i++) {
					$scope.products.push(data[i]);
				}

				//
				if(data.length<takeDetail){
					$scope.isdataavailable=false;
					$scope.hideSearchMore=true;
					$scope.addNewRow();
				}
				else if(data.length!=0 && data.length>=takeDetail)
				{
					$scope.loadAllProducts(skipDetail,takeDetail);
				}
				else if(data.length==0)
				{
					$scope.addNewRow();
				}



			}).error(function(data)
			{
				//console.log(data);
				$scope.isSpinnerShown=false;
				$scope.isdataavailable=false;
				$scope.loading = false;
				$scope.isLoading = false;
				$scope.hideSearchMore=true;
			})

		}

    $scope.loadAllPlans= function (skipDetail,takeDetail) {

      //var jsonData = {
      //  "url": "https://cloudcharge.search.windows.net/indexes/plan/docs/search?api-version=2016-09-01",
      //  "searchBy": "*",
      //  "searchFields": "",
      //  "take": takeDetail,
      //  "skip": skipDetail,
      //  "orderby": "createdDate desc"
      //}

      //$charge.searchhelper().searchRequest(jsonData).success(function(data)
      //{
      $azureSearchHandle.getClient().SearchRequest("plan",skipDetail,takeDetail,'desc','Active').onComplete(function(data)
      {
        if($scope.loading)
        {
          data.value = data;
          skipDetail += takeDetail;
          for (var i = 0; i < data.value.length; i++) {
            if(data.value[i].status === 'Active')
            {
              $scope.products.push(data.value[i])
            }
          }

          //
          if(data.value.length<takeDetail){
            $scope.isdataavailable=false;
            $scope.hideSearchMore=true;
            $scope.addNewRow();
            skipDetail = 0;
          }
          else if(data.value.length!=0 && data.value.length>=takeDetail)
          {
            $scope.loadAllPlans(skipDetail,takeDetail);
          }
          else if(data.value.length==0)
          {
            $scope.addNewRow();
          }

        }

      }).onError(function(data)
      {
        //console.log(data);
        $scope.isSpinnerShown=false;
        $scope.isdataavailable=false;
        $scope.loading = false;
        $scope.isLoading = false;
        $scope.hideSearchMore=true;

        skipDetail = 0;
      })
    }



		if($scope.issubscriptionappuse){

			$scope.loadAllPlans(skipDetail, takeDetail);
		}else {
			$scope.loadAllProducts(skipDetail, takeDetail);
		}


		var self = this;
		self.selectedItem  = null;
		self.searchProfile    = null;


		$scope.queryProfile =function(query,index) {
			var results=[];
			var len = $scope.filteredUsers.length;
			for (i = 0;i<len; ++i){

				//console.log($scope.allBanks[i].value.value);
				//
				//if($scope.rows[index].productlst[i].product_name.toLowerCase().indexOf(query.toLowerCase()) !=-1)
				{
					if($scope.filteredUsers[i].profilename.toLowerCase().startsWith(query.toLowerCase()))
					{
						//
						results.push($scope.filteredUsers[i]);
					}
					else if($scope.filteredUsers[i].othername.toLowerCase().indexOf(query.toLowerCase()) !=-1)
					{
						results.push($scope.filteredUsers[i]);
					}
					//else if($scope.filteredUsers[i].email_addr.toLowerCase().indexOf(query.toLowerCase()) !=-1)
					//{
					//    results.push($scope.filteredUsers[i]);
					//}
				}
			}
			return results;
		}

		$scope.toggleEdit = function () {

			$scope.editOff = true;
			vm.activeInvoicePaneIndex = 1;
			$scope.showInpageReadpane = false;
		};


		$scope.showInpageReadpane = false;
		$scope.switchInfoPane = function (state, plan) {
			if(state=='show'){
				$scope.showInpageReadpane = true;
			}else if(state=='close'){
				if($scope.inpageReadPaneEdit){
					$scope.cancelEdit();
					vm.selectedPlan = $scope.tempEditPlan;
				}else{
					$scope.showInpageReadpane = false;
					$scope.inpageReadPaneEdit=false;
				}
			}
		}


		$charge.settingsapp().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes","BaseCurrency").success(function(data) {
			$scope.BaseCurrency=data[0].RecordFieldData;
			//$scope.selectedCurrency = $scope.BaseCurrency;

		}).error(function(data) {
			//console.log(data);
			$scope.BaseCurrency="USD";
			//$scope.selectedCurrency = $scope.BaseCurrency;
		})

		//suvethan code end

		/*
		 Add Customer
		 */

		$scope.addNewUser = function(ev, userCategory)
		{
			//console.log("yes");
			//$scope.content.user = "";
			$mdDialog.show({
				controller: 'AddCustomerController',
				templateUrl: 'app/main/invoice/dialogs/compose/compose-dialog-customer.html',
				controllerAs       : 'vm',
				locals             : {
					selectedMail: undefined,
					category: userCategory
				},
				parent: angular.element($document.body),
				targetEvent: ev,
				clickOutsideToClose:true
			})
				.then(function(obj) {
					//
					if(obj.profile_type=='Individual')
					{
						$scope.filteredUsers.push({
							profilename : obj.first_name,
							profileId : obj.profileId,
							othername : obj.last_name,
							profile_type : obj.profile_type,
							bill_addr:obj.bill_addr,
							category:obj.category,
							email:obj.email_addr,
							credit_limit:obj.credit_limit
						});
						//$scope.filteredtempUsers.push({
						//  profilename : obj.first_name,
						//  profileId : obj.profileId,
						//  othername : obj.last_name,
						//  profile_type : obj.profile_type,
						//  bill_addr:obj.bill_addr,
						//  category:obj.category,
						//  email:obj.email_addr
						//});
						//self.searchProfile=obj.first_name;
						//$scope.content.bill_addr
					}
					else if(obj.profile_type=='Business') {
						$scope.filteredUsers.push({
							profilename : obj.business_name,
							profileId : obj.profileId,
							othername : obj.business_contact_name,
							profile_type : obj.profile_type,
							bill_addr:obj.bill_addr,
							category:obj.category,
							email:obj.email_addr,
							credit_limit:obj.credit_limit
						});
						//$scope.filteredtempUsers.push({
						//  profilename : obj.business_name,
						//  profileId : obj.profileId,
						//  othername : obj.business_contact_name,
						//  profile_type : obj.profile_type,
						//  bill_addr:obj.bill_addr,
						//  category:obj.category,
						//  email:obj.email_addr
						//
						//});
						//self.searchProfile=obj.business_name;
					}
				})

		}

		$scope.addNewProduct = function(ev)
		{
			//console.log("yes");
			//$scope.content.user = "";
			$mdDialog.show({
				controller: 'CustomProductController',
				templateUrl: 'app/main/invoice/dialogs/compose/compose-dialog-product.html',
				controllerAs       : 'vm',
				locals             : {
					selectedMail: undefined,
					decimalPoint:$rootScope.decimalPoint
				},
				parent: angular.element($document.body),
				targetEvent: ev,
				clickOutsideToClose:true
			})
				.then(function(obj) {
					if(obj!=undefined)
					{
						for(var j=0;j<$scope.rows.length;j++) {
							//for (var i = 0; i < $scope.rows[j].productlst.length; i++) {
							$scope.rows[j].productlst.push(obj);
							//}
						}
						if($scope.productlist.length<10)
						{
							$scope.productlist.push(obj);
						}
						//$scope.tempProduct.push({
						//  productId:obj.productId
						//});
					}
				})

		}

		//$scope.loadAllProducts=function()
		//{
		//  //
		//  $scope.spinnerInvoice=true;
		//  var product=$productHandler.getClient().LoadProduct().onComplete(function(data)
		//  {
		//    $scope.invProductList=data;
		//    //$scope.spinnerInvoice=false;
		//  });
		//
		//}
		//
		//$scope.loadAllProducts();

		$scope.getUserByID=function(id)
		{
			//
			var users=$scope.users;
			var profileID=id;
			var currentUser={};
			var mapUservar = $filter('filter')(users, { profileId: profileID })[0];
			return mapUservar;
		}


		$scope.getProductByID=function(id)
		{
			//
			var count=0;
			var isAvailable=false;
			var products=$scope.invProductList;
			var productID=id;
			var productName;
			var currentUser={};
			//for (var i = 0; i < products.length; i++) {
			//    var obj = products[i];
			//    if(obj.productId==productID) {
			//        productName=obj.product_name;
			//    }
			//}
			//products.forEach(function(product){
			//    if(product.productId==productID) {
			//        productName=product.product_name;
			//    }
			//});
			var productName = products.map(function(product){
				if(product.productId==productID) {
					isAvailable=true;
					//
					return product;
				}
				if(!isAvailable)
					count++;

			});
			//
			return productName[count].product_name;
		}

		$scope.GetAddress=function(name)
		{
			//
			var users=$scope.users;
			var addr;
			var selectedName=name;
			for (var i = 0; i < users.length; i++) {
				var obj = users[i];
				if(obj.profilename==selectedName) {
					addr=obj.bill_addr;
				}
			}
			return addr;
		}

		$scope.getPromotionByID=function(id)
		{
			for (i = 0; i < $scope.promotions.length; i++) {
				if ($scope.promotions[i].promotioncode == promocode) {
					isValid = true;
					$scope.content.gupromotionid = $scope.promotions[i].gupromotionid;
					break;
				}
			}
		}


		// $scope.printDiv = function(divName) {
		// 	//var mediaQueryList = window.matchMedia('print');
		// 	//
		// 	if($scope.selectedInvoice.companyLogo == undefined || $scope.selectedInvoice.companyLogo == ''){
		// 		var printContents = document.getElementById(divName).innerHTML;
		// 		var popupWin = window.open('', '_blank', 'width=1800,height=700');
		// 		var roboto="<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>";
		// 		popupWin.document.open();
		// 		popupWin.document.write('<html><head>' +
		// 			"<link href='app/main/invoice/views/read/print-view.css' rel='stylesheet' type='text/css'>"+
		// 			'</head><body onload="window.print()">' + printContents + '<script src="views/read/jquery.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
		// 		//window.print();
		// 		popupWin.document.close();
		// 	}else{
		// 		var printContents = document.getElementById(divName).innerHTML;
		// 		console.log(printContents);
		// 		var popupWin = window.open('', '_blank', 'width=1800,height=700');
		// 		popupWin.document.open();
		// 		popupWin.document.write('<html><head>' +
		// 			"<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
		// 			"<link href='app/main/invoice/views/read/print-view2.css' rel='stylesheet' type='text/css'>"+
		// 			'</head><body onload="window.print()">' + printContents + '<script src="views/read/jquery.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
		// 		//window.print();
		// 		popupWin.document.close();
		// 	}
		// 	//var doc = new jsPDF();
		// 	//var obj = hasNull(obj);
		// 	//
		// 	//toDataUrl(obj.logo, function(base64Img){
		// 	//
		// 	//  doc.addImage(base64Img, 'JPEG', 10, 15,50, 60);
		// 	//  doc.setFont("courier");
		// 	//  doc.setFontSize(20);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(90, 40, "Invoice");
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("normal");
		// 	//  doc.text(27, 100, "Invoice #:");
		// 	//  doc.setFontSize(12);
		// 	//  doc.text(70, 100, obj.code.toString());
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.text(27, 110, "Created:");
		// 	//  doc.setFontSize(12);
		// 	//  doc.text(70, 110, obj.invoiceDate);
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.text(27, 120, "Due:");
		// 	//  doc.setFontSize(12);
		// 	//  doc.text(70, 120, obj.dueDate);
		// 	//
		// 	//
		// 	//  //Address
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("normal");
		// 	//  doc.text(120, 90, "To:");
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("normal");
		// 	//  doc.text(120, 100, obj.person_name + " " + obj.othername);
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("normal");
		// 	//  var splitTitle = doc.splitTextToSize(obj.bill_addr, 80);
		// 	//  doc.text(120, 110, splitTitle);
		// 	//
		// 	//
		// 	//  //doc.setFontSize(12);
		// 	//  //doc.setFontType("normal");
		// 	//  //doc.text(135, 130,obj.profileEmail);
		// 	//
		// 	//  //table headers
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(35, 160, "Product");
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(65, 160, "Unit Price");
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(95, 160, "Qty");
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(125, 160, "Total Price");
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(27, 162, "___________________________________________________________________");
		// 	//
		// 	//  // table records
		// 	//  var startHeight = 170;
		// 	//
		// 	//  if ($scope.invProducts.length > 0) {
		// 	//    for (var o = 0; o <= $scope.invProducts.length - 1; o++) {
		// 	//
		// 	//      doc.setFontSize(12);
		// 	//      doc.setFontType("normal");
		// 	//      doc.text(35, startHeight, $scope.invProducts[o].product_name.toString());
		// 	//      //doc.textEx(invProducts[o].product_name.toString(),35,startHeight,'right','middle');
		// 	//
		// 	//      doc.setFontSize(12);
		// 	//      doc.setFontType("normal");
		// 	//      doc.text(65, startHeight, '$' + $scope.invProducts[o].unitprice.toString());
		// 	//      //doc.textEx(invProducts[o].unitprice.toString(),65,startHeight,'right','middle');
		// 	//
		// 	//      doc.setFontSize(12);
		// 	//      doc.setFontType("normal");
		// 	//      doc.text(95, startHeight, $scope.invProducts[o].qty.toString());
		// 	//      //doc.textEx(invProducts[o].qty.toString(),95,startHeight,'right','middle');
		// 	//
		// 	//      doc.setFontSize(12);
		// 	//      doc.setFontType("normal");
		// 	//      doc.text(125, startHeight, '$' + $scope.invProducts[o].amount.toString());
		// 	//      //doc.textEx(invProducts[o].amount.toString(),125,startHeight,'right','middle');
		// 	//
		// 	//      doc.setFontSize(12);
		// 	//      doc.setFontType("normal");
		// 	//      doc.text(27, startHeight + 2, "___________________________________________________________________");
		// 	//
		// 	//      startHeight += 10;
		// 	//
		// 	//    }
		// 	//  }
		// 	//
		// 	//  //total payments
		// 	//
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(125, 190, "Sub Total:");
		// 	//  //doc.text(180, 190,obj.subTotal.toString());
		// 	//  doc.textEx(obj.subTotal.toString(), 180, 189, 'right', 'middle');
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(125, 200, "Additional Charges:");
		// 	//  //doc.text(180, 200,obj.additionalcharge.toString());
		// 	//  doc.textEx(obj.additionalcharge.toString(), 180, 199, 'right', 'middle');
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(125, 210, "Discount:");
		// 	//  //doc.text(180, 210,obj.discAmt.toString());
		// 	//  doc.textEx(obj.discAmt.toString(), 180, 209, 'right', 'middle');
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(125, 220, "Tax:");
		// 	//  //doc.text(180, 220,obj.tax.toString());
		// 	//  doc.textEx(obj.tax.toString(), 180, 219, 'right', 'middle');
		// 	//
		// 	//
		// 	//  doc.setFontSize(12);
		// 	//  doc.setFontType("bold");
		// 	//  doc.text(125, 230, "Net Total:");
		// 	//  //doc.text(180,230,'$'+obj.invoiceAmount.toString());
		// 	//  doc.textEx(obj.invoiceAmount.toString(), 180, 229, 'right', 'middle');
		// 	//  //doc.save('' + 'test1214'+ '.pdf');
		// 	//
		// 	//  //var output = doc.output('datauristring');
		// 	//  //UploaderService.saveToPdf(output);
		// 	//  doc.autoPrint();
		// 	//  doc.output('dataurlnewwindow');
		// 	//});
		//
		// }
		$scope.printDiv = function () {
			var printContent = document.getElementById('print-content');
			var popupWin = window.open('', '_blank', 'width=1000,height=700');
			popupWin.document.open();
			popupWin.document.write('<html><head><link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css"><link href="app/main/360/dialogs/compose/print-view.css" rel="stylesheet" type="text/css"></head><body style="margin: 30px;">' + printContent.innerHTML + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
			popupWin.document.close();
		};

		$scope.emailTemplateInit = function(ev,base64Conversion){
			$mdDialog.show({
				controller: 'AddInvoiceController',
				templateUrl: 'app/main/invoice/dialogs/compose/mailTemplate.html',
				parent: angular.element(document.body),
				targetEvent: ev,
				clickOutsideToClose:true,
				locals : {
					selectedInvoice: $scope.selectedInvoice,
					base64Content:base64Conversion,
					adminData:$scope.adminData
				},
				fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
			})
			//

		}

		$scope.adminData=null;
		$scope.getAdminUser= function () {
			$charge.commondetails().getAdminInfo().success(function(data){
				$scope.adminData=data;
			}).error(function (data) {

			})
		}

		$scope.getAdminUser();

		$scope.emailInvoice= function (ev,divName) {
			var printContents = document.getElementById(divName).innerHTML;
			var base64Conversion=window.btoa(unescape(encodeURIComponent(printContents)));
			$scope.emailTemplateInit(ev,base64Conversion);

		}

		/*
		 * Invoice Mail PDF generation start
		 *
		 */


		/*
		 Validate Amount start
		 */

		$scope.validateAmount= function () {
			$scope.content.discount;
			//
			if($scope.content.discount>$scope.content.netamt)
			{
				$scope.showValidationDialog('info','Invalid discount.','Error');
				$scope.content.discount=0;
			}
			else if($scope.content.discount==undefined || $scope.content.discount==null)
				$scope.content.discount=0;
		}

		/*
		 Validate Amount end
		 */


		$scope.chkMiscCharge= function () {
			//
			if($scope.content.additionalcharge==undefined || $scope.content.additionalcharge==null)
				$scope.content.additionalcharge=0;
		}
		function hasNull(target) {
			for (var member in target) {
				if (target[member] == null)
					target[member] = "";
			}
			return target;
		}

		var splitRegex = /\r\n|\r|\n/g;

		jsPDF.API.textEx = function (text, x, y, hAlign, vAlign) {
			var fontSize = this.internal.getFontSize() / this.internal.scaleFactor;

			// As defined in jsPDF source code
			var lineHeightProportion = 1.15;

			var splittedText = null;
			var lineCount = 1;
			if (vAlign === 'middle' || vAlign === 'bottom' || hAlign === 'center' || hAlign === 'right') {
				splittedText = typeof text === 'string' ? text.split(splitRegex) : text;

				lineCount = splittedText.length || 1;
			}

			// Align the top
			y += fontSize * (2 - lineHeightProportion);

			if (vAlign === 'middle')
				y -= (lineCount / 2) * fontSize;
			else if (vAlign === 'bottom')
				y -= lineCount * fontSize;

			if (hAlign === 'center' || hAlign === 'right') {
				var alignSize = fontSize;
				if (hAlign === 'center')
					alignSize *= 0.5;

				if (lineCount > 1) {
					for (var iLine = 0; iLine < splittedText.length; iLine++) {
						this.text(splittedText[iLine], x - this.getStringUnitWidth(splittedText[iLine]) * alignSize, y);
						y += fontSize;
					}
					return this;
				}
				x -= this.getStringUnitWidth(text) * alignSize;
			}

			this.text(text, x, y);
			return this;
		}


		function toDataUrl(url, callback) {
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'blob';
			xhr.onload = function () {
				var reader = new FileReader();
				reader.onloadend = function () {
					callback(reader.result);
				}
				reader.readAsDataURL(xhr.response);
			};
			xhr.open('GET', url);
			xhr.send();
		}

		$scope.sortBy = function(propertyName,status,property) {

			vm.invoices=$filter('orderBy')(vm.invoices, propertyName, $scope.reverse)
			$scope.reverse =!$scope.reverse;
			if(status!=null) {
				if(property=='ID')
				{
					$scope.showId = status;
					$scope.showCust = false;
					$scope.showEmail = false;
					$scope.showDate = false;
					$scope.showAmount = false;
					$scope.showStat = false;
				}
				if(property=='Customer')
				{
					$scope.showId = false;
					$scope.showCust = status;
					$scope.showEmail = false;
					$scope.showDate = false;
					$scope.showAmount = false;
					$scope.showStat = false;
				}
				if(property=='Email')
				{
					$scope.showId = false;
					$scope.showCust = false;
					$scope.showEmail = status;
					$scope.showDate = false;
					$scope.showAmount = false;
					$scope.showStat = false;
				}
				if(property=='Date')
				{
					$scope.showId = false;
					$scope.showCust = false;
					$scope.showEmail = false;
					$scope.showDate = status;
					$scope.showAmount = false;
					$scope.showStat = false;
				}
				if(property=='Amount')
				{
					$scope.showId = false;
					$scope.showCust = false;
					$scope.showEmail = false;
					$scope.showDate = false;
					$scope.showAmount = status;
					$scope.showStat = false;
				}
				if(property=='Status')
				{
					$scope.showId = false;
					$scope.showCust = false;
					$scope.showEmail = false;
					$scope.showDate = false;
					$scope.showAmount = false;
					$scope.showStat = status;
				}
			}
		};

		//Email templates
		$charge.settingsapp().getDuobaseFieldsByTableNameAndFieldName("CTS_EmailTemplates", "TemplateUrl").success(function (data) {
			if(data[0][0].RecordFieldData == null || data[0][0].RecordFieldData == ''){
				$scope.currentTemplateView='emailTemplate1';
			}else{
				$scope.currentTemplateView=data[0][0].RecordFieldData.split('/')[data[0][0].RecordFieldData.split('/').length-1].split('.')[0];
				$http({
					method:'GET',
					url:data[0][0].RecordFieldData
				}).then(function (res) {
					$scope.tempSelectedTemplate = angular.copy(res.data);
				}, function (res) {});
			}
		}).error(function (data) {
			$scope.currentTemplateView='emailTemplate1';
			$http({
				method:'GET',
				url:'https://ccresourcegrpdisks974.blob.core.windows.net/email-templates/emailTemplate1.html'
			}).then(function (res) {
				$scope.tempSelectedTemplate = angular.copy(res.data);
				$scope.currEmailTemplate = res.data;
			}, function (res) {});
		});

		$scope.$watch(function () {
			var elem = document.getElementsByClassName('billingFrqCurrency');
			if(elem.length != 0){
				angular.forEach(elem, function (child) {
					if(child.innerText != ""){
						var innerCurr = child.innerText.split('0')[0];
						child.innerText = innerCurr;
					}
				});
			}
		});

		$scope.$watch(function () {
			vm.itemTotal = 0;
			angular.forEach($scope.rows, function (row) {
				vm.itemTotal += parseFloat(row.rowAmtDisplay);
			})
		});


	}
})();
