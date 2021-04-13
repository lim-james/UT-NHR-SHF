const Random = require('Random');
const Scene = require('Scene');
const Diagnostics = require('Diagnostics');

import { Bounds, Rand } from './Common';

// Member methods

const isOutOfScreen = object => object.position.y < Bounds.min.y;

const randomisePosition = (object, offset = 1) => {
	object.position = {
		x: Rand.range(Bounds.min.x, Bounds.max.x),
		y: Bounds.max.y + offset * 0.1,
	};
	return object;
};

const stackObject = (object, stack) => {
	object.position = {
		x: Rand.range(Bounds.min.x, Bounds.max.x),
		y: stack.position.y + 0.1
	};

	return object;
}

const initializeObject = async (object, index) => {
	object.sceneObject = await Scene.root.findFirst(object.key);
	object.stamp = await object.sceneObject.findFirst('missed');
	return randomisePosition(object, index);
};

// Food members

const OBJECTS = [];

const addDish = dish => {
	OBJECTS.push({
		key: dish,
		position: {
			x: 0,
			y: Bounds.max.y,
		},
		physics: {
			isKinematic: false,
		},
	});
};

// tong_sui
addDish('snow_fungus');
addDish('rock_sugar');
addDish('dried_red_dates');
addDish('goji_berries');
addDish('longan');
// nasi_ulam
addDish('rice');
addDish('lemongrass'); 
addDish('shallots');
addDish('mint_leaves');
addDish('dried_shrimps');
// rasam
addDish('garlic');
addDish('tomato');
addDish('cumin');
addDish('peppercorn');
addDish('curry_leaves');
// wrong
addDish('sweet_potato');
addDish('snowman');
addDish('chocolate');
addDish('mango');
addDish('cookies');
addDish('milk');
addDish('cheese');
addDish('cupcake');
addDish('lemongrass_wrong');

const Food = {
	objects: OBJECTS,
	init: async objects => await Promise.all(objects.map(initializeObject)),
	update: (game, objects) => {
		const inBounds = objects.filter(obj => !isOutOfScreen(obj));
		const outside = objects.filter(isOutOfScreen);
		const resetted = outside.map(randomisePosition);
		return inBounds.concat(resetted);
	},
};

export default Food;
export { randomisePosition, stackObject }