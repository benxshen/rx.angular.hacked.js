# Reactive Extensions Bindings for AngularJS

This library serves as a bridge between the [Reactive Extensions for JavaScript (RxJS5)](https://github.com/ReactiveX/rxjs/tree/5.x) and [AngularJS](http://angularjs.org/).

This fork (from [rx.angular.js](https://github.com/Reactive-Extensions/rx.angular.js)) updates:
1. Upgrade rxjs to 5.5.12
2. Integrate [angular1-async-filter](https://github.com/cvuorinen/angular1-async-filter)

One example is where we can create an Observable sequence from such things ng-click expressions where we can search Wikipedia:

```js
angular.module('example', ['rx'])
  .controller('AppCtrl', function($scope, $http, rx) {

    function searchWikipedia (term) {
      return rx.Observable
        .fromPromise($http({
          url: "http://en.wikipedia.org/w/api.php?&callback=JSON_CALLBACK",
          method: "jsonp",
          params: {
            action: "opensearch",
            search: term,
            format: "json"
          }
        }))
        .map(function(response){ return response.data[1]; });
    }

    $scope.search = '';
    $scope.results = [];

    /*
      Creates a "click" function which is an observable sequence instead of just a function.
    */
    $scope.$createObservableFunction('click')
      .map(function () { return $scope.search; })
      .switchMap(searchWikipedia)
      .subscribe(function(results) {
        $scope.results = results;
      });
  });
```

And the HTML markup you can simply just use a ng-click directive much as you have before, but now it is an Observable sequence.
```html
<div class="container" ng-app="example" ng-controller="AppCtrl">

  <input type="text" ng-model="search">
  <button ng-click="click()">Search</button>

  <ul>
    <li ng-repeat="result in results">{{result}}</li>
  </ul>

</div>
```

[Many great examples](https://github.com/benxshen/rx.angular.hacked.js/tree/master/examples)

## Dive In! ##

Please check out:
 - [Rxjs5 source branch tree](https://github.com/ReactiveX/rxjs/tree/5.x)
 - [Migrating from RxJS 4 to 5](https://github.com/staltz/RxJSNext/blob/master/MIGRATION.md)
 - [Awesome-RxJS (rxjs5)](https://github.com/RxJS-CN/awesome-rxjs)
 - [30 天精通 RxJS](https://ithelp.ithome.com.tw/users/20103367/ironman/1199)
 - [Our complete Unit Tests](https://github.com/benxshen/rx.angular.hacked.js/tree/master/tests)

## License ##

Copyright (c) Microsoft.  All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you
may not use this file except in compliance with the License. You may
obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing permissions
and limitations under the License.
