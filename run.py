import arcade
from sprites import *

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

class Game(arcade.Window):
    def __init__(self, width, height):
        super().__init__(width, height)
        arcade.set_background_color(arcade.color.BLACK)

        self.window_width, self.window_height = self.get_size()
        self.TOP_LEFT_CORNER = 0
        self.TOP_RIGHT_CORNER = 1
        self.BOTTOM_RIGHT_CORNER = 2
        self.BOTTOM_LEFT_CORNER = 3

        self.GAME_STATE = {
            'LOADING': 0,
            'STARTING': 1,
            'PLAYING': 2,
            'PAUSED': 3,
            'ENDED': 4
        }

    def setup(self):
        """ Setup game """
        self.current_game_state = self.GAME_STATE['PLAYING']

        self.endable = True #will determine whether the game ends if player collides with drones
        self.ended = False
        self.game_score = 0
        self.game_speed = 1; #should ramp up logarithmically with the score

        self.player = Player(self)
        self.player.spawn()

        self.drones = Drones(self)
        self.drones.spawn_drones()

    def on_draw(self):
        """ Render screen """
        arcade.start_render()
        self.player.draw()
        self.drones.draw()
        self.display_info()

    def update(self, delta_time):
        """ High level game logic """
        if self.current_game_state == self.GAME_STATE['LOADING']:
            pass
        elif self.current_game_state == self.GAME_STATE['STARTING']:
            self.start_game()
        elif self.current_game_state == self.GAME_STATE['PLAYING']:
            self.play_game()
        elif self.current_game_state == self.GAME_STATE['PAUSED']:
            #do nothing
            pass
        elif self.current_game_state == self.GAME_STATE['ENDED']:
            if not self.endable:
                self.play_game()
            elif not self.ended: 
                #only call end_game once
                self.end_game()

    def start_game(self):
        pass

    def play_game(self):
        self.player.update()
        self.drones.update()

    def end_game(self):
        self.ended = True

        """
        themeMP3.pause();
        game_overMP3.currentTime = 0;
        game_overMP3.volume = 1.0;
        game_overMP3.play();
        """

    def display_info(self):
        score_text = f"SCORE: {self.game_score}"
        arcade.draw_text(score_text, 10, 15, arcade.color.WHITE, 14)

        menu_text = "Press ESC for menu"
        arcade.draw_text(menu_text, 10, self.window_height - 25, arcade.color.WHITE, 14)

        if self.current_game_state == self.GAME_STATE['PAUSED']:
            self.display_menu()
        elif self.current_game_state == self.GAME_STATE['ENDED']:
            self.display_game_over()

    def display_game_over(self):
        game_over_text = "GAME OVER"
        center_x = self.window_width / 2
        center_y = self.window_height / 2
        arcade.draw_text(game_over_text, center_x-50, center_y, arcade.color.BLACK, 12)

    def display_menu(self):
        center_x = self.window_width / 2
        center_y = self.window_height / 2
        width, height = 200, 150
        menu_text = "ESC | Toggle menu\n" + "R   | Restart game"

        arcade.draw_rectangle_filled(center_x, center_y, width, height, arcade.color.WHITE)        
        arcade.draw_text(menu_text, center_x-65, center_y, arcade.color.BLACK, 12)

    def on_key_press(self, key, modifiers):
        """Called whenever a key is pressed. """
        if key == arcade.key.ESCAPE:
            if self.current_game_state == self.GAME_STATE['PAUSED']: #toggle play/pause
                self.current_game_state = self.GAME_STATE['PLAYING']
            else:
                self.current_game_state = self.GAME_STATE['PAUSED']
            self.display_menu()
        elif key == arcade.key.R:
            self.setup()

    def on_mouse_motion(self, mouse_x, mouse_y, dx, dy):
        """ Called whenever the mouse is moved """
        # Have player follow the mouse
        if abs(mouse_x - self.player.x) >= self.player.radius or abs(mouse_y - self.player.y) >= self.player.radius:
            #only move the player if mouse is not over the player (this prevents jittery movement)
            self.player.move_to(mouse_x, mouse_y)

def main():
    game = Game(SCREEN_WIDTH, SCREEN_HEIGHT)
    game.setup()
    arcade.run()

if __name__ == "__main__":
    main()