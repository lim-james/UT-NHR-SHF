const MyMath = {
	lerp: (a, b, t) => (b - a) * t + a,
    clamp: (value, min, max) => Math.max(Math.min(value, max), min),
	sround: (value, segments) => Math.round(value * segments) / segments,
};

export default MyMath;