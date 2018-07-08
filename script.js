(function(navigator, document){
	'use strict';

    const tictac = document.getElementById('tictac');
    const explosion = document.getElementById('explosion');

	const colors = ['azul', 'rojo', 'amarillo', 'verde'];
	const opciones = ['a', 'b', 'c', 'd', 'e'];


	/* snippet code
	*	@source: https://stackoverflow.com/a/901144
	*	@credits:: jolly.exe
	*/
	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		    results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}


	function buttonPressed(b){
		return typeof(b) == 'object' ? b.pressed : (b == 1.0);
	}

	function filtrar(test){
		return function(pregunta){
			if (typeof test === 'string'){
				return pregunta.test.trim() === test;
			}

			return typeof pregunta['Respuesta correcta'] === 'string' && opciones.indexOf(pregunta['Respuesta correcta']) >= 0;
		}
	}

    function shuffle (array) {
        let i = 0, j = 0, temp = null;

        for (i = array.length - 1; i > 0; i -= 1) {
          j = Math.floor(Math.random() * (i + 1))
          temp = array[i]
          array[i] = array[j]
          array[j] = temp
        }
      }

	function transform(pregunta){
		var obj = {
			pregunta: pregunta['Título de la pregunta'],
			respuestas: {},
			correcta: colors[opciones.indexOf(pregunta['Respuesta correcta'])],
			feedback: pregunta.Feedback.trim()
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
            var Url = false;
            if (getParameterByName('user') === 'rozas'){
                Url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSswSfg4ckiriUQnJ3OUYT0fkaYsk_LNR-2dMzsXJsGgLRmi5reCadYMGsjTV_SRxyHgzZs_fBXLRW-/pub?gid=1471519642&single=true&output=csv&time=' + (new Date()).getTime();
            } else {
                Url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSswSfg4ckiriUQnJ3OUYT0fkaYsk_LNR-2dMzsXJsGgLRmi5reCadYMGsjTV_SRxyHgzZs_fBXLRW-/pub?gid=1006994199&single=true&output=csv&time=' + (new Date()).getTime();
            }

            return $http.get(Url).then(function(response){
				const rows = d3.csvParse(response.data);
                shuffle(rows);

				return rows.filter(filtrar(getParameterByName('test'))).map(transform);
			}, function(err){
				console.error(err);
			});

		}])
		.controller('Ctrl', ['$scope', '$timeout', 'Gamepads', 'Preguntas', '$window', '$location', '$requestAnimationFrame', function($scope, $timeout, Gamepads, Preguntas, $window, $location, $requestAnimationFrame){
			$scope.countdown = '';
			$scope.runningQuestion = -1;
			$scope.gamepads = new Gamepads;
			$scope.respuestaseleccionada = [];
			console.log('test', getParameterByName('test'));

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
                tictac.play();
				$scope.stop();
				$scope.runningQuestion++;

				if ($scope.runningQuestion < $scope.preguntas.length){
					var q = $scope.preguntas[$scope.runningQuestion];
					$scope.pregunta = q.pregunta;
					$scope.respuestas = q.respuestas;
					$scope.correcta = q.correcta;
					$scope.feedback = q.feedback;

					for (var i = 0, j = $scope.gamepads.gamepads.length; i < j; i++){
						if ($scope.gamepads.gamepads[i]){
							$scope.respuestaseleccionada[i] = false;
						}
					}

					$scope.countdown = 30;
					$scope.status = 'running';
					countdown();
				} else {
					$window.alert('No quedan más preguntas');
				}
			};

			$scope.stop = function(){
                $scope.countdown = '';
                if ($scope.status === 'running'){
                    explosion.play();
                }
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