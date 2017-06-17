var droneSpawnAmount = 20;
var droneSpawnTimer;
var droneSpawnFrequency = 5000; //every 5 seconds, spawn droneSpawnAmount of drones 
var drone = {
	radius: 9,
	color: "Cyan",

	xPos: 0,
	yPos: 0,
	
	movementSpeed: 6,
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
	}
};
function spawnDrones() {
	var droneSpawnLoc = Math.floor(Math.random() * 4);
	while (droneSpawnLoc == player.inCorner()) { //don't spawn drones in the same corner as the player
		droneSpawnLoc = Math.floor(Math.random() * 4);
	}

	for (var i = 0; i < droneSpawnAmount; i++) {
		var newDrone = Object.create(drone);
		newDrone.spawn(droneSpawnLoc);	
	}

	if (typeof droneSpawnTimer != 'undefined') {
		clearTimeout(droneSpawnTimer);	
	}
	droneSpawnTimer = setTimeout(spawnDrones, droneSpawnFrequency); //reset timer to spawn in another droneSpawnTime seconds
}

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
		if (!IS_MOUSE_MOVING && !this.moveUp && !this.moveDown) { //only set velocity to zero if mouse is not moving (otherwise we want the player to track the mouse)
			this.yVel = 0;
		}
		if (!IS_MOUSE_MOVING && !this.moveLeft && !this.moveRight) {
			this.xVel = 0;
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

var gateSpawnTimer;
var gateSpawnFrequency = 8000; //every 5 seconds, spawn droneSpawnAmount of drones 
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
	
	rotation: 0,
	rotationSpeed: 0.6, //degrees per frame

	movementSpeed: 6,
	xVel: 0,
	yVel: 0,

	updatePosition: function() {
		this.rotation += this.rotationSpeed;
      	if (this.checkCollisionWith(player)) {
      		this.explode();
      	}
	},

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

	explode: function() {
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

		this.xPos = randX;
		this.yPos = randY;
		this.rotation = randAngle;
		gates.push(this); //this is an array in the game.html
	}
};
function spawnGate() {
	var newGate = Object.create(gate);
	newGate.spawn();	

	if (typeof gateSpawnTimer != 'undefined') {
		clearTimeout(gateSpawnTimer);	
	}
	gateSpawnTimer = setTimeout(spawnGate, gateSpawnFrequency); //reset timer to spawn in another gateSpawnFrequency seconds
}