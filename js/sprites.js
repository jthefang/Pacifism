/***********************************************	DRONE 		*******************/
var drones = {
	init: function(game) {
		this.game = game;
		this.reset();
        this.dronesPool = []; //cache old drones for reuse
	},

	reset: function() {
		this.INITIAL_DRONE_SPAWN_AMOUNT = 20;
        this.droneSpawnAmount = this.INITIAL_DRONE_SPAWN_AMOUNT;
        this.droneNextSpawnTime = 0; //time till next spawn (random b/t 3-5 seconds)
        this.droneSpawnCooldown = 700;
        this.drones = []; //list of drones
	},

	update: function() {
		//update drone positions
	  	for (var j = 0; j < this.drones.length; j++) {
	  		let curr_drone = this.drones[j]
			curr_drone.updatePosition();	

			//also pairwise block overlap of the drones' positions (so they don't collide with each other)
			for (var k = j + 1; k < this.drones.length; k++) {
				blockCircleOverlap(curr_drone, this.drones[k]);
			}

			//check for player collision with a drone
			if (collisionCircle(this.game.player, curr_drone) && !curr_drone.dead && this.game.endable) {
				this.game.currentGameState = this.game.GAME_STATE.ENDED;
			}
		}

		this.droneNextSpawnTime -= Math.ceil(1000 / 60); //60fps
		if (this.droneNextSpawnTime <= 0) {
			this.spawnDrones(); //resets droneNextSpawnTime
		}
	},

	draw: function() {
		for (var k = 0; k < this.drones.length; k++) {
			this.drones[k].draw();
		}
	},

	killDrone: function(drone) {
		this.dronesPool.push(removeObjectFromArray(drone, this.drones));
	},

	spawnDrones: function() {
		/*this.game.drone_spawnMP3.volume = 0.3;
		this.game.drone_spawnMP3.play();*/

		var droneSpawnLoc = Math.floor(Math.random() * 4);
		if (droneSpawnLoc == this.game.player.corner()) { //don't spawn drones in the same corner as the player
			droneSpawnLoc = (droneSpawnLoc + 1) % 4;
		}

		for (var i = 0; i < this.droneSpawnAmount; i++) {
			var newDrone;
			if (this.dronesPool.length == 0) {
				newDrone = Object.create(drone);	
			} else {
				newDrone = this.dronesPool.pop();
			}
			newDrone.init(this.game);
			newDrone.spawn(droneSpawnLoc);	
			this.drones.push(newDrone);
		}

		//adjusted to this.game.gameSpeed
		var maxFreq = 5000 / this.game.gameSpeed;
		var minFreq = 3000 / this.game.gameSpeed;
		this.droneNextSpawnTime = Math.floor(Math.random() * (maxFreq - minFreq) + minFreq);
	}
}

var drone = {
	init: function(game) {
		this.game = game;

		this.radius = 9;
		this.dead = false; //to prevent a weird afterdeath collision bug
		this.spawnCooldown = this.game.drones.droneSpawnCooldown; //give player time to react to drones spawning
		this.color = "Cyan";

		this.xPos = 0;
		this.yPos = 0;
		
		this.movementSpeed = 5;
		this.xVel = 0;
		this.yVel = 0;
		this.pts = 15; //how many pts the player gets for killing this drone
	},

	/**
		Decomposes velocity into appropriate dx and dy based off drone's sum
		total movement speed and sets target x and y to be newX and new Y
	**/
	moveToPos: function(newX, newY) { 
		var dx = newX - this.xPos;
		var dy = newY - this.yPos;
		var angle = Math.atan2(dy, dx)

		this.xVel = this.movementSpeed * Math.cos(angle);
		this.yVel = this.movementSpeed * Math.sin(angle);
	},

	updatePosition: function() {
		if (this.spawnCooldown > 0) {
			this.color = "#33A0FF";
			this.spawnCooldown -= Math.ceil(1000/60); 
		} else {
			this.color = "Cyan";
			this.moveToPos(this.game.player.xPos, this.game.player.yPos); //target player

			//Move the drone and keep it inside screen boundaries
			this.xPos = Math.max(0 + this.radius, Math.min(this.xPos + this.xVel, this.game.canvas.width - this.radius));
			this.yPos = Math.max(0 + this.radius, Math.min(this.yPos + this.yVel, this.game.canvas.height - this.radius));
		}
	},

	draw: function() {
		//draw drone as circle
		this.game.drawingSurface.beginPath();
		this.game.drawingSurface.arc(Math.floor(this.xPos), Math.floor(this.yPos), this.radius, 0, 2 * Math.PI, false);
		this.game.drawingSurface.fillStyle = this.color;
      	this.game.drawingSurface.fill();	
	},

	spawn: function(corner) { 
		var minX = 0;
		var maxX = 0;
		var minY = 0;
		var maxY = 0;
		//spawn in one of the four corners
		switch(corner) {
			case this.game.CORNERS.TOP_LEFT: //top left
				minX = 0;
				maxX = this.game.canvas.width / 4;
				minY = 0;
				maxY = this.game.canvas.height / 4;
				break;
			case this.game.CORNERS.TOP_RIGHT: //top right
				minX = this.game.canvas.width * (3 / 4);
				maxX = this.game.canvas.width;
				minY = 0;
				maxY = this.game.canvas.height / 4;
				break;
			case this.game.CORNERS.BOTTOM_RIGHT: //bottom right
				minX = this.game.canvas.width * (3 / 4);
				maxX = this.game.canvas.width;
				minY = this.game.canvas.height * (3 / 4);
				maxY = this.game.canvas.height;
				break;
			case this.game.CORNERS.BOTTOM_LEFT: //bottom left
				minX = 0;
				maxX = this.game.canvas.width / 4;
				minY = this.game.canvas.height * (3 / 4);
				maxY = this.game.canvas.height;
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
	},

	die: function() {
		this.dead = true;
		this.game.drones.killDrone(this);
		this.game.explosions.spawnExplosionForDrone(this);
		this.game.gameScore += this.pts;
	}
};

/***********************************************	EXPLOSION 	*******************/
var explosions = {
	init: function(game) {
		this.game = game;
        this.reset();
        this.explosionsPool = []; //cache old explosions for reuse
	},

	reset: function() {
		this.explosions = []; //list of explosioins
	},

	update: function() {
		//update explosions
		for (var m = 0; m < this.explosions.length; m++) {
			let currExplosion = this.explosions[m];
			currExplosion.updateAnimation();	
			if (currExplosion.currentFrame >= currExplosion.numberOfFrames) {
				this.explosionsPool.push.apply(this.explosionsPool, this.explosions);
				this.explosions = [];
				break; //don't need to render the rest of the explosions
			}
		}
	},

	draw: function() {
		for (var k = 0; k < this.explosions.length; k++) {
			this.explosions[k].draw();
		}
	},

	spawnExplosionForDrone: function(drone) {
		var newExplosion;
		if (this.explosionsPool.length == 0) {
			newExplosion = Object.create(explosion);
		} else { //recycle old one
			newExplosion = this.explosionsPool.pop();
		}
		newExplosion.init(this.game);
		newExplosion.xPos = drone.xPos - drone.radius;
		newExplosion.yPos = drone.yPos - drone.radius;
		//newExplosion.displaySize = this.radius;
		this.explosions.push(newExplosion);	
	}
}

var explosion = {
	init: function(game) {
		this.game = game;
		this.imgSize = 92;
		this.displaySize = 20; //pixels
		this.COLUMNS = 3; //change this to = the number of frames you have per row on your tile sheet
		this.numberOfFrames = 17; //18 - 1
		this.currentFrame = 0;
		this.sourceX = 0;
		this.sourceY = 0;

		this.xPos = 0;
		this.yPos = 0;
	},

	updateAnimation: function() {
		//Find the frame's correct column and row on the tilesheet
		this.sourceX = Math.floor(this.currentFrame % this.COLUMNS) * this.imgSize;
		this.sourceY = Math.floor(this.currentFrame / this.COLUMNS) * this.imgSize;

		if (this.currentFrame < this.numberOfFrames) {
			this.currentFrame++;
		}
	},

	draw: function() {
		//Draw the monster's current animation frame
		this.game.drawingSurface.drawImage (
			this.game.burstImage,
			this.sourceX, this.sourceY, this.imgSize, this.imgSize,
			this.xPos, this.yPos, this.displaySize, this.displaySize
		);
	}
}

/***********************************************	PLAYER 		*******************/
var player = {
	init: function(game) {
		this.game = game;
		this.radius = 12;
		this.color = "white";
		this.xPos = 0;
		this.yPos = 0;
		
		this.movementSpeed = 7;
		this.moveLeft = false;
		this.moveTop = false;
		this.moveRight = false;
		this.moveDown = false;
		this.xVel = 0;
		this.yVel = 0;
	},

	moveToPos: function(newX, newY) { 
		/**
			Decomposes velocity into appropriate x and y based off 
			sum total movement speed and sets target x and y
		*/
		var dx = newX - this.xPos;
		var dy = newY - this.yPos;
		var angle = Math.atan2(dy, dx)

		this.xVel = this.movementSpeed * Math.cos(angle);
		this.yVel = this.movementSpeed * Math.sin(angle);
	},

	updatePosition: function() {
		if (this.game.currentControlMethod == this.game.controlMethod.KBD) {
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
			if (!this.moveUp && !this.moveDown) { 
				//only set velocity to zero if mouse is not moving (otherwise we want the player to track the mouse)
				this.yVel = 0;
			}
			if (!this.moveLeft && !this.moveRight) {
				this.xVel = 0;
			}	
		} else if (this.game.currentControlMethod == this.game.controlMethod.MOUSE) { 
			//stop the player if he's within a certain distance of the mouse
			var errorFactor = 0.32;
			if (Math.abs(this.xPos - this.game.mouseX) < this.radius * errorFactor) { 
				this.xVel = 0;
			} 
			if (Math.abs(this.yPos - this.game.mouseY) < this.radius * errorFactor) {
				this.yVel = 0;
			}
		}

		//Move the player and keep it inside screen boundaries
		this.xPos = Math.max(0 + this.radius, Math.min(this.xPos + this.xVel, this.game.canvas.width - this.radius));
		this.yPos = Math.max(0 + this.radius, Math.min(this.yPos + this.yVel, this.game.canvas.height - this.radius));
	},

	draw: function() {
		//draw player as circle
		this.game.drawingSurface.beginPath();
		this.game.drawingSurface.arc(Math.floor(this.xPos), Math.floor(this.yPos), this.radius, 0, 2 * Math.PI, false);
		this.game.drawingSurface.fillStyle = this.color;
      	this.game.drawingSurface.fill();
	},

	spawn: function() {
		this.xPos = this.game.canvas.width / 2;
		this.yPos = this.game.canvas.height / 2;
	},

	/**
		Is the player in a corner, if so we shouldn't spawn drones there
	*/
	corner: function() {
		var marginOfError = 1.7;
		if (this.xPos < (this.game.canvas.width / 4) * marginOfError) {
			if (this.yPos < (this.game.canvas.height / 4) * marginOfError) {
				return this.game.CORNERS.TOP_LEFT; //top left
			} else if (this.yPos > (this.game.canvas.height * (3 / 4)) * (1 / marginOfError)) {
				return this.game.CORNERS.BOTTOM_LEFT; //bottom left
			}
		} else if (this.xPos > (this.game.canvas.width * (3 / 4)) * (1 / marginOfError)) {
			if (this.yPos < (this.game.canvas.height / 4) * marginOfError) {
				return this.game.CORNERS.TOP_RIGHT; //top right
			} else if (this.yPos > (this.game.canvas.height * (3 / 4)) * (1 / marginOfError)) {
				return this.game.CORNERS.BOTTOM_RIGHT; //bottom right
			}
		}
		return -1;
	}	
};

/***********************************************	GATE 		*******************/
var gates = {
	init: function(game) {
		this.game = game;
		this.reset();
        this.gatesPool = []; //cache old gates for reuse
	},

	reset: function() {
		this.INITIAL_GATE_SPAWN_AMOUNT = 1;
		this.maxGateSpawnAmount = this.INITIAL_GATE_SPAWN_AMOUNT;
		this.gateSpawnTimer;
		this.gateNextSpawnTime;
        this.gates = []; //list of gates
	},

	update: function() {
		//update gate positions
	  	for (var i = 0; i < this.gates.length; i++) {
			this.gates[i].updatePosition();	
		}
		
		this.gateNextSpawnTime -= Math.ceil(1000 / 60);
		if (this.gateNextSpawnTime <= 0) {
			this.spawnGate();
		}
	},

	draw: function() {
		for (var k = 0; k < this.gates.length; k++) {
			this.gates[k].draw();
		}
	},

	killGate: function(gate) {
		this.gatesPool.push(removeObjectFromArray(gate, this.gates));
	},

	spawnGate: function() {
		var gateSpawnAmount = Math.ceil(Math.random() * this.maxGateSpawnAmount); //random # b/t 1 -> maxGateSpawnAmount
		for (var i = 0; i < gateSpawnAmount; i++) {
			var newGate;
			if (this.gatesPool.length == 0) {
				newGate = Object.create(gate);	
			} else {
				newGate = this.gatesPool.pop();
			}
			newGate.init(this.game);
			newGate.spawn();	
			this.gates.push(newGate); 
		}

		if (typeof this.gateSpawnTimer != 'undefined') {
			clearTimeout(this.gateSpawnTimer);	
		}

		var maxFreq = 6000 / this.game.gameSpeed;
		var minFreq = 2000 / this.game.gameSpeed;
		this.gateNextSpawnTime = Math.floor(Math.random() * (maxFreq - minFreq) + minFreq);
	}
}

var gate = {
	init: function(game) {
		this.game = game;
		this.sourceX = 0;
		this.sourceY = 0;
		this.sourceWidth = 1000;
		this.sourceHeight = 150;

		this.width = 100;
		this.height = 15;
		this.xPos = 0;
		this.yPos = 0;
		this.blastRadius = 250;
		
		this.rotation = 0;
		this.rotationSpeed = 0.6; //degrees per frame

		this.movementSpeed = 6;
		this.xVel = 0;
		this.yVel = 0;
	},
	
	updatePosition: function() {
		this.rotation += this.rotationSpeed;

		if (this.checkCollisionWith(this.game.player)) {
      		this.explode();
      	} else if (this.checkBorderBallCollision() && this.game.endable) {
			this.game.currentGameState = this.game.GAME_STATE.ENDED;
		}
	},

	endPts: function() { //draws the endpts of the gate (uncomment in draw() function below)
		var angle = this.rotation * Math.PI / 180;
		var halfLength = (this.width / 2) - 8; //the offset is to center the endPt on the gate ball
		
		endX = this.xPos + (halfLength)*(Math.cos(angle));
		endY = this.yPos + (halfLength)*(Math.sin(angle));
		endX1 = this.xPos - (halfLength)*(Math.cos(angle));
		endY1 = this.yPos - (halfLength)*(Math.sin(angle));
		
		var endRadius = 8;
		this.game.drawingSurface.beginPath();
		this.game.drawingSurface.arc(Math.floor(endX), Math.floor(endY), endRadius, 0, 2 * Math.PI, false);
		this.game.drawingSurface.fillStyle = "red";
      	this.game.drawingSurface.fill();

		this.game.drawingSurface.beginPath();
		this.game.drawingSurface.arc(Math.floor(endX1), Math.floor(endY1), endRadius, 0, 2 * Math.PI, false);
		this.game.drawingSurface.fillStyle = "green";
      	this.game.drawingSurface.fill();

		//also draw a dot at the center of the gate or draw blastRadius
		this.game.drawingSurface.beginPath();
		this.game.drawingSurface.arc(Math.floor(this.xPos), Math.floor(this.yPos), this.blastRadius, 0, 2 * Math.PI, false);
		this.game.drawingSurface.strokeStyle = "white";
		this.game.drawingSurface.stroke();
	},

	draw: function() {
		//Save the current state of the drawing surface before it's rotated
		this.game.drawingSurface.save();
		//Rotate the canvas
		this.game.drawingSurface.translate( // this shifts the whole canvas to be zeroed at the center of the rotated object 
			Math.floor(this.xPos), 
			Math.floor(this.yPos) 
		);
		this.game.drawingSurface.rotate(this.rotation * Math.PI / 180);
		
		//Stamp the image of the rotated object (which, since the canvas is zeroed about it’s center, should be drawn half its height upwards and half its width leftwards)
		this.game.drawingSurface.drawImage(
			this.game.gateImage,
			this.sourceX, this.sourceY,
			this.sourceWidth, this.sourceHeight,
			Math.floor(-this.width / 2), Math.floor(-this.height / 2),
			this.width, this.height
		);

		//Restore the drawing surface to its state before it was rotated (but this time with the rotated sprite still in place)
		this.game.drawingSurface.restore();

		//this.endPts();
	},

	/**
		Check the angle
	*/
	checkCollisionWith: function(circle) { 
		var dx = circle.xPos - this.xPos;
		var dy = circle.yPos - this.yPos;
		var distCircleGate = (dx*dx) + (dy*dy);
		var angleCircleGate = Math.atan2(dy, dx) - (this.rotation * Math.PI / 180);
		//avoid sqrting;
		if (Math.abs(distCircleGate * square(Math.cos(angleCircleGate))) < square(this.width / 2)) {
			if (Math.abs(distCircleGate * square(Math.sin(angleCircleGate))) < square(circle.radius)) {
				return true;
			}
		}
		return false;
	},

	checkBorderBallCollision: function(circle) {
		var angle = this.rotation * Math.PI / 180;
		var halfLength = (this.width / 2) - 8; //the offset is to center the endPt on the gate ball
		
		/**
			The border bombs at the ends of the gate; player collision with these is fatal.
		*/
		endX = this.xPos + (halfLength)*(Math.cos(angle));
		endY = this.yPos + (halfLength)*(Math.sin(angle));
		var ball = {
			xPos: 0,
			yPos: 0,
			radius: 7
		};
		ball.xPos = endX;
		ball.yPos = endY;

		endX1 = this.xPos - (halfLength)*(Math.cos(angle));
		endY1 = this.yPos - (halfLength)*(Math.sin(angle));
		var bomb = {
			xPos: 0,
			yPos: 0,
			radius: 7
		};
		bomb.xPos = endX1;
		bomb.yPos = endY1;

		if (collisionCircle(ball, this.game.player) || collisionCircle(bomb, this.game.player)) {
			return true;
		}
		return false;
	},

	explode: function() {
		/**
			Check for drones in a certain radius and kill them
		*/
		for (var i = this.game.drones.drones.length - 1; i >= 0; i--) { //start from end, so you don't skip any
			var d = this.game.drones.drones[i];
			var dx = d.xPos - this.xPos;
			var dy = d.yPos - this.yPos;

			var dist2 = dx*dx + dy*dy;

			if (dist2 < (this.blastRadius * this.blastRadius)) { //if within the blastRadius, kill the drone
				d.die();
			}
		}

		/*this.game.gate_explodeMP3.volume = 1;
		this.game.gate_explodeMP3.currentTime = 0;
		this.game.gate_explodeMP3.play();*/
		this.game.gates.killGate(this);
	},

	spawn: function() { 
		var maxX = this.game.canvas.width - this.width;
		var maxY = this.game.canvas.height - this.width;
		var minX = this.width;
		var minY = this.width;

		var randX = Math.floor(Math.random() * (maxX - minX) + minX); 
		var randY = Math.floor(Math.random() * (maxY - minY) + minY); 
		var randAngle = Math.floor(Math.random() * 180);

		//Make sure gate doesn't spawn too close to player
		var dx = this.game.player.xPos - randX;
		var dy = this.game.player.yPos - randY;
		var distToPlayer = dx*dx + dy*dy;
		var minDist = 9*this.game.player.radius + (this.width / 2); //spawn gate minDist away from player
		while (distToPlayer < minDist*minDist) { //to circumvent sqrting
			randX = Math.floor(Math.random() * (maxX - minX) + minX); 
			randY = Math.floor(Math.random() * (maxY - minY) + minY); 
		}

		this.xPos = randX;
		this.yPos = randY;
		this.rotation = randAngle;
	}
};
