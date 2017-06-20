/***********************************************	DRONE 		*******************/
var INITIAL_DRONE_SPAWN_AMOUNT = 20;
var droneSpawnAmount = INITIAL_DRONE_SPAWN_AMOUNT;
var droneNextSpawnTime; //time till next spawn (random b/t 3-5 seconds)
var drone = {
	radius: 9,
	dead: false, //to prevent a weird afterdeath collision bug
	color: "Cyan",

	xPos: 0,
	yPos: 0,
	
	movementSpeed: 6,
	xVel: 0,
	yVel: 0,
	pts: 15, //how many pts the player gets for killing this drone

	moveToPos: function(newX, newY) { //decomposes velocity into appropriate x and y based off drones sum total movement speed and sets target x and y
		var dx = newX - this.xPos;
		var dy = newY - this.yPos;
		var angle = Math.atan2(dy, dx)

		this.xVel = this.movementSpeed * Math.cos(angle);
		this.yVel = this.movementSpeed * Math.sin(angle);
	},

	updatePosition: function() {
		this.moveToPos(player.xPos, player.yPos); //target player

		//Move the player and keep it inside screen boundaries
		this.xPos = Math.max(0 + this.radius, Math.min(this.xPos + this.xVel, canvas.width - this.radius));
		this.yPos = Math.max(0 + this.radius, Math.min(this.yPos + this.yVel, canvas.height - this.radius));
	},

	draw: function() {
		//draw drone as circle
		drawingSurface.beginPath();
		drawingSurface.arc(Math.floor(this.xPos), Math.floor(this.yPos), this.radius, 0, 2 * Math.PI, false);
		drawingSurface.fillStyle = this.color;
      	drawingSurface.fill();	
	},

	spawn: function(corner) { 
		var minX = 0;
		var maxX = 0;
		var minY = 0;
		var maxY = 0;
		//spawn in one of the four corners [0, 1, 2, 3]
		switch(corner) {
			case 0: //top left
				minX = 0;
				maxX = canvas.width / 4;
				minY = 0;
				maxY = canvas.height / 4;
				break;
			case 1: //top right
				minX = canvas.width * (3 / 4);
				maxX = canvas.width;
				minY = 0;
				maxY = canvas.height / 4;
				break;
			case 2: //bottom right
				minX = canvas.width * (3 / 4);
				maxX = canvas.width;
				minY = canvas.height * (3 / 4);
				maxY = canvas.height;
				break;
			case 3: //bottom left
				minX = 0;
				maxX = canvas.width / 4;
				minY = canvas.height * (3 / 4);
				maxY = canvas.height;
				break;
		}

		//offset by radius so that entire drone appears within boundaries (not half the radius outside)
		maxX -= this.radius;
		maxY -= this.radius;
		minX += this.radius;
		minY += this.radius;

		var randX = Math.floor(Math.random() * (maxX - minX) + minX); //randomX in range [drone.radius, maxX]
		var randY = Math.floor(Math.random() * (maxY - minY) + minY); 

		this.xPos = randX;
		this.yPos = randY;
		drones.push(this); //this is an array in the game.html
	},

	die: function() {
		this.dead = true;
		removeObjectFromArray(this, drones);

		var newExplosion = Object.create(explosion);
		newExplosion.xPos = this.xPos - this.radius;
		newExplosion.yPos = this.yPos - this.radius;
		//newExplosion.displaySize = this.radius;
		explosions.push(newExplosion);

		gameScore += this.pts;
	}
};
function spawnDrones() {
	drone_spawnMP3.volume = 0.3;
	drone_spawnMP3.play();

	var droneSpawnLoc = Math.floor(Math.random() * 4);
	while (droneSpawnLoc == player.inCorner()) { //don't spawn drones in the same corner as the player
		droneSpawnLoc = Math.floor(Math.random() * 4);
	}

	for (var i = 0; i < droneSpawnAmount; i++) {
		var newDrone = Object.create(drone);
		newDrone.spawn(droneSpawnLoc);	
	}

	//adjusted to gameSpeed
	var maxFreq = 5000 / gameSpeed;
	var minFreq = 3000 / gameSpeed;
	droneNextSpawnTime = Math.floor(Math.random() * (maxFreq - minFreq) + minFreq);
}

/***********************************************	EXPLOSION 		***************/
var explosion = {
	imgSrc: "burst.png",
	imgSize: 92,
	displaySize: 20, //pixels
	COLUMNS: 3, //change this to = the number of frames you have per row on your tile sheet
	numberOfFrames: 17, //18 - 1
	currentFrame: 0,
	sourceX: 0,
	sourceY: 0,

	xPos: 0,
	yPos: 0,

	updateAnimation: function() {
		//Find the frame's correct column and row on the tilesheet
		this.sourceX = Math.floor(this.currentFrame % this.COLUMNS) * this.imgSize;
		this.sourceY = Math.floor(this.currentFrame / this.COLUMNS) * this.imgSize;

		if (this.currentFrame < this.numberOfFrames) {
			this.currentFrame++;
		} else {
			removeObjectFromArray(this, explosions);
		}
	},

	draw: function() {
		//Draw the monster's current animation frame
		drawingSurface.drawImage (
			burstImage,
			this.sourceX, this.sourceY, this.imgSize, this.imgSize,
			this.xPos, this.yPos, this.displaySize, this.displaySize
		);
	}
}

/***********************************************	PLAYER 		*******************/
var player = {
	radius: 12,
	color: "white",
	xPos: 0,
	yPos: 0,
	
	movementSpeed: 8,
	moveLeft: false,
	moveTop: false,
	moveRight: false,
	moveDown: false,
	xVel: 0,
	yVel: 0,

	moveToPos: function(newX, newY) { //decomposes velocity into appropriate x and y based off drones sum total movement speed and sets target x and y
		var dx = newX - this.xPos;
		var dy = newY - this.yPos;
		var angle = Math.atan2(dy, dx)

		this.xVel = this.movementSpeed * Math.cos(angle);
		this.yVel = this.movementSpeed * Math.sin(angle);
	},

	updatePosition: function() {
		if (currentControlMethod == controlMethod.KBD) {
			//Up
			if (this.moveUp && !this.moveDown) {
				this.yVel = -this.movementSpeed;
			}
			//Down
			if (this.moveDown && !this.moveUp) {
				this.yVel = this.movementSpeed;
			}
			//Left
			if (this.moveLeft && !this.moveRight) {
				this.xVel = -this.movementSpeed;
			}
			//Right
			if (this.moveRight && !this.moveLeft) {
				this.xVel = this.movementSpeed;
			}

			//Set the player's velocity to zero if none of the keys are being pressed
			if (!this.moveUp && !this.moveDown) { //only set velocity to zero if mouse is not moving (otherwise we want the player to track the mouse)
				this.yVel = 0;
			}
			if (!this.moveLeft && !this.moveRight) {
				this.xVel = 0;
			}	
		} else if (currentControlMethod == controlMethod.MOUSE) { 
			//stop the player if he's within a certain distance of the mouse
			var errorFactor = 0.32;
			if (Math.abs(this.xPos - mouseX) < this.radius * errorFactor) { 
				this.xVel = 0;
			} 
			if (Math.abs(this.yPos - mouseY) < this.radius * errorFactor) {
				this.yVel = 0;
			}
		}

		//Move the player and keep it inside screen boundaries
		this.xPos = Math.max(0 + this.radius, Math.min(this.xPos + this.xVel, canvas.width - this.radius));
		this.yPos = Math.max(0 + this.radius, Math.min(this.yPos + this.yVel, canvas.height - this.radius));
	},

	draw: function() {
		//draw player as circle
		drawingSurface.beginPath();
		drawingSurface.arc(Math.floor(player.xPos), Math.floor(player.yPos), player.radius, 0, 2 * Math.PI, false);
		drawingSurface.fillStyle = player.color;
      	drawingSurface.fill();
	},

	spawn: function() {
		player.xPos = canvas.width / 2;
		player.yPos = canvas.height / 2;
	},

	/**
		Is the player in a corner, if so we shouldn't spawn drones there
	*/
	inCorner: function() {
		var marginOfError = 1.7;
		if (player.xPos < (canvas.width / 4) * marginOfError) {
			if (player.yPos < (canvas.height / 4) * marginOfError) {
				return 0; //top left
			} else if (player.yPos > (canvas.height * (3 / 4)) * (1 / marginOfError)) {
				return 3; //bottom left
			}
		} else if (player.xPos > (canvas.width * (3 / 4)) * (1 / marginOfError)) {
			if (player.yPos < (canvas.height / 4) * marginOfError) {
				return 1; //top right
			} else if (player.yPos > (canvas.height * (3 / 4)) * (1 / marginOfError)) {
				return 2; //bottom right
			}
		}
		return -1;
	}	
};

/***********************************************	GATE 		*******************/
var INITIAL_GATE_SPAWN_AMOUNT = 1;
var gateSpawnAmount = INITIAL_GATE_SPAWN_AMOUNT;
var gateSpawnTimer;
var gateNextSpawnTime;
var gate = {
	imgSrc: "gate.png",

	sourceX: 0,
	sourceY: 0,
	sourceWidth: 1000,
	sourceHeight: 150,

	width: 100,
	height: 15,
	xPos: 0,
	yPos: 0,
	blastRadius: 200,
	
	rotation: 0,
	rotationSpeed: 0.6, //degrees per frame

	movementSpeed: 6,
	xVel: 0,
	yVel: 0,

	updatePosition: function() {
		this.rotation += this.rotationSpeed;

		if (this.checkBorderBallCollision() && endable) {
			currentGameState = GAME_STATE.ENDED;
		} else if (this.checkCollisionWith(player)) {
      		this.explode();
      	}
	},

	/*endPts: function() { //draws the endpts of the gate (uncomment in draw() function below)
		var angle = this.rotation * Math.PI / 180;
		var halfLength = (this.width / 2) - 8; //the offset is to center the endPt on the gate ball
		
		endX = this.xPos + (halfLength)*(Math.cos(angle));
		endY = this.yPos + (halfLength)*(Math.sin(angle));
		endX1 = this.xPos - (halfLength)*(Math.cos(angle));
		endY1 = this.yPos - (halfLength)*(Math.sin(angle));
		
		var endRadius = 8;
		drawingSurface.beginPath();
		drawingSurface.arc(Math.floor(endX), Math.floor(endY), endRadius, 0, 2 * Math.PI, false);
		drawingSurface.fillStyle = "red";
      	drawingSurface.fill();

		drawingSurface.beginPath();
		drawingSurface.arc(Math.floor(endX1), Math.floor(endY1), endRadius, 0, 2 * Math.PI, false);
		drawingSurface.fillStyle = "green";
      	drawingSurface.fill();
	},*/

	draw: function() {
		//Save the current state of the drawing surface before it's rotated
		drawingSurface.save();
		//Rotate the canvas
		drawingSurface.translate( // this shifts the whole canvas to be zeroed at the center of the rotated object 
			Math.floor(this.xPos), 
			Math.floor(this.yPos) 
		);
		drawingSurface.rotate(this.rotation * Math.PI / 180);
		
		//Stamp the image of the rotated object (which, since the canvas is zeroed about it’s center, should be drawn half its height upwards and half its width leftwards)
		drawingSurface.drawImage(
			gateImage,
			this.sourceX, this.sourceY,
			this.sourceWidth, this.sourceHeight,
			Math.floor(-this.width / 2), Math.floor(-this.height / 2),
			this.width, this.height
		);

		//Restore the drawing surface to its state before it was rotated (but this time with the rotated sprite still in place)
		drawingSurface.restore();

		//this.endPts();
		/*
		//also draw a dot at the center of the gate)
		drawingSurface.beginPath();
		drawingSurface.arc(Math.floor(this.xPos), Math.floor(this.yPos), 5, 0, 2 * Math.PI, false);
		drawingSurface.fillStyle = "white";
      	drawingSurface.fill();
      	*/
	},

	/**
		Check the angle
	*/
	checkCollisionWith: function(circle) { 
		//console.log(Math.atan2(this.yPos, this.xPos));
		var dx = circle.xPos - this.xPos;
		var dy = circle.yPos - this.yPos;
		var distCircleGate = Math.sqrt((dx*dx) + (dy*dy));
		var angleCircleGate = Math.atan2(dy, dx) - (this.rotation * Math.PI / 180);
		if (Math.abs(distCircleGate * Math.cos(angleCircleGate)) < this.width / 2) {
			if (Math.abs(distCircleGate * Math.sin(angleCircleGate)) < circle.radius) {
				return true;
			}
		}
		return false;
	},

	checkBorderBallCollision: function(circle) {
		var angle = this.rotation * Math.PI / 180;
		var halfLength = (this.width / 2) - 8; //the offset is to center the endPt on the gate ball
		
		endX = this.xPos + (halfLength)*(Math.cos(angle));
		endY = this.yPos + (halfLength)*(Math.sin(angle));
		var ball = Object.create(gateEnd);
		ball.xPos = endX;
		ball.yPos = endY;

		endX1 = this.xPos - (halfLength)*(Math.cos(angle));
		endY1 = this.yPos - (halfLength)*(Math.sin(angle));
		var bomb = Object.create(gateEnd);
		bomb.xPos = endX1;
		bomb.yPos = endY1;

		if (collisionCircle(ball, player) || collisionCircle(bomb, player)) {
			return true;
		}
		return false;
	},

	explode: function() {
		/**
			Check for drones in a certain radius and kill them
		*/
		for (var i = drones.length - 1; i >= 0; i--) { //start from end, so you don't skip any
			var d = drones[i];
			var dx = d.xPos - this.xPos;
			var dy = d.yPos - this.yPos;

			var dist2 = dx*dx + dy*dy;

			if (dist2 < (this.blastRadius * this.blastRadius)) { //if within the blastRadius, kill the drone
				d.die();
			}
		}

		gate_explodeMP3.volume = 1;
		gate_explodeMP3.play();

		removeObjectFromArray(this, gates);
	},

	spawn: function(corner) { 
		var maxX = canvas.width - this.width;
		var maxY = canvas.height - this.width;
		var minX = this.width;
		var minY = this.width;

		var randX = Math.floor(Math.random() * (maxX - minX) + minX); 
		var randY = Math.floor(Math.random() * (maxY - minY) + minY); 
		var randAngle = Math.floor(Math.random() * 180);

		//Make sure gate doesn't spawn too close to player
		var dx = player.xPos - randX;
		var dy = player.yPos - randY;
		var distToPlayer = dx*dx + dy*dy;
		var minDist = player.radius + (this.width / 2) + 30; //spawn gate minimum of ____ pixels away from player
		while (distToPlayer < minDist*minDist) { //to circumvent sqrting
			randX = Math.floor(Math.random() * (maxX - minX) + minX); 
			randY = Math.floor(Math.random() * (maxY - minY) + minY); 
		}

		this.xPos = randX;
		this.yPos = randY;
		this.rotation = randAngle;
		gates.push(this); //this is an array in the game.html
	}
};
/**
	The border bombs at the ends of the gate; player collision with these is fatal.
*/
var gateEnd = { 
	xPos: 0,
	yPos: 0,
	radius: 7
}
function spawnGate() {
	for (var i = 0; i < gateSpawnAmount; i++) {
		var newGate = Object.create(gate);
		newGate.spawn();	
	}

	if (typeof gateSpawnTimer != 'undefined') {
		clearTimeout(gateSpawnTimer);	
	}

	var maxFreq = 6000 / gameSpeed;
	var minFreq = 2000 / gameSpeed;
	gateNextSpawnTime = Math.floor(Math.random() * (maxFreq - minFreq) + minFreq);
}