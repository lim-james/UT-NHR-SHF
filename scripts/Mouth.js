const FaceTracking = require('FaceTracking');
const Patches = require('Patches');
const Diagnostics = require('Diagnostics');

import Screen from './Screen';
import Physics from './Physics';

// Face tracking members

const faces = [FaceTracking.face(0), FaceTracking.face(1)];

const mouthPoints = faces.map(face => ({
	left: face.mouth.leftCorner,
	right: face.mouth.rightCorner,
	top: face.mouth.upperLipCenter,
	bottom: face.mouth.lowerLipCenter,
}));

const Mouth = {
	mouths: [
		{
			isOpen: false,
			isClose: false,
		},
		{
			isOpen: false,
			isClose: false,
		}
	]
};

Mouth.isInside = (mouth, item, size) => {
	const pourcent = (size * 0.5) / (Screen.height / Screen.scale);
	const ratioToAddSub = pourcent * 0.5;

	const itemX = item.transform.position.x.pinLastValue();
	const itemY = item.transform.position.y.pinLastValue();

	const itemLeft = itemX - ratioToAddSub;
	const itemRight = itemX + ratioToAddSub;
	const itemTop = itemY + ratioToAddSub;
	const itemBottom = itemY - ratioToAddSub;

	const leftX = mouth.left.x.pinLastValue();
	const leftY = mouth.left.y.pinLastValue();

	const rightX = mouth.right.x.pinLastValue();
	const rightY = mouth.right.y.pinLastValue();

	const topX = mouth.top.x.pinLastValue();
	const topY = mouth.top.y.pinLastValue();

	const bottomX = mouth.bottom.x.pinLastValue();
	const bottomY = mouth.bottom.y.pinLastValue();

	const checkLeftBox = Physics.inBounds(
		leftX,
		leftY,
		itemLeft,
		itemRight,
		itemTop,
		itemBottom
	);
	const checkRigttBox = Physics.inBounds(
		rightX,
		rightY,
		itemLeft,
		itemRight,
		itemTop,
		itemBottom
	);
	const checkTopBox = Physics.inBounds(
		topX,
		topY,
		itemLeft,
		itemRight,
		itemTop,
		itemBottom
	);
	const checkBottomBox = Physics.inBounds(
		bottomX,
		bottomY,
		itemLeft,
		itemRight,
		itemTop,
		itemBottom
	);

	return checkLeftBox || checkRigttBox || checkTopBox || checkBottomBox;
}

const getMouthEvent = index => {
	return event => {
		if (event.newValue > 0.4) {
			// When the mouth is open, we update the position of each corner and send it back to Spark AR.
			mouthPoints.forEach((point, index) => {
				Patches.inputs.setPoint('mouthLeft' + index, point.left);
				Patches.inputs.setPoint('mouthRight' + index, point.right);
				Patches.inputs.setPoint('mouthTop' + index, point.top);
				Patches.inputs.setPoint('mouthBottom' + index, point.bottom);
			});

			if (!Mouth.mouths[index].isOpen) {
				Mouth.mouths[index].isOpen = true;
			}
		} else {
			if (Mouth.mouths[index].isOpen) {
				Mouth.mouths[index].isClose = true;
				Mouth.mouths[index].isOpen = false;
			}
		}
	}
};

FaceTracking.face(0).mouth.openness.monitor().subscribe(getMouthEvent(0));
FaceTracking.face(1).mouth.openness.monitor().subscribe(getMouthEvent(1));

(async () => {
	await Mouth.mouths.forEach(async (mouth, index) => {
		mouth.left = await Patches.outputs.getVector('leftMouthPoint' + index);
		mouth.right = await Patches.outputs.getVector('rightMouthPoint' + index);
		mouth.top = await Patches.outputs.getVector('topMouthPoint' + index);
		mouth.bottom = await Patches.outputs.getVector('bottomMouthPoint' + index);
	});
})();

export default Mouth;

