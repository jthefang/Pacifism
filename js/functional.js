/**************************	COLLISON DETECTION 	*******************/
function collisionCircle(c1, c2) {
	//Calculate the vector between the circles' center points
	var vx = c1.xPos - c2.xPos;
	var vy = c1.yPos - c2.yPos;
	//Find the distance between the circles
	var magnitude = vx * vx + vy * vy; //Math.sqrt(vx * vx + vy * vy); sqrt takes too much computation

	//Add together the circles' total radii
	var totalRadii = c1.radius + c2.radius;
	
	//Set hit to true if the distance between the circles is less than their totalRadii
	return magnitude < (totalRadii * totalRadii);
}

function blockCircleOverlap(c1, c2) {
	//Calculate the vector between the circles' center points
	var vx = c1.xPos - c2.xPos;
	var vy = c1.yPos - c2.yPos;
	//Find the distance between the circles
	var magnitude = Math.sqrt(vx * vx + vy * vy);
	//Add together the circles' total radii
	var totalRadii = c1.radius + c2.radius;

	if(collisionCircle(c1, c2)) { //Yes, a collision is happening.
		//Find the amount of overlap between the circles
		var overlap = totalRadii - magnitude;
		//Find the unit vector (the direction of the collision towards c1)
		dx = vx / magnitude;
		dy = vy / magnitude;

		/**
			Move c1 in the direction away from c2 by the amount of their overlap
			the direction away = vector c1 - c2
		**/
		var errorMargin = 1.0; //1 is zero
		c1.xPos += overlap * dx * errorMargin;
		c1.yPos += overlap * dy * errorMargin;
	}
}

function removeObjectFromArray(objectToRemove, array) { //a general function to remove objects from an array
	var i = array.indexOf(objectToRemove);
	if (i !== -1) {
		let obj = array[i];
		array.splice(i, 1);
		return obj;
	}
}

function square(x) {
	return x * x;
}
