// Copyright (c) Microsoft. All rights reserved. See License.txt in the project root for license information.

;(function (root, factory) {
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  var root = (objectTypes[typeof window] && window) || this,
    freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports,
    freeModule = objectTypes[typeof module] && module && !module.nodeType && module,
    moduleExports = freeModule && freeModule.exports === freeExports && freeExports,
    freeGlobal = objectTypes[typeof global] && global;

  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  // Because of build optimizers
  if (typeof define === 'function' && define.amd) {
    define(['rxjs', 'angular', 'exports'], function (Rx, angular, exports) {
      root.Rx = factory(root, exports, Rx, angular);
      return root.Rx;
    });
  } else if (typeof module == 'object' && module && module.exports == freeExports) {
    module.exports = factory(root, module.exports, require('rxjs'), require('angular'));
  } else {
    root.Rx = factory(root, {}, root.Rx, root.angular);
  }
}(this, function (global, exp, Rx, angular, undefined) {

var errorObj = {e: {}};

function tryCatcherGen(tryCatchTarget) {
  return function tryCatcher() {
    try {
      return tryCatchTarget.apply(this, arguments);
    } catch (e) {
      errorObj.e = e;
      return errorObj;
    }
  };
}

function tryCatch(fn) {
  if (!angular.isFunction(fn)) { throw new TypeError('fn must be a function'); }
  return tryCatcherGen(fn);
}

function thrower(e) {
  throw e;
}

  /**
   * @ngdoc overview
   * @name rx
   *
   * @description
   * The `rx` module contains essential components for reactive extension bindings
   * for Angular apps.
   *
   * Installation of this module is just a cli command away:
   *
   * <pre>
   * bower install rx-angular
   * <pre>
   *
   * Simply declare it as dependency of your app like this:
   *
   * <pre>
   * var app = angular.module('myApp', ['rx']);
   * </pre>
   */
  var rxModule = angular.module('rx', []);

  /**
   * @ngdoc service
   * @name rx.rx
   *
   * @requires $window
   *
   * @description
   * Factory service that exposes the global `Rx` object to the Angular world.
   */
  rxModule.factory('rx', ['$window', function($window) {
    $window.Rx || ($window.Rx = Rx);

    Rx.createObservableFunction = function (self, functionName, listener) {
      var subscribeCore = function (o) {
        self[functionName] = function () {
          var len = arguments.length, args = new Array(len);
          for (var i = 0; i < len; i++) { args[i] = arguments[i]; }

          if (angular.isFunction(listener)) {
            var result = tryCatch(listener).apply(this, args);
            if (result === errorObj) { return o.error(result.e); }
            o.next(result);
          } else if (args.length === 1) {
            o.next(args[0]);
          } else {
            o.next(args);
          }
        };

        return function() {
          delete self[functionName];
        };
      };
      return Rx.Observable.create(subscribeCore).publish().refCount();
    };

    return $window.Rx;
  }]);

  function noop () { }

  Rx.Observable.prototype.safeApply = function($scope, next, error, complete){
    next = angular.isFunction(next) ? next : noop;
    error = angular.isFunction(error) ? error : noop;
    complete = angular.isFunction(complete) ? complete : noop;

    return this
      .takeWhile(function () {
        return !$scope.$$destroyed;
      })
      .do(
        function (data){
          ($scope.$$phase || $scope.$root.$$phase) ?
            next(data) :
            $scope.$apply(function () { next(data); });
        },
        function (errorValue){
          ($scope.$$phase || $scope.$root.$$phase) ?
            error(errorValue) :
            $scope.$apply(function () { error(errorValue); });
        },
        function (){
          ($scope.$$phase || $scope.$root.$$phase) ?
            complete() :
            $scope.$apply(function () { complete(); });
        });
  };

rxModule.config(['$provide', function($provide) {
  /**
   * @ngdoc service
   * @name rx.$rootScope
   *
   * @requires $delegate
   *
   * @description
   * `$rootScope` decorator that extends the existing `$rootScope` service
   * with additional methods. These methods are Rx related methods, such as
   * methods to create observables or observable functions.
   */
  $provide.decorator('$rootScope', ['$delegate', 'rx', function($delegate, rx) {

    Object.defineProperties($delegate.constructor.prototype, {
      /**
         * @ngdoc property
         * @name rx.$rootScope.$toObservable
         *
         * @description
         * Provides a method to create observable methods.
         */
        '$toObservable': {
            /**
             * @ngdoc function
             * @name rx.$rootScope.$toObservable#value
             *
             * @description
             * Creates an observable from a watchExpression.
             *
             * @param {(function|string)} watchExpression A watch expression.
             * @param {boolean} objectEquality Compare object for equality.
             *
             * @return {object} Observable.
             */
            value: function(watchExpression, objectEquality) {
              var scope = this;
              return rx.Observable.create(function (observer) {

                scope.$watch(watchExpression, function(newValue, oldValue) {
                  observer.next({ oldValue: oldValue, newValue: newValue });
                }, objectEquality);

                scope.$on('$destroy', function(){
                  observer.complete();
                });

              }).publish().refCount();
            },
            /**
             * @ngdoc property
             * @name rx.$rootScope.$toObservable#enumerable
             *
             * @description
             * Enumerable flag.
             */
            enumerable: false,
            configurable: true,
            writable: true
        },
        /**
         * @ngdoc property
         * @name rx.$rootScope.$toObservableCollection
         *
         * @description
         * Provides a method to create observable methods.
         */
        '$toObservableCollection': {
            /**
             * @ngdoc function
             * @name rx.$rootScope.$toObservableCollection#value
             *
             * @description
             * Creates an observable from a watchExpression.
             *
             * @param {(function|string)} watchExpression A watch expression.
             *
             * @return {object} Observable.
             */
            value: function(watchExpression) {
              var scope = this;
              return rx.Observable.create(function (observer) {

                scope.$watchCollection(watchExpression, function (newValue, oldValue) {
                  observer.next({ oldValue: oldValue, newValue: newValue });
                });

                scope.$on('$destroy', function(){
                  observer.complete();
                });

              }).publish().refCount();
            },
            /**
             * @ngdoc property
             * @name rx.$rootScope.$toObservableCollection#enumerable
             *
             * @description
             * Enumerable flag.
             */
            enumerable: false,
            configurable: true,
            writable: true
        },
        /**
         * @ngdoc property
         * @name rx.$rootScope.$toObservableGroup
         *
         * @description
         * Provides a method to create observable methods.
         */
        '$toObservableGroup': {
            /**
             * @ngdoc function
             * @name rx.$rootScope.$toObservableGroup#value
             *
             * @description
             * Creates an observable from a watchExpressions.
             *
             * @param {(function|string)} watchExpressions A watch expression.
             *
             * @return {object} Observable.
             */
            value: function(watchExpressions) {
              var scope = this;
              return rx.Observable.create(function (observer) {

                scope.$watchGroup(watchExpressions, function (newValue, oldValue) {
                  observer.next({ oldValue: oldValue, newValue: newValue });
                });

                scope.$on('$destroy', function(){
                  observer.complete();
                });

              }).publish().refCount();
            },
            /**
             * @ngdoc property
             * @name rx.$rootScope.$toObservableGroup#enumerable
             *
             * @description
             * Enumerable flag.
             */
            enumerable: false,
            configurable: true,
            writable: true
        },
      /**
       * @ngdoc property
       * @name rx.$rootScope.$eventToObservable
       *
       * @description
       * Provides a method to create observable methods.
       */
      '$eventToObservable': {
        /**
         * @ngdoc function
         * @name rx.$rootScope.$eventToObservable#value
         *
         * @description
         * Creates an Observable from an event which is fired on the local $scope.
         * Expects an event name as the only input parameter.
         *
         * @param {string} event name
         *
         * @return {object} Observable object.
         */
        value: function(eventName, selector) {
          var scope = this;
          return rx.Observable.create(function (observer) {

            scope.$on(eventName, function listener () {
              var len = arguments.length, args = new Array(len);
              for (var i = 0; i < len; i++) { args[i] = arguments[i]; }

              if (angular.isFunction(selector)) {
                var result = tryCatch(selector).apply(null, args);
                if (result === errorObj) { return observer.error(result.e); }
                observer.next(result);
              } else if (args.length === 1) {
                observer.next(args[0]);
              } else {
                observer.next(args);
              }
            });

            scope.$on('$destroy', function(){
              observer.complete();
            });

            return disposable;
          }).publish().refCount();
        },
        /**
         * @ngdoc property
         * @name rx.$rootScope.$eventToObservable#enumerable
         *
         * @description
         * Enumerable flag.
         */
        enumerable: false,
        configurable: true,
        writable: true
      },
      /**
       * @ngdoc property
       * @name rx.$rootScope.$createObservableFunction
       *
       * @description
       * Provides a method to create obsersables from functions.
       */
      '$createObservableFunction': {
        /**
         * @ngdoc function
         * @name rx.$rootScope.$createObservableFunction#value
         *
         * @description
         * Creates an observable from a given function.
         *
         * @param {string} functionName A function name to observe.
         * @param {function} listener A listener function that gets executed.
         *
         * @return {function} Remove listener function.
         */
        value: function(functionName, listener) {
          return rx.createObservableFunction(this, functionName, listener);
        },
        /**
         * @ngdoc property
         * @name rx.$rootScope.$createObservableFunction#enumerable
         *
         * @description
         * Enumerable flag.
         */
        enumerable: false,
        configurable: true,
        writable: true
      },
      // /**
      //  * @ngdoc function
      //  * @name rx.$rootScope.$digestObservables#value
      //  *
      //  * @description
      //  * Digests the specified observables when they produce new values.
      //  * The scope variable / assignable expression specified by the observable's key
      //  *   is set to the new value.
      //  *
      //  * @param {object.<string, Rx.Observable>} obj A map where keys are scope properties
      //  *   (assignable expressions) and values are observables.
      //  *
      //  * @return {Rx.Observable.<{observable: Rx.Observable, expression: string, value: object}>}
      //  *   Observable of change objects.
      //  */
      // '$digestObservables': {
      //   value: function(observables) {
      //     var scope = this;
      //     return rx.Observable.pairs(observables)
      //       .flatMap(function(pair) {
      //         return pair[1].digest(scope, pair[0])
      //           .map(function(val) {
      //             return {
      //               observable: pair[1],
      //               expression: pair[0],
      //               value: val
      //             };
      //           });
      //       }).publish().refCount();
      //   },
      //   /**
      //    * @ngdoc property
      //    * @name rx.$rootScope.digestObservables#enumerable
      //    *
      //    * @description
      //    * Enumerable flag.
      //    */
      //   enumerable: false,
      //   configurable: true,
      //   writable: true
      // }
    });

    return $delegate;
  }]);
}]);


rxModule.filter('async', asyncFilter);

/*
 * https://github.com/cvuorinen/angular1-async-filter
 * Angular2 async pipe implemented as Angular 1 filter to handle Promises & RxJS Observables
 */
function asyncFilter() {
  var values = {};
  var subscriptions = {};

  function async(input, scope) {
      // Make sure we have an Observable or a Promise
      if (!input || !(input.subscribe || input.then)) {
          return input;
      }

      var inputId = objectId(input);
      if (!(inputId in subscriptions)) {
          var subscriptionStrategy =
              input.subscribe && input.subscribe.bind(input)
              || input.success && input.success.bind(input) // To make it work with HttpPromise
              || input.then.bind(input);

          subscriptions[inputId] = subscriptionStrategy(function (value) {
              values[inputId] = value;

              if (scope && scope.$applyAsync) {
                  scope.$applyAsync(); // Automatic safe apply, if scope provided
              }
          });

          if (scope && scope.$on) {
              // Clean up subscription and its last value when the scope is destroyed.
              scope.$on('$destroy', function () {
                  var sub = subscriptions[inputId];
                  if (sub) {
                      sub.unsubscribe && sub.unsubscribe();
                      sub.dispose && sub.dispose();
                  }
                  delete subscriptions[inputId];
                  delete values[inputId];
              });
          }
      }

      return values[inputId];
  };

  // Need a way to tell the input objects apart from each other (so we only subscribe to them once)
  var nextObjectID = 0;
  function objectId(obj) {
      if (!obj.hasOwnProperty('__asyncFilterObjectID__')) {
          obj.__asyncFilterObjectID__ = ++nextObjectID;
      }

      return obj.__asyncFilterObjectID__;
  }

  // So that Angular does not cache the return value
  async.$stateful = true;

  return async;
}

  return Rx;
}));