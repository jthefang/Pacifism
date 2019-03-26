def has_collided(c1, c2):
	"""
		Collision detection for circular objects c1, c2
		Expect c_.x, c_.y, c_.radius to be defined
	"""
	#Calculate the vector between the circles' center points
	vx = c1.x - c2.x
	vy = c1.y - c2.y

	#Find the distance between the circles
	magnitude = vx * vx + vy * vy #Math.sqrt(vx * vx + vy * vy) sqrt takes too much computation

	#Add together the circles' total radii
	total_radii = c1.radius + c2.radius
	
	#Set hit to true if the distance between the circles is less than their total_radii
	return magnitude < (total_radii * total_radii)

def block_circle_overlap(c1, c2):
	if has_collided(c1, c2): 
		#A collision is happening => find the amount of overlap between the circles
		#Calculate the vector between the circles' center points
		vx = c1.x - c2.x
		vy = c1.y - c2.y
		#Find the distance between the circles
		magnitude = vx * vx + vy * vy #Math.sqrt(vx * vx + vy * vy) sqrt takes too much computation
		#Add together the circles' total radii
		total_radii = c1.radius + c2.radius
		overlap = total_radii - magnitude
		
		#Find the unit vector (the direction of the collision towards c1)
		dx = vx / magnitude
		dy = vy / magnitude

		"""
			Move c1 out of the collision by multiplying the overlap with the normalized vector 
			and add it to c1's position (move c1 in the direction away from c2 by the amount of their overlap)
		"""
		error_margin = 1.0 #1 is zero
		c1.x += overlap * dx * error_margin
		c1.y += overlap * dy * error_margin
