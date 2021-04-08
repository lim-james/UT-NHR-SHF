const Random = require('Random');

import MyMath from './MyMath';

const Bounds = {
	min: {
		x: -0.075,
		y: -0.3,
	},
	max: {
		x: 0.075,
		y: 0.3,
	},
};

const Rand = {
	range: (min, max) => (max - min) * Random.random() + min,
	irange: (min, max) => Math.round((max - min) * Random.random() + min),
	srange: (min, max, s) => MyMath.sround(Random.random(), s) * (max - min) + min,
};

const G = {
	dt: 10,
};

G.step = G.dt * 0.01;

export { Bounds, Rand, G };