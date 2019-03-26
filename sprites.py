import arcade
import math
import numpy as np
import random
from game_functional import *

class Player:
    def __init__(self, game):
        self.x = 0
        self.y = 0
        self.dx = 0
        self.dy = 0
        self.target_x = None
        self.target_y = None

        self.game = game
        self.radius = 12
        self.color = arcade.color.WHITE
    
        self.movement_speed = 7

    def move_to(self, new_x, new_y): 
        """ Decomposes velocity into appropriate x and y based off sum total movement speed and sets target x and y """
        dx = new_x - self.x
        dy = new_y - self.y
        angle = math.atan2(dy, dx)

        self.target_x = new_x
        self.target_y = new_y
        self.dx = self.movement_speed * math.cos(angle)
        self.dy = self.movement_speed * math.sin(angle)

    def update(self):
        if self.target_x is not None:
            #stop the player if he's within a certain distance of the mouse
            error_factor = 0.32
            if (abs(self.x - self.target_x) < self.radius * error_factor):
                self.dx = 0
            if (abs(self.y - self.target_y) < self.radius * error_factor):
                self.dy = 0

        #Move the player and keep it inside screen boundaries
        self.x = max(0 + self.radius, min(self.x + self.dx, self.game.window_width - self.radius))
        self.y = max(0 + self.radius, min(self.y + self.dy, self.game.window_height - self.radius))

    def draw(self):
        """ Draws player as circle """
        arcade.draw_circle_filled(self.x, self.y, self.radius, self.color)

    def spawn(self):
        """ Spawns player in middle of screen """
        self.x = self.game.window_width / 2
        self.y = self.game.window_height / 2

    def corner(self):
        """ Returns which corner the player is in (we shouldn't spawn drones there) """
        margin_of_error = 1.7
        if (self.x < (self.game.window_width / 4) * margin_of_error):
            if (self.y < (self.game.window_height / 4) * margin_of_error):
                return self.game.TOP_LEFT_CORNER #top left
            elif (self.y > (self.game.window_height * (3 / 4)) * (1 / margin_of_error)):
                return self.game.BOTTOM_LEFT_CORNER #bottom left
        elif (self.x > (self.game.window_width * (3 / 4)) * (1 / margin_of_error)):
            if (self.y < (self.game.window_height / 4) * margin_of_error):
                return self.game.TOP_RIGHT_CORNER #top right
            elif (self.y > (self.game.window_height * (3 / 4)) * (1 / margin_of_error)):
                return self.game.BOTTOM_RIGHT_CORNER #bottom right
        return -1

class Drones:
    def __init__(self, window):
        self.game = window
        self.INITIAL_DRONE_SPAWN_AMOUNT = 20
        self.drone_spawn_amount = self.INITIAL_DRONE_SPAWN_AMOUNT
        self.drone_next_spawn_time = 0 #time till next spawn (random b/t 3-5 seconds)
        self.drones = [] #list of drones
        self.drone_render_list = arcade.ShapeElementList()
        self.update_delay = 4
        self.update_counter = 0

    def draw(self):
        """ Draws all the drones """
        self.drone_render_list.draw()

    def update(self):
        if self.update_counter % self.update_delay == 0:
            self.drone_render_list = arcade.ShapeElementList()
            for i in range(len(self.drones)):
                drone = self.drones[i]
                drone.update()   

                drone_shape = arcade.create_ellipse_filled(drone.x, drone.y, drone.radius, drone.radius, drone.color)
                self.drone_render_list.append(drone_shape)

                #also pairwise block overlap of the drones' positions (so they don't collide with each other)
                for j in range(i+1, len(self.drones)):
                    d1 = self.drones[j]
                    block_circle_overlap(drone, d1)

                #check for player collision with a drone
                if has_collided(self.game.player, drone) and not drone.dead and self.game.endable:
                    self.game.current_game_state = self.game.GAME_STATE['ENDED']

            self.drone_next_spawn_time -= math.ceil(1000 / 60) #assuming this is called at 60fps
            if self.drone_next_spawn_time <= 0:
                self.spawn_drones() #resets self.drone_next_spawn_time
        self.update_counter += 1

    def spawn_drones(self):
        """
        drone_spawnMP3.volume = 0.3
        drone_spawnMP3.play()
        """
        drone_spawn_loc = math.floor(random.random() * 4)
        if drone_spawn_loc == self.game.player.corner(): #don't spawn drones in the same corner as the player
            drone_spawn_loc = (drone_spawn_loc + 1) % 4

        for _ in range(self.drone_spawn_amount):
            new_drone = Drone(self.game)
            new_drone.spawn(drone_spawn_loc)  
            self.drones.append(new_drone)

        self.reset_next_spawn_time()

    def reset_next_spawn_time(self):
        #adjusted to self.game.game_speed
        max_msec = 1250 #5000
        min_msec = 750 #3500
        max_freq = max_msec / self.game.game_speed
        min_freq = min_msec / self.game.game_speed
        self.drone_next_spawn_time = math.floor(random.random() * (max_freq - min_freq) + min_freq) #reset next spawn time

class Drone:
    def __init__(self, window):
        self.x = 0
        self.y = 0
        self.dx = 0
        self.dy = 0
        self.target_x = None
        self.target_y = None

        self.game = window
        self.radius = 9
        self.color = arcade.color.CYAN
    
        self.movement_speed = 20
        self.dead = False #to prevent a weird afterdeath collision bug
        self.spawn_cooldown = 175 #700 #give player time to react to drones spawning
        self.pts = 15 #how many pts the player gets for killing this drone

    def move_to(self, new_x, new_y): 
        #decomposes velocity into appropriate x and y based off drones sum total movement speed and sets target x and y
        dx = new_x - self.x
        dy = new_y - self.y
        angle = math.atan2(dy, dx)

        self.dx = self.movement_speed * math.cos(angle)
        self.dy = self.movement_speed * math.sin(angle)

    def update(self):
        if self.spawn_cooldown > 0:
            self.color = arcade.color.BLUE #"#33A0FF"
            self.spawn_cooldown -= math.ceil(1000/60) #1 sec spawn time
        else:
            self.color = arcade.color.CYAN
            self.move_to(self.game.player.x, self.game.player.y) #target player

            #Move the drone and keep it inside screen boundaries
            self.x = max(0 + self.radius, min(self.x + self.dx, self.game.window_width - self.radius))
            self.y = max(0 + self.radius, min(self.y + self.dy, self.game.window_width - self.radius))

    def draw(self):
        """ Draws drone as circle """
        arcade.draw_circle_filled(self.x, self.y, self.radius, self.color)

    def spawn(self, corner):
        min_x = 0
        max_x = 0
        min_y = 0
        max_y = 0
        #spawn in one of the four corners [TOP_LEFT_CORNER, TOP_RIGHT_CORNER, BOTTOM_RIGHT_CORNER, BOTTOM_LEFT_CORNER]
        if corner == self.game.TOP_LEFT_CORNER:
            min_x = 0
            max_x = self.game.window_width / 4
            min_y = 0
            max_y = self.game.window_height / 4
        elif corner == self.game.TOP_RIGHT_CORNER:
            min_x = self.game.window_width * (3 / 4)
            max_x = self.game.window_width
            min_y = 0
            max_y = self.game.window_height / 4
        elif corner == self.game.BOTTOM_RIGHT_CORNER: 
            min_x = self.game.window_width * (3 / 4)
            max_x = self.game.window_width
            min_y = self.game.window_height * (3 / 4)
            max_y = self.game.window_height
        elif corner == self.game.BOTTOM_LEFT_CORNER: 
            min_x = 0
            max_x = self.game.window_width / 4
            min_y = self.game.window_height * (3 / 4)
            max_y = self.game.window_height

        #offset by radius so that entire drone appears within boundaries (not half the radius outside)
        max_x -= self.radius
        max_y -= self.radius
        min_x += self.radius
        min_y += self.radius

        rand_x = math.floor(random.random() * (max_x - min_x) + min_x) #randomX in range [drone.radius, max_x]
        rand_y = math.floor(random.random() * (max_y - min_y) + min_y) 

        self.x = rand_x
        self.y = rand_y

    def die(self, drones):
        self.dead = true
        drones.remove(self)

        """
        newExplosion = Object.create(explosion)
        newExplosion.x = self.x - self.radius
        newExplosion.y = self.y - self.radius
        #newExplosion.display_size = self.radius
        explosions.push(newExplosion)
        """

        self.game.game_score += self.pts

class Explosions:

class Explosion:
    def __init__(self,):
        self.img_size = 92
        self.display_size = 20 #pixels
        self.COLUMNS = 3 #= # frames per row on the tile sheet
        self.number_of_frames = 17 #18 - 1
        self.current_frame = 0
        self.source_x = 0
        self.source_y = 0

        self.x = 0
        self.y = 0

    def update(self):
        #Find the frame's correct column and row on the tilesheet
        self.source_x = math.floor(self.current_frame % self.COLUMNS) * self.img_size
        self.source_y = math.floor(self.current_frame / self.COLUMNS) * self.img_size

        if self.current_frame < self.number_of_frames:
            self.current_frame++
        else:
            removeObjectFromArray(self, explosions)

    def draw():
        #Draw the monster's current animation frame
        drawingSurface.drawImage (
            burstImage,
            self.source_x, self.source_y, self.img_size, self.img_size,
            self.xPos, self.yPos, self.display_size, self.display_size
        )
}