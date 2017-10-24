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

  return Rx;
}));