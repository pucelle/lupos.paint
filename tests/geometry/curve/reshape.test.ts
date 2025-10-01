import {Point} from '@pucelle/ff'
import {CurvePath, LineCurve, reshapeCurvePath} from '../../../src/geometry'


// function expectCloseTo(o: any, compare: any) {
// 	if (Array.isArray(o)) {
// 		for (let i = 0; i < compare.length; i++) {
// 			expectCloseTo(o[i], compare[i] as any)
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
			'M0.5 0.5C0.224 0.224 0.224 0 0.5 0L0.5 0C0.776 0 1 0.224 1 0.5L1 0.5C1 0.776 0.776 0.776 0.5 0.5L0.5 0.5Z'
		)



		let reshaped5 = reshapeCurvePath(path, 1, {}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped5.result.toSVGPathD()).toEqual(
			'M0 -0.1L1.0768 -0.0731L1.05 1L0.95 1L0.9269 0.0768L0 0.1L0 -0.1Z'
		)

		let reshaped6 = reshapeCurvePath(path, 1, {strokeLineCap: 'round'}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped6.result.toSVGPathD()).toEqual(
			'M0 -0.1L1.0768 -0.0731L1.05 1C1.0493 1.0276 1.0269 1.05 1 1.05C0.9731 1.05 0.9507 1.0276 0.95 1L0.9269 0.0768L0 0.1C-0.0552 0.1014 -0.1 0.0566 -0.1 0C-0.1 -0.0566 -0.0552 -0.1014 0 -0.1Z'
		)

		let reshaped7 = reshapeCurvePath(path, 1, {strokeLineCap: 'square'}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped7.result.toSVGPathD()).toEqual(
			'M0 -0.1L1.0768 -0.0731L1.05 1L1.0488 1.05L0.9512 1.05L0.95 1L0.9269 0.0768L0 0.1L-0.1 0.1025L-0.1 -0.1025L0 -0.1Z'
		)


		let reshaped8 = reshapeCurvePath(path, 1, {strokeLineJoin: 'miter', strokeMiterLimit: 0.5}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped8.result.toSVGPathD()).toEqual(
			'M0 -0.1L1.0768 -0.0731L1.05 1L0.95 1L0.9269 0.0768L0 0.1L0 -0.1Z'
		)

		let reshaped9 = reshapeCurvePath(path, 1, {strokeLineJoin: 'round'}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped9.result.toSVGPathD()).toEqual(
			'M0 -0.1L1 -0.075C1.0424 -0.0739 1.076 -0.0403 1.075 0L1.05 1L0.95 1L0.9269 0.0768L0 0.1L0 -0.1Z'
		)

		let reshaped10 = reshapeCurvePath(path, 1, {strokeLineJoin: 'bevel'}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped10.result.toSVGPathD()).toEqual(
			'M1 -0.075L1.075 0L1.05 1L0.95 1L0.9269 0.0768L0 0.1L0 -0.1L1 -0.075Z'
		)


		let reshaped11 = reshapeCurvePath(path, 1, {dashArray: [1]}, {gradientStroking: {startWidth: 0.2, endWidth: 0.1}})
		expect(reshaped11.result.toSVGPathD()).toEqual(
			'M0 -0.1L0.2 -0.095L0.2 0.095L0 0.1L0 -0.1ZM0.39 -0.0902L0.58 -0.0855L0.58 0.0855L0.39 0.0903L0.39 -0.0902ZM0.751 -0.0812L0.922 -0.0769L0.922 0.0769L0.751 0.0812L0.751 -0.0812ZM1.0731 0.0759L1.0693 0.2298L0.9307 0.2298L0.9269 0.0759L1.0731 0.0759ZM1.0658 0.3683L1.0623 0.5068L0.9377 0.5068L0.9342 0.3683L1.0658 0.3683ZM1.0592 0.6315L1.0561 0.7561L0.9439 0.7561L0.9408 0.6315L1.0592 0.6315ZM1.0533 0.8683L1.0505 0.9805L0.9495 0.9805L0.9467 0.8683L1.0533 0.8683Z'
		)
	})
})