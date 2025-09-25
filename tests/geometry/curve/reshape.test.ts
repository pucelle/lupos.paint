import {Point} from '@pucelle/ff'
import {CurvePath, LineCurve, reshapeCurvePath} from '../../../src/geometry'


// function expectCloseTo(o: any, compare: any) {
// 	if (Array.isArray(o)) {
// 		for (let i = 0; i < o.length; i++) {
// 			expectCloseTo(o[i], compare[i])
// 		}
// 	}
// 	else if (typeof o === 'object') {
// 		for (let key of Object.keys(o)) {
// 			expectCloseTo((o as any)[key], compare[key])
// 		}
// 	}
// 	else {
// 		expect(o).toBeCloseTo(compare)
// 	}
// }


describe('Test CurvePath reshape', () => {
	
	test('Reshape CurvePath', () => {
		let path = new CurvePath()
		path.addCurve(new LineCurve(new Point(0, 0), new Point(1, 0)))
		path.addCurve(new LineCurve(new Point(1, 0), new Point(1, 1)))

		let pathClosed = path.clone()
		pathClosed.closePath()

		let reshaped1 = reshapeCurvePath(path, 1, {}, {partial: [0.25, 0.75]})
		expect(reshaped1.result.toSVGPathD()).toEqual('M0.5 0L1 0L1 0.5')

		let reshaped2 = reshapeCurvePath(path, 1, {}, {smooth: {radius: 0.5}})
		expect(reshaped2.result.toSVGPathD()).toEqual('M0 0L0.5 0C0.8255 0 1 0.1745 1 0.5L1 1')

		let reshaped3 = reshapeCurvePath(pathClosed, 1, {}, {smooth: {radius: 0.5}})
		expect(reshaped3.result.toSVGPathD()).toEqual(
			'M0.3536 0.3536C0.1584 0.1584 0.224 0 0.5 0L0.5 0C0.776 0 1 0.224 1 0.5L1 0.5C1 0.776 0.8416 0.8416 0.6464 0.6464L0.3536 0.3536Z'
		)

		let reshaped4 = reshapeCurvePath(pathClosed, 1, {}, {smooth: {radius: 1}})
		expect(reshaped4.result.toSVGPathD()).toEqual(
			'M0.3536 0.3536C0.1584 0.1584 0.224 0 0.5 0L0.5 0C0.776 0 1 0.224 1 0.5L1 0.5C1 0.776 0.8416 0.8416 0.6464 0.6464L0.3536 0.3536Z'
		)

		// let reshaped5 = reshapeCurvePath(pathClosed, 1, {}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		// expect(reshaped5.result.toSVGPathD()).toEqual(
		// 	'M0.3536 0.3536C0.1584 0.1584 0.224 0 0.5 0L0.5 0C0.776 0 1 0.224 1 0.5L1 0.5C1 0.776 0.8416 0.8416 0.6464 0.6464L0.3536 0.3536Z'
		// )
	})
})