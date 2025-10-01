import {Matrix} from '@pucelle/ff'
import {TransformComponents, TransformComponentData} from '../../../src/geometry/transform'


function expectCloseTo(o: any, compare: any) {
	if (Array.isArray(o) && Array.isArray(compare)) {
		for (let i = 0; i < compare.length; i++) {
			expectCloseTo(o[i], compare[i])
		}
	}
	else if (typeof o === 'object' && typeof compare === 'object') {
		for (let key of Object.keys(compare)) {
			expectCloseTo((o as any)[key], (compare as any)[key])
		}
	}
	else {
		expect(o).toBeCloseTo(compare)
	}
}


describe('Test Transform Component', () => {
	
	test('makeMatrix: translate only', () => {
		let data: TransformComponentData = { translate: [10, 20] }
		let m = TransformComponents.toMatrix(data)

		let expected = Matrix.i().translateSelf(10, 20)
		expectCloseTo(m, expected)
	})

	test('makeMatrix: scale with origin', () => {
		let data: TransformComponentData = { origin: [5, 6], scale: [2, 3] }
		let m = TransformComponents.toMatrix(data)

		let expected = Matrix.i()
			.translateSelf(-5, -6)
			.scaleSelf(2, 3)
			.translateSelf(5, 6)

		expectCloseTo(m, expected)
	})

	test('makeMatrix: rotation about origin', () => {
		let data: TransformComponentData = { origin: [10, 10], rotate: 90 }
		let m = TransformComponents.toMatrix(data)

		let expected = Matrix.i()
			.translateSelf(-10, -10)
			.rotateInDegreeSelf(90)
			.translateSelf(10, 10)

		expectCloseTo(m, expected)
	})
	
	
	test('makeMatrix: skew with axis and origin', () => {
		let data: TransformComponentData = { origin: [4, 2], skewAxis: 45, skew: 15 }
		let m = TransformComponents.toMatrix(data)

		let expected = Matrix.i()
			.translateSelf(-4, -2)
			.rotateInDegreeSelf(45)
			.skewInDegreeSelf(0, 15)
			.rotateInDegreeSelf(-45)
			.translateSelf(4, 2)

		expectCloseTo(m, expected)
	})

	test('makeMatrix: skew with axis and rotation', () => {
		let data: TransformComponentData = { skewAxis: 30, skew: 30, rotate: 45 }
		let m = TransformComponents.toMatrix(data)

		let expected = Matrix.i()
			.rotateInDegreeSelf(30)
			.skewInDegreeSelf(0, 30)
			.rotateInDegreeSelf(-30)
			.rotateInDegreeSelf(45)

		expectCloseTo(m, expected)
	})

	test.only('fromMatrix: recovers components for translate+scale+rotation+skew', () => {
		let data: TransformComponentData = {
			origin: [7, 8],
			translate: [5, -2],
			scale: [1.5, 0.75],
			rotate: 30,
			skew: 30,
			skewAxis: 0,
		}

		let m = TransformComponents.toMatrix(data)
		console.log(m)
		let recovered = TransformComponents.fromMatrix(m, data.origin)

		expectCloseTo(recovered, data)
	})
})