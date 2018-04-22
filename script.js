(function(navigator, document){
	'use strict';

	const tictac = document.getElementById('tictac');
	tictac.play();

	const colors = ['azul', 'rojo', 'amarillo', 'verde'];
	const opciones = ['a', 'b', 'c', 'd', 'e'];

	function buttonPressed(b){
		return typeof(b) == 'object' ? b.pressed : (b == 1.0);
	}

	function filtrar(pregunta){
		return typeof pregunta['Respuesta correcta'] === 'string' && opciones.indexOf(pregunta['Respuesta correcta']) >= 0;
	}

	function transform(pregunta){
		var obj = {
			pregunta: pregunta['Título de la pregunta'],
			respuestas: {},
			correcta: colors[opciones.indexOf(pregunta['Respuesta correcta'])]
		};

		colors.forEach(function(color, i){
			obj.respuestas[color] = typeof pregunta['Respuesta ' + opciones[i]] === 'string' ? pregunta['Respuesta ' + opciones[i]] : '';
		});

		return obj;
	}

	angular.module('concurso', [])
		//.config('$sce')
		.factory('Gamepads', function(){
			var t;
			return t = function() {
				function t() {}
				t.prototype.poll = function() {
					return this.gamepads = ("function" == typeof navigator.getGamepads ? navigator.getGamepads() : void 0) || ("function" == typeof navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : void 0) || []
				};
				return t;
			}();
		})
		.factory("$requestAnimationFrame",
			["$rootScope", function($rootScope){
				return function(n){
					return requestAnimationFrame(function(){
						return $rootScope.$apply(n);
					});
				}
			}]
		)
		.factory('PreguntasTest', ['$http', function($http){
			return $http.get('preguntas.json');
		}])
		.factory('Preguntas', ['$http', function($http){
			var Url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSswSfg4ckiriUQnJ3OUYT0fkaYsk_LNR-2dMzsXJsGgLRmi5reCadYMGsjTV_SRxyHgzZs_fBXLRW-/pub?gid=1006994199&single=true&output=csv&time=' + (new Date()).getTime();
			var Items = $http.get(Url).then(function(response){
				console.debug(response.data);

				return d3.csvParse(response.data).filter(filtrar).map(transform);
			}, function(err){
				console.error(err);
			});

			return Items;
		}])
		.controller('Ctrl', ['$scope', '$timeout', 'Gamepads', 'Preguntas', '$window', '$requestAnimationFrame', function($scope, $timeout, Gamepads, Preguntas, $window, $requestAnimationFrame){
			$scope.countdown = '';
			$scope.runningQuestion = -1;
			$scope.gamepads = new Gamepads;
			$scope.respuestaseleccionada = [];

			function countdown(){
				$scope.countdown--;
				if ($scope.countdown > 0 && $scope.status === 'running'){

					if (tictac.ended){
						tictac.play();
					}
					$timeout(countdown, 1000);
				} else {
					$scope.stop();
				}
			}

//debugger;https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

			$scope.fullscreen = function(){
				if (document.webkitFullscreenElement) { 
					document.webkitExitFullscreen();
				} else { 
					document.body.webkitRequestFullScreen();
				} 
			};

			$scope.newQuestion = function(){
				$scope.stop();
				$scope.runningQuestion++;

				if ($scope.runningQuestion < $scope.preguntas.length){
					var q = $scope.preguntas[$scope.runningQuestion];
					$scope.pregunta = q.pregunta;
					$scope.respuestas = q.respuestas;
					$scope.correcta = q.correcta;

					for (var i = 0, j = $scope.gamepads.gamepads.length; i < j; i++){
						if ($scope.gamepads.gamepads[i]){
							$scope.respuestaseleccionada[i] = false;
						}
					}

					$scope.countdown = 60;
					$scope.status = 'running';
					countdown();
				} else {
					$window.alert('No quedan más preguntas');
				}
			};

			$scope.stop = function(){
				$scope.countdown = '';
				$scope.status = 'end';
			}

			$scope.pressed = function(player, button){
				console.log(colors[button], $scope.respuestaseleccionada[player]);
				if ($scope.respuestaseleccionada[player] === false && typeof colors[button] !== 'undefined'){
					$scope.respuestaseleccionada[player] = colors[button];
					if ($scope.respuestaseleccionada.every(a => a)){
						$scope.stop();
					}
				}
			};

			Preguntas.then(function(answers){
				$scope.preguntas = answers;
				console.debug(answers);
			});

			function updateLoop(){
				$scope.gamepads.poll();
				for (var i = 0, j = $scope.gamepads.gamepads.length; i < j; i++){
					if ($scope.gamepads.gamepads[i]){
						var gamepad = $scope.gamepads.gamepads[i];
						gamepad.buttons.forEach(function(button, j){
							if (buttonPressed(button)){
								$scope.pressed(i, j);
							}
						});
					}
				}
				$requestAnimationFrame(updateLoop);	
			}

			updateLoop();
		}])
})(navigator, document);