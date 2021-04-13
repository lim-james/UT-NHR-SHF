const Materials = require('Materials');
const Patches = require('Patches');
const Reactive = require('Reactive');
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Diagnostics = require('Diagnostics');

import { Bounds } from './Common';
import MyMath from './MyMath';
import GameState from './GameState';
import { randomisePosition } from './Food';

const EndState = {
	clockY: -0.15,
	recording: true,

    enter: async (fsm, game, objects) => {
    	game.currentDish().sceneObject.hidden = false;
    	await Patches.inputs.setPulse(game.currentDish().key + '_appear', Reactive.once());

		let ingredients = [];
		let randoms = [];

		objects.forEach(
			element => (game.isIngredient(element) ? ingredients : randoms).push(element)
		);

		ingredients = ingredients.map(i => {
			i.physics.isKinematic = false;
			return i;
		});

		randoms = randoms.map(i => {
			i.physics.isKinematic = false;
			return randomisePosition(i);
		});
		
		game.et = 0;

		EndState.blastIndex = -1;
		EndState.blastDelay = 0;
		EndState.blastMaterial = await Materials.findFirst('Blast');

		EndState.blastObject = await Scene.root.findFirst('blast');
		// EndState.blastObject.hidden = false;

		EndState.clockObject = await Scene.root.findFirst('clock');
		EndState.clockObject.hidden = true;

        TouchGestures.onTap().subscribe((gesture) => {
            fsm.queuedState = GameState;
        });

        return randoms.concat(ingredients);
    },

    update: async (fsm, game, objects, dt) => {
		if (EndState.recording) {
			if (!game.isRecording.pinLastValue()) {
				EndState.recording = false;
			}
		} else {
			if (game.isRecording.pinLastValue()) {
				fsm.queuedState = GameState;
				EndState.recording = true;
			}
		}

		game.et += dt;

		if (EndState.blastDelay > 0) {
			EndState.blastDelay -= dt;
			if (EndState.blastDelay <= 0) {
				EndState.blastObject.hidden = true;
			}
		}

		let ingredients = [];
		let randoms = [];

		objects.forEach(
			element => (game.isIngredient(element) ? ingredients : randoms).push(element)
		);

		let processed = ingredients; 

		const getY = index => (index / ingredients.length - 0.5) * Bounds.max.y + 0.1;

		if (game.et < 2) {
			const t = game.et / 2;
			processed = ingredients.map((value, index) => {
		    	value.position.x = MyMath.lerp(value.position.x, 0, t);
		    	value.position.y = MyMath.lerp(value.position.y, getY(index), t);
		    	return value;
			});
		} else if (game.et > 3) {
			const et = game.et - 3;

			const isCollected = obj => game.collected.includes(obj.key);

			let collected = [];
			let others = [];

			ingredients.forEach(
				element => (isCollected(element) ? collected : others).push(element)
			);
			
			await Patches.inputs.setBoolean('hasEnded', true);
			await Patches.inputs.setString('score', collected.length + '/' + ingredients.length);

			// game.crowns.forEach(
			// 	crown => crown.hidden = others.length > 0
			// );

			others = others.map((value, index) => {
				const t = MyMath.clamp((et - index * 0.5) / 3, 0, 1);
				if (t >= 0.25) value.stamp.hidden = false;
		    	return value;
			});

			collected = collected.map((value, index) => {
				const t = MyMath.clamp((et - index * 0.5) / 3, 0, 1);
				if (t >= 0.25 && index > EndState.blastIndex) {
					EndState.blastDelay = 0.4;
					EndState.blastObject.hidden = false;
					EndState.blastIndex = index;

					game.audio.final.reset();
					game.audio.final.setPlaying(true);
				}
				value.position.y = MyMath.lerp(value.position.y, EndState.clockY, t);
		    	return value;
			});

			processed = collected.concat(others);
		} 

        return randoms.concat(processed);
	},

	exit: async (fsm, game, objects) => {
		game.currentDish().sceneObject.hidden = true;
		EndState.blastObject.hidden = true;
		EndState.clockObject.hidden = false;

		TouchGestures.onTap().subscribe(() => {});

		return objects.map(value => {
			if (value.stamp != null)
				value.stamp.hidden = true;
			return value;
		});
	},
};

export default EndState;