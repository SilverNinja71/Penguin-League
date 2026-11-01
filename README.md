# Penguin League

Rocket League-style car soccer with belly-sliding jetpack penguins instead of cars.
Play 1v1, 2v2 or 5v5 against bots from Easy to God. The bots drive a stock penguin with the same physics and controls as you; harder bots only play better. Earn fish to buy upgrades in the garage and hats, feathers and boost trails in the locker.

## Play

Play online at https://silverninja71.github.io/Penguin-League/, or open `index.html`. To share the site account locally, put this repo next to the hub repo [`Empire`](https://github.com/SilverNinja71/Empire) in one folder, run `python3 Empire/server.py` there and go to `http://localhost:8080/Penguin-League/`. Three.js and the fonts load from CDNs, so it needs an internet connection.

## Play with friends

Press **PLAY WITH FRIENDS** on the title screen, then **CREATE ROOM**, and send the invite link (`…/Penguin-League/?room=CODE`) to up to 3 friends. Opening the link joins the room; friends can also type the 5-letter code. The host picks 1v1, 2v2 or 5v5, friends-vs-friends or all-together-vs-bots, the bot level and the match length, and bots fill the empty spots. Everyone drives a stock penguin.

The match runs on the host's computer, so the host should keep the tab open and in front. Friends send their controls and see the match about 0.1 s behind, which keeps motion smooth. Connections go browser to browser through PeerJS, so it needs an internet connection.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Drive / reverse, tilt nose in the air | W / S | RT / LT, left stick |
| Steer, turn in the air | A / D | left stick |
| Jump (press again with a direction to belly dive) | Space or right click | A |
| Boost | Shift or left click | B |
| Charged shot (hold; steer at contact to curve it) | F | RB |
| Powerslide | X | X |
| Ball cam | C | Y |
| Pause | Esc or P | Start |

On touch screens there are on-screen JUMP, BOOST, SLIDE and SHOT buttons.

## Mechanics

- **Ice crystals:** six glowing crystal pads (four corners, two at midfield) fill the tank and give a 1.35× speed burst for 1.5 s, then regrow after 10 s. Small fish pads give 12 boost.
- **Spin and curve:** glancing hits, hits while turning and charged shots put sidespin on the ball, and a Magnus force bends it in flight (shown by an icy ribbon). Bot ball prediction uses the same physics.
- **Charged shots:** holding charge slows you slightly; past the first notch the next touch adds power and curves toward the side you're steering.
- **Goal highlight:** every goal plays 2.5 s of 0.35× slow motion with the camera zooming toward the net and the scorer, an air horn and confetti, then the kickoff resets.
- **Team roles:** each team has a Goalie, a Sweeper in 5v5, and Strikers. Only the lead striker chases the ball, duties swap as play moves, and badges over bot names show who is doing what.

## CrazyGames build

`./build.sh` also makes `dist/crazygames/` and `dist/penguin-league-crazygames.zip`, the file to upload to CrazyGames (about 0.4 MB). That version:

- loads Three.js r160, its post-processing add-ons and the fonts from its own files (`vendor/`), not from CDNs;
- adds the CrazyGames HTML5 SDK v3: loading start/stop, gameplay start/stop around play (pauses and menus stop it), midgame ads only between matches with the game muted during them, the SDK's mute setting, `happytime` for a first God-bot win, and saves through the SDK Data module, with localStorage as the fallback;
- leaves out online rooms (PeerJS), so it talks to no server except CrazyGames' own SDK. The build stops if any other outside address is left in the page.

Everywhere else the SDK isn't loaded and none of this runs. To test it locally, serve the repo folder (for example `python3 -m http.server`) and open `/dist/crazygames/index.html#mute`. The SDK then runs in its "local" mode and shows a placeholder where an ad would be.

## First minute

**PLAY** on the title screen is one click into gameplay. First-time players get a five-step tutorial in an empty rink (drive, boost, jump, hit the ball, score), which they can skip, followed by a 3-minute 1v1 against an Easy bot. After that, PLAY goes straight to that quick match, and **Custom match** opens the full setup. The control card in matches and the tutorial follow the device being used (keyboard, gamepad or touch), and key names follow the keyboard layout where the browser reports it (Z Q S D on AZERTY).

## Build

The game is split into parts in `src/`. `./build.sh` joins them into `index.html` (standalone page) and `penguin-league.html` (page body for publishing elsewhere). `tools/check.sh` builds and syntax-checks the result with macOS JavaScriptCore.
