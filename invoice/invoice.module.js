//////////////////////////////////////
// App : Invoice
// Owner  : Ishara Gunathilaka
// Last changed date : 2018/02/12
// Version : 6.1.0.21
// Modified By : Kasun
/////////////////////////////////
(function ()
{
	'use strict';

	angular
		.module('app.invoice', ['valid-number','searchHandler'])
		.config(config)
		.filter('parseDate',parseDateFilter)
		.filter('numberFixedLen',numberFixedLength);

	/** @ngInject */
	function config($stateProvider, msNavigationServiceProvider, mesentitlementProvider)
	{
		$stateProvider
			.state('app.invoice', {
				url    : '/invoice',
				views  : {
					'invoice@app': {
						templateUrl: 'app/main/invoice/invoice.html',
						controller : 'InvoiceController as vm'
					}
				},
				resolve: {
					security: ['$q','mesentitlement','$timeout','$rootScope','$state','$location', function($q,mesentitlement,$timeout,$rootScope,$state, $location){
						return $q(function(resolve, reject) {
							$timeout(function() {
								if ($rootScope.isBaseSet2) {
									resolve(function () {
										var entitledStatesReturn = mesentitlement.stateDepResolver('invoice');

										mesentitlementProvider.setStateCheck("invoice");

										if(entitledStatesReturn !== true){
											return $q.reject("unauthorized");
										}

									});
								} else {
									return $location.path('/guide');
								}
							});
						});

						// else
						// {
						//   //debugger;
						//   $timeout(function() {
						//     var firstLogin=localStorage.getItem("firstLogin");
						//     if(firstLogin==null ||firstLogin=="" || firstLogin==undefined) {
						//       console.log('Invoice First Login null');
						//       $rootScope.firstLoginDitected = true;
						//       //localStorage.removeItem('firstLogin');
						//       $state.go('app.settings', {}, {location: 'settings'});
						//       //return $q.reject("settings");
						//     }
						//     else
						//     {
						//       $rootScope.firstLoginDitected = false;
						//     }
						//   }, 50);
						// }
					}]
				},
				bodyClass: 'invoice'
			});

		msNavigationServiceProvider.saveItem('invoice', {
			title    : 'invoice',
			state    : 'app.invoice',
			weight   : 3
		});
	}

	function parseDateFilter(){
		return function(input){
			return new Date(input);
		};
	}

	function numberFixedLength(){
		return function (n, len) {
			var num = parseInt(n, 10);
			len = parseInt(len, 10);
			if (isNaN(num) || isNaN(len)) {
				return n;
			}
			num = ''+num;
			while (num.length < len) {
				num = '0'+num;
			}
			return num;
		};
	}

	//function validateNumber()
	//{
	//  return {
	//    require: '?ngModel',
	//    scope:{
	//      decimalPoint:'='
	//    },
	//    link: function(scope, element, attrs, ngModelCtrl) {
	//      if(!ngModelCtrl) {
	//        return;
	//      }
	//
	//      ngModelCtrl.$parsers.push(function(val) {
	//        if (angular.isUndefined(val)) {
	//          var val = '';
	//        }
	//        //debugger;
	//        var clean = val.replace(/[^-0-9\.]/g, '');
	//        var negativeCheck = clean.split('-');
	//        var decimalCheck = clean.split('.');
	//        if(!angular.isUndefined(negativeCheck[1])) {
	//          negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
	//          clean =negativeCheck[0] + '-' + negativeCheck[1];
	//          if(negativeCheck[0].length > 0) {
	//            clean =negativeCheck[0];
	//          }
	//
	//        }
	//
	//        if(!angular.isUndefined(decimalCheck[1])) {
	//          decimalCheck[1] = decimalCheck[1].slice(0,decimalPoint);
	//          clean =decimalCheck[0] + '.' + decimalCheck[1];
	//        }
	//
	//        if (val !== clean) {
	//          ngModelCtrl.$setViewValue(clean);
	//          ngModelCtrl.$render();
	//        }
	//        return clean;
	//      });
	//
	//      element.bind('keypress', function(event) {
	//        if(event.keyCode === 32) {
	//          event.preventDefault();
	//        }
	//      });
	//    }
	//  };
	//}

})();
