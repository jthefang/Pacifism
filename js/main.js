var WINDOW_HEIGHT = $(window).innerHeight();
var WINDOW_WIDTH = $(window).innerWidth();
let canvas, drawingSurface, theGame;

var game = {
	init: function(canvas, drawingSurface) {
		this.canvas = canvas;
		this.drawingSurface = drawingSurface;

		this.endable = true; //will determine whether game ends when player collides with drones (=false if in god mode)
		this.ended = false;
		this.gameScore = 0;
		this.gameSpeed = 1; //should ramp up logarithmically with the score (controls spawning rates)

		this.controlMethod = {
			MOUSE: 0,
			KBD: 1
		}
		this.currentControlMethod = this.controlMethod.MOUSE;
		this.mouseX;
		this.mouseY;

		this.GAME_STATE = {
			LOADING: 0,
			STARTING: 1,
			PLAYING: 2,
			PAUSED: 3,
			ENDED: 4
		};
		this.currentGameState = this.GAME_STATE.LOADING;
		this.animationLoop;
		this.loadResources();

		// This binding is necessary to make `this` work in the callback
		this.updateAnimation = this.updateAnimation.bind(this);

		// ********** Sprites
		this.player = Object.create(player);
		this.player.init(this);
		this.drones = Object.create(drones);
		this.drones.init(this);
		this.gates = Object.create(gates);
		this.gates.init(this);
		this.explosions = Object.create(explosions);
		this.explosions.init(this);
	},

	loadResources: function() {
		this.assetsToLoad = [];
		this.assetsLoaded = 0;

		// ********************************** IMAGES
		this.IMG_SRC = "../images/";

		this.gateImage = new Image();
		this.gateImageSrc = "gate.png";
		this.gateImage.addEventListener("load", loadHandler, false);
		this.gateImage.src = this.IMG_SRC + this.gateImageSrc;
		this.assetsToLoad.push(this.gateImage);

		this.burstImage = new Image();
		this.explosionImageSrc = "burst.png";
		this.burstImage.addEventListener("load", loadHandler, false);
		this.burstImage.src = this.IMG_SRC + this.explosionImageSrc;
		this.assetsToLoad.push(this.burstImage);

		// ********************************** SOUNDS
		this.themeMP3 = document.querySelector("#theme"); //get reference to the sound
		this.themeMP3.load(); //load into JS
		this.themeMP3.addEventListener("canplaythrough", loadHandler, false); //means that the sound has been completely loaded
		this.assetsToLoad.push(this.themeMP3);

		this.game_startMP3 = document.querySelector("#game_start"); //get reference to the sound
		this.game_startMP3.load(); //load into JS
		this.game_startMP3.addEventListener("canplaythrough", loadHandler, false); //means that the sound has been completely loaded
		this.assetsToLoad.push(this.game_startMP3);

		this.game_overMP3 = document.querySelector("#game_over"); //get reference to the sound
		this.game_overMP3.load(); //load into JS
		this.game_overMP3.addEventListener("canplaythrough", loadHandler, false); //means that the sound has been completely loaded
		this.assetsToLoad.push(this.game_overMP3);

		this.drone_spawnMP3 = document.querySelector("#drone_spawn"); //get reference to the sound
		this.drone_spawnMP3.load(); //load into JS
		this.drone_spawnMP3.addEventListener("canplaythrough", loadHandler, false); //means that the sound has been completely loaded
		this.assetsToLoad.push(this.drone_spawnMP3);

		this.gate_explodeMP3 = document.querySelector("#gate_explode"); //get reference to the sound
		this.gate_explodeMP3.load(); //load into JS
		this.gate_explodeMP3.addEventListener("canplaythrough", loadHandler, false); //means that the sound has been completely loaded
		this.assetsToLoad.push(this.gate_explodeMP3);
	},

	startGame: function() {
		//initalize sprites
		this.player.spawn();
		this.drones.spawnDrones();
		this.gates.spawnGate();

		this.game_startMP3.volume = 1;
		this.game_startMP3.play();
		//Loop play the themeMP3
		this.themeMP3.addEventListener('ended', function() {
		    this.currentTime = 0;
		    this.play();
		}, false);
		this.themeMP3.volume = 1; //start volume at max
		this.themeMP3.play();

		this.currentGameState = this.GAME_STATE.PLAYING;
	},

	playGame: function() {
		//update players position
	  	this.player.updatePosition();
	  	this.drones.update();
	  	this.explosions.update();
	  	this.gates.update();
		this.updateGameLevel();
	},

	togglePause: function() {
		if (this.currentGameState == this.GAME_STATE.PLAYING) {
			this.currentGameState = this.GAME_STATE.PAUSED;
			this.themeMP3.pause();
		} else if (this.currentGameState == this.GAME_STATE.PAUSED) {
			this.currentGameState = this.GAME_STATE.PLAYING;
			this.themeMP3.play();
		}
	},

	endGame: function() {
		this.ended = true;

		//display some Game Over message and let the user restart the game
		this.themeMP3.pause();
		this.game_overMP3.currentTime = 0;
		this.game_overMP3.volume = 1.0;
		this.game_overMP3.play();

		$("div#game_over_div").show();
	},

	restartGame: function() {
		this.drones.reset();
		this.gates.reset();
		this.explosions.reset();

		this.ended = false;
		this.gameScore = 0;
		this.gameSpeed = 1;

		this.game_overMP3.pause(); //if it's playing

		$("div#game_over_div").hide();
		this.startGame();	
	},

	applyMenuSettings: function() {
		var inputMethod = $('input[name="inputMethod"]:checked').val();
		if (inputMethod === "mouse") {
			this.currentControlMethod = this.controlMethod.MOUSE;
			this.canvas.addEventListener("mousemove", mousemoveHandler, false);
		} else if (inputMethod === "kbd") {
			this.currentControlMethod = this.controlMethod.KBD;
			this.canvas.removeEventListener("mousemove", mousemoveHandler, false);
		}

		this.endable = !$("input#endable").is(":checked");
	},

	updateGameLevel: function() {
		let magnitudeOfScoreRampUp = 1000; //will get to 190% speed when score = 10x this amount
		this.gameSpeed = 1 + (this.gameScore / (this.gameScore + magnitudeOfScoreRampUp));
		//ramp up gameSpeed
		if (this.gameScore > 10000) {
			this.drones.droneSpawnAmount = 60;
		} else if (this.gameScore > 5000) {
			this.gates.maxGateSpawnAmount = 3;
		} else if (this.gameScore > 3000) {
			this.drones.droneSpawnAmount = 40;
		} else if (this.gameScore > 1000) {
			this.gates.maxGateSpawnAmount = 2;
			this.drones.droneSpawnAmount = 30;
		} 
	},

	/**********************		DOC READY, ANIMATION & RENDERING 	************/
	updateAnimation: function() { 
	  	// Call updateAnimation at a smooth rate (depends on computer display's refresh rate)
	  	// you could optionally use a timer
	  	this.animationLoop = window.requestAnimationFrame(this.updateAnimation, this.canvas); 
	  	
	  	switch (this.currentGameState) {
	  		case this.GAME_STATE.LOADING:

	  			return;
	  		case this.GAME_STATE.STARTING:
				this.startGame();
	  			break;
	  		case this.GAME_STATE.PLAYING:
	  			this.playGame();
	  			break;
	  		case this.GAME_STATE.PAUSED:
	  			//do nothing
	  			break;
	  		case this.GAME_STATE.ENDED:
	  			if (!this.endable) {
	  				this.playGame();
	  			} else if (!this.ended) { //only call endGame once
			  		this.endGame();
	  			}
	  			break;
	  	}
	  	
	  	//Render the animation
	  	this.render();
	},

	render: function() {
		//Clear the current canvas
		this.drawingSurface.clearRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
		
		//fill black background
		this.drawingSurface.rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
		this.drawingSurface.fillStyle = "black";
		this.drawingSurface.fill();

		this.player.draw(this.drawingSurface);
		this.drones.draw();
		this.explosions.draw();
		this.gates.draw();

		//show score
		$("p#score").text(this.gameScore.toString());
	}
}

/******************************		EVENT HANDLERS 		*******************/
// ********* keyboard stuff
let kbd = {
	r: 82,
	p: 80,
	esc: 27,
	left: 37,
	up: 38,
	right: 39,
	down: 40
}

$(document).keydown(function(e) {
	var key = e.which;

    switch(key) { 
		case kbd.left:
			theGame.player.moveLeft = true;
			break;
		case kbd.up:
			theGame.player.moveUp = true;
			break;
		case kbd.right:
			theGame.player.moveRight = true;
			break;
		case kbd.down:
			theGame.player.moveDown = true;
			break;
    	case kbd.r:
    		if (!$("div#menu").is(':visible')) { //only if menu is not open
    			theGame.restartGame(); //window.location.reload(true);
    		}
    		break;
    	case kbd.esc:
    		theGame.togglePause();

    		$("div#menu").toggle();
    		
    		if (theGame.currentGameState == theGame.GAME_STATE.PLAYING) {
    			//apply new settings
    			theGame.applyMenuSettings();
    		}
    		break;
  	}
});

$(document).keyup(function(e) {
	var key = e.which;

    switch(key) { 
		case kbd.left:
			theGame.player.moveLeft = false;
			break;
		case kbd.up:
			theGame.player.moveUp = false;
			break;
		case kbd.right:
			theGame.player.moveRight = false;
			break;
		case kbd.down:
			theGame.player.moveDown = false;
			break;
  	}
});

// ********* Have the player follow the mouse movement
function mousemoveHandler(event) {
	theGame.mouseX = event.pageX - theGame.canvas.offsetLeft;
	theGame.mouseY = event.pageY - theGame.canvas.offsetTop;
	
	if ((Math.abs(theGame.mouseX - theGame.player.xPos) >= theGame.player.radius) || 
		Math.abs(theGame.mouseY - theGame.player.yPos) >= theGame.player.radius) {
		//only move the player if mouse is not over the player (this prevents jittery movement)
		theGame.player.moveToPos(theGame.mouseX, theGame.mouseY);	
	}
}

function loadHandler(event) { 
	theGame.assetsLoaded++;
	if(theGame.assetsLoaded == theGame.assetsToLoad.length) {
		//Remove the load event listeners
		theGame.gateImage.removeEventListener("load", loadHandler, false);
		theGame.burstImage.removeEventListener("load", loadHandler, false);

		theGame.themeMP3.removeEventListener("canplaythrough", loadHandler, false);
		theGame.game_startMP3.removeEventListener("canplaythrough", loadHandler, false);
		theGame.game_overMP3.removeEventListener("canplaythrough", loadHandler, false);
		theGame.drone_spawnMP3.removeEventListener("canplaythrough", loadHandler, false);
		theGame.gate_explodeMP3.removeEventListener("canplaythrough", loadHandler, false);

		//Start the game
		setTimeout(function() { theGame.currentGameState = theGame.GAME_STATE.STARTING; }, 1500);
	}
}

$(document).ready(function() {
	/******************************		CANVAS SETUP 	***********************/
	canvas = document.querySelector("canvas");
	canvas.width = WINDOW_WIDTH;
	canvas.height = WINDOW_HEIGHT;
	drawingSurface = canvas.getContext("2d");

	//center the menu
	var menuHeight = $("div#menu").outerHeight(); 
	var menuWidth = $("div#menu").outerWidth();
	$("div#menu").css("left", (canvas.width / 2) - (menuWidth / 2))
		.css("top", (canvas.height / 2) - (menuHeight / 2));

	var divHeight = $("div#game_over_div").outerHeight(); 
	var divWidth = $("div#game_over_div").outerWidth();
	$("div#game_over_div").css("left", (canvas.width / 2) - (divWidth / 2))
		.css("top", (canvas.height / 2) - (divHeight / 2));

  	theGame = Object.create(game);
  	theGame.init(canvas, drawingSurface);

  	window.addEventListener("mousemove", mousemoveHandler, false);

  	//Start the animation loop
  	theGame.updateAnimation();
});  