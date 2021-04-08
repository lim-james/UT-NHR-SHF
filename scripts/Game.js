const Patches = require('Patches');
const Diagnostics = require('Diagnostics');

import { randomisePosition } from './Food';
import InitState from './InitState';

///
/// game properties
///

const DISHES = [
	{
		key: 'tong_sui',
		ingredients: ['snow_fungus', 'rock_sugar', 'dried_red_dates', 'goji_berries', 'longan'],
		wrongDishes: ['sweet_potato', 'snowman', 'chocolate']
	},
	{
		key: 'nasi_ulam',
		ingredients: ['rice', 'lemongrass', 'shallots', 'mint_leaves', 'dried_shrimps'],
		wrongDishes: ['mango', 'cookies', 'milk']
	},
	{
		key: 'rasam',
		ingredients: ['garlic', 'tomato', 'cumin', 'peppercorn', 'curry_leaves'],
		wrongDishes: ['lemongrass_wrong', 'cheese', 'cupcake']
	}
];

///
/// game helper methods
///

const setFoodPatches = object => {
	object.sceneObject.transform.x = object.position.x;
	object.sceneObject.transform.y = object.position.y;
};

///
/// game methods
///

const Game = {
	et: 0,
	duration: 15,

	currentDish : () => Game.dishes[Game.dishIndex.pinLastValue()],
	isIngredient: item => Game.currentDish().ingredients.includes(item.key),
	isInGame: item => Game.currentDish().ingredients.includes(item.key) || Game.currentDish().wrongDishes.includes(item.key),

	randomisePosition: object => {
		if (Game.isIngredient(object))
			return randomisePosition(object, 2, 1);
		else
			return randomisePosition(object, 5, 2);
	},

	collected: [],
};

(async () => {
	Game.dishIndex = await Patches.outputs.getScalar('dishIndex');
	Game.isRecording = await Patches.outputs.getBoolean('isRecording');
})();

const FSM = {
	state: InitState,
	queuedState: null,

	init: async objects => {
		return FSM.state.enter(FSM, Game, objects);
	},

	update: async (objects, dt) => {
		let processed = objects;

		if (FSM.queuedState != null) {
			const next = FSM.queuedState;
			FSM.queuedState = null;

			const exited = await FSM.state.exit(FSM, Game, objects);
			processed = await next.enter(FSM, Game, exited);
			// swap states
			FSM.state = next;
		} 

		return FSM.state.update(FSM, Game, processed, dt);
	},

	postUpdate: async objects => {
		// set food porperties
		objects.forEach(setFoodPatches);
		return objects;
	},
};

export default FSM;
export { DISHES };

