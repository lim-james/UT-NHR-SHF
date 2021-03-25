const Patches = require('Patches');
const Scene = require('Scene');
const Diagnostics = require('Diagnostics');

import Food from './Food';
import Mouth from './Mouth';

import EndState from './EndState';

const onMouthClose = (game, object) => {
	let indicator;
	let audio;

	if (game.isIngredient(object)) {
		// is a dish
		game.collected.push(object.key);
		indicator = GameState.right;
		audio = game.audio.right;
	} else {
		// not one of the dishes
		indicator = GameState.wrong;
		audio = game.audio.wrong;
	}

	indicator.delay = 0.4;
	indicator.sceneObject.hidden = false;
	indicator.sceneObject.transform.x = object.position.x;
	indicator.sceneObject.transform.y = object.position.y;

	audio.reset();
	audio.setPlaying(true);

	return game.randomisePosition(object);
};

const GameState = {
    enter: async (fsm, game, objects) => {
			game.et = game.duration;
			
			const currKey = game.currentDish().key;

	    game.dishes.forEach(dish => {
				dish.container.hidden = dish.key != currKey;
				dish.sceneObject.hidden = true;
			});
		
			game.collected = [];

			let ingredients = [];
			let randoms = [];

			objects.forEach(
				element => (game.isInGame(element) ? ingredients : randoms).push(element)
			);

	    ingredients = ingredients.map(object => {
		    object.physics.isKinematic = true;
		    return object;
			});

			const enabledPhysics = ingredients.concat(randoms);
			
			GameState.right = {
				delay: 0,
				sceneObject: await Scene.root.findFirst('chomp_right'),
			};

			GameState.wrong = {
				delay: 0,
				sceneObject: await Scene.root.findFirst('chomp_wrong'),
			};

			await Patches.inputs.setBoolean('isPlaying', true);

			// game.currentDish().startAudio.reset();
			// game.currentDish().startAudio.setPlaying(true);

	    return enabledPhysics.map(game.randomisePosition);
    },

    update: async (fsm, game, objects, dt) => {
        if (game.et <= 0 || !game.isRecording.pinLastValue()) {
            fsm.queuedState = EndState;
            return objects;
        }

		game.et -= dt;
		// move clock hand
		await Patches.inputs.setScalar('progress', game.et / game.duration);
		game.audio.bg.setPlaying(true);

		let processed = Food.update(game, objects);

		Mouth.mouths.forEach(mouth => {
			if (mouth.isClose) {
				processed = processed.map(object => {
					if (Mouth.isInside(mouth, object.sceneObject, 100)) 
						return onMouthClose(game, object);

					return object;
				});
				mouth.isClose = false;
			}
		});

		if (GameState.right.delay > 0) {
			GameState.right.delay -= dt;
			if (GameState.right.delay <= 0) {
				GameState.right.sceneObject.hidden = true;
			}
		}

		if (GameState.wrong.delay > 0) {
			GameState.wrong.delay -= dt;
			if (GameState.wrong.delay <= 0) {
				GameState.wrong.sceneObject.hidden = true;
			}
		}

		return processed;
    },

    exit: async (fsm, game, objects) => {
		await Patches.inputs.setBoolean('isPlaying', false);

		game.audio.bg.setPlaying(false);

		game.audio.done.reset();
		game.audio.done.setPlaying(true);

		GameState.right.sceneObject.hidden = true;
		GameState.wrong.sceneObject.hidden = true;
		return objects;
	},
};

export default GameState;