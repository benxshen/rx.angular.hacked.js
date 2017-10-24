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
    define(['rx', 'angular', 'exports'], function (Rx, angular, exports) {
      root.Rx = factory(root, exports, Rx, angular);
      return root.Rx;
    });
  } else if (typeof module == 'object' && module && module.exports == freeExports) {
    module.exports = factory(root, module.exports, require('rx'), require('angular'));
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

    var CreateObservableFunction = (function(__super__) {
      Rx.internals.inherits(CreateObservableFunction, __super__);
      function CreateObservableFunction(self, name, fn) {
        this._self = self;
        this._name = name;
        this._fn = fn;
        __super__.call(this);
      }

      CreateObservableFunction.prototype.subscribeCore = function (o) {
        var fn = this._fn;
        this._self[this._name] = function () {
          var len = arguments.length, args = new Array(len);
          for (var i = 0; i < len; i++) { args[i] = arguments[i]; }

          if (angular.isFunction(fn)) {
            var result = tryCatch(fn).apply(this, args);
            if (result === errorObj) { return o.onError(result.e); }
            o.onNext(result);
          } else if (args.length === 1) {
            o.onNext(args[0]);
          } else {
            o.onNext(args);
          }
        };

        return new InnerDisposable(this._self, this._name);
      };

      function InnerDisposable(self, name) {
        this._self = self;
        this._name = name;
        this.isDisposed = false;
      }

      InnerDisposable.prototype.dispose = function () {
        if (!this.isDisposed) {
          this.isDisposed = true;
          delete this._self[this._name];
        }
      };

      return CreateObservableFunction;
    }(Rx.ObservableBase));

    Rx.createObservableFunction = function (self, functionName, listener) {
      return new CreateObservableFunction(self, functionName, listener).publish().refCount();
    };

    return $window.Rx;
  }]);

  function noop () { }

  Rx.Observable.prototype.safeApply = function($scope, onNext, onError, onComplete){
    onNext = angular.isFunction(onNext) ? onNext : noop;
    onError = angular.isFunction(onError) ? onError : noop;
    onComplete = angular.isFunction(onComplete) ? onComplete : noop;

    return this
      .takeWhile(function () {
        return !$scope.$$destroyed;
      })
      .tap(
        function (data){
          ($scope.$$phase || $scope.$root.$$phase) ?
            onNext(data) :
            $scope.$apply(function () { onNext(data); });
        },
        function (error){
          ($scope.$$phase || $scope.$root.$$phase) ?
            onError(error) :
            $scope.$apply(function () { onError(error); });
        },
        function (){
          ($scope.$$phase || $scope.$root.$$phase) ?
            onComplete() :
            $scope.$apply(function () { onComplete(); });
        });
  };

  return Rx;
}));