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
