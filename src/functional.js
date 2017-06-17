// ******** MARK: - collision detection
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

	if(magnitude < totalRadii) { //Yes, a collision is happening.
		//Find the amount of overlap between the circles
		var overlap = totalRadii - magnitude;
		//Find the unit vector (the direction of the collision towards c1)
		dx = vx / magnitude;
		dy = vy / magnitude;
		//Move circle 1 out of the collision by multiplying the overlap with the normalized vector and add it to circle 1's position (move circle 1 in the direction away from circle 2 by the amount of their overlap)
		c1.xPos += overlap * dx;
		c1.yPos += overlap * dy;
	}
}

function removeObjectFromArray(objectToRemove, array) { //a general function to remove objects from an array
	var i = array.indexOf(objectToRemove);
	if (i !== -1) {
		array.splice(i, 1);
	}
}
