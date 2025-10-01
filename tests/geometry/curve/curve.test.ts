import {Point, Vector} from '@pucelle/ff'
import {ArcCurve, CubicBezierCurve, EllipseCurve, LineCurve, QuadraticBezierCurve} from '../../../src/geometry'


function expectCloseTo(o: any, compare: any) {
	if (Array.isArray(o)) {
		for (let i = 0; i < compare.length; i++) {
			expectCloseTo(o[i], compare[i] as any)
		}
	}
	else if (typeof o === 'object') {
		for (let key of Object.keys(o)) {
			expectCloseTo((o as any)[key], compare[key])
		}
	}
	else {
		expect(o).toBeCloseTo(compare)
	}
}


describe('Test Curve', () => {
	
	// Arc new cost: 100ns
	test('Arc', () => {
		let arc1 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 0, 1)
		expectCloseTo(arc1.center, {x: 0, y: 0})
		expect(arc1.startAngle).toBeCloseTo(0)
		expect(arc1.endAngle).toBeCloseTo(Math.PI / 2)

		expectCloseTo(arc1.getLengths(4), [Math.PI / 8, Math.PI / 4, Math.PI * 3/8, Math.PI / 2])
		expect(arc1.getLength()).toBeCloseTo(Math.PI / 2)

		expect(arc1.mapU2T(0)).toBeCloseTo(0)
		expect(arc1.mapU2T(0.5)).toBeCloseTo(0.5)
		expect(arc1.mapU2T(1)).toBeCloseTo(1)

		expectCloseTo(arc1.pointAt(0), {x: 1, y: 0})
		expectCloseTo(arc1.pointAt(0.5), {x: Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(arc1.pointAt(1), {x: 0, y: 1})

		expectCloseTo(arc1.spacedPointAt(0), {x: 1, y: 0})
		expectCloseTo(arc1.spacedPointAt(0.5), {x: Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(arc1.spacedPointAt(1), {x: 0, y: 1})

		expectCloseTo(arc1.getPoints(2), [{x: 1, y: 0}, {x: Math.sqrt(0.5), y: Math.sqrt(0.5)}, {x: 0, y: 1}])
		expectCloseTo(arc1.getSpacedPoints(2), [{x: 1, y: 0}, {x: Math.sqrt(0.5), y: Math.sqrt(0.5)}, {x: 0, y: 1}])

		expectCloseTo(arc1.getSpacedTs(2), [0, 0.5, 1])

		expectCloseTo(arc1.tangentAt(0), {x: 0, y: Math.PI / 2})
		expectCloseTo(arc1.tangentAt(0.5), {x: -Math.sqrt(0.5) * Math.PI / 2, y: Math.sqrt(0.5) * Math.PI / 2})
		expectCloseTo(arc1.tangentAt(1), {x: -Math.PI / 2, y: 0})

		expectCloseTo(arc1.normalAt(0, 0), {x: 1, y: 0})
		expectCloseTo(arc1.normalAt(0.5, 0), {x: Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(arc1.normalAt(1, 0), {x: 0, y: 1})

		expectCloseTo(arc1.normalAt(0, 1), {x: -1, y: 0})
		expectCloseTo(arc1.normalAt(0.5, 1), {x: -Math.sqrt(0.5), y: -Math.sqrt(0.5)})
		expectCloseTo(arc1.normalAt(1, 1), {x: 0, y: -1})

		expect(arc1.curvatureAt()).toBeCloseTo(1)

		expect(arc1.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(12)
		expect(arc1.getCurvatureAdaptiveTs(0.25, 1000).length).toEqual(36)

		expect(arc1.partOf(0.25, 0.75).startAngle).toBeCloseTo(Math.PI / 8)
		expect(arc1.partOf(0.25, 0.75).endAngle).toBeCloseTo(Math.PI * 3/8)

		expect(arc1.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expectCloseTo(arc1.closestPointTo(new Point(1, 1)), {x: Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(arc1.calcTsByX(0.5), [0.6666666666666667])
		expectCloseTo(arc1.calcTsByY(0.5), [0.3333333333333333])


		let arc2 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 0, 0)
		expectCloseTo(arc2.center, {x: 1, y: 1})
		expect(arc2.startAngle).toBeCloseTo(-Math.PI * 0.5)
		expect(arc2.endAngle).toBeCloseTo(-Math.PI)

		let arc3 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 1, 1)
		expectCloseTo(arc3.center, {x: 1, y: 1})
		expect(arc3.startAngle).toBeCloseTo(-Math.PI * 0.5)
		expect(arc3.endAngle).toBeCloseTo(Math.PI)

		let arc4 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 1, 0)
		expectCloseTo(arc4.center, {x: 0, y: 0})
		expect(arc4.startAngle).toBeCloseTo(0)
		expect(arc4.endAngle).toBeCloseTo(-Math.PI * 3/2)
	})


	test('Ellipse', () => {
		let ell1 = new EllipseCurve(new Point(2, 0), new Point(0, 1), new Vector(2, 1), 0, 0, 1)
		expectCloseTo(ell1.center, {x: 0, y: 0})
		expect(ell1.startAngle).toBeCloseTo(0)
		expect(ell1.endAngle).toBeCloseTo(Math.PI / 2)

		expectCloseTo(ell1.getLengths(4), [0.4118542359737571, 0.9533449673146714, 1.637444713520599, 2.4065875891929966])
		expect(ell1.getLength()).toBeCloseTo(2.4203831656557377)

		expect(ell1.mapU2T(0)).toBeCloseTo(0)
		expect(ell1.mapU2T(0.5)).toBeCloseTo(0.5946432557626)
		expect(ell1.mapU2T(1)).toBeCloseTo(1)

		expectCloseTo(ell1.pointAt(0), {x: 2, y: 0})
		expectCloseTo(ell1.pointAt(0.5), {x: 1.4142135623730951, y: 0.7071067811865476})
		expectCloseTo(ell1.pointAt(1), {x: 0, y: 1})

		expectCloseTo(ell1.spacedPointAt(0), {x: 2, y: 0})
		expectCloseTo(ell1.spacedPointAt(0.5), {x: 1.1891434392245825, y: 0.8040425798658197})
		expectCloseTo(ell1.spacedPointAt(1), {x: 0, y: 1})

		expectCloseTo(ell1.getPoints(2), [{x: 2, y: 0}, {x: 1.4142135623730951, y: 0.7071067811865476}, {x: 0, y: 1}])
		expectCloseTo(ell1.getSpacedPoints(2), [{x: 2, y: 0}, {x: 1.1891434392245825, y: 0.8040425798658197}, {x: 0, y: 1}])

		expectCloseTo(ell1.getSpacedTs(2), [0, 0.5946432557626, 1])

		expectCloseTo(ell1.tangentAt(0), {x: 0, y: Math.PI / 2})
		expectCloseTo(ell1.tangentAt(0.5), {x: -2.221441469079183, y: 1.1107207345395915})
		expectCloseTo(ell1.tangentAt(1), {x: -Math.PI, y: 0})

		expectCloseTo(ell1.normalAt(0, 0), {x: 1, y: 0})
		expectCloseTo(ell1.normalAt(0.5, 0), {x: 0.4472135954999578, y: 0.8944271909999159})
		expectCloseTo(ell1.normalAt(1, 0), {x: 0, y: 1})

		expectCloseTo(ell1.normalAt(0, 1), {x: -1, y: 0})
		expectCloseTo(ell1.normalAt(0.5, 1), {x: -0.4472135954999578, y: -0.8944271909999159})
		expectCloseTo(ell1.normalAt(1, 1), {x: 0, y: -1})

		expect(ell1.curvatureAt(0)).toBeCloseTo(2.00000123373067)
		expect(ell1.curvatureAt(0.5)).toBeCloseTo(0.505964737710498)
		expect(ell1.curvatureAt(1)).toBeCloseTo(0.2500001541922253)

		expect(ell1.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(15)
		expect(ell1.getCurvatureAdaptiveTs(0.25, 1000).length).toEqual(45)

		expect(ell1.partOf(0.25, 0.75).startAngle).toBeCloseTo(Math.PI / 8)
		expect(ell1.partOf(0.25, 0.75).endAngle).toBeCloseTo(Math.PI * 3/8)

		expect(ell1.getBox()).toEqual({x: 0, y: 0, width: 2, height: 1})
		expectCloseTo(ell1.closestPointTo(new Point(2, 1)), {x: 1.679531366454796, y: 0.5429489822014787})
		expectCloseTo(ell1.calcTsByX(0.5), [0.839111328125])
		expectCloseTo(ell1.calcTsByY(0.5), [0.3333333333333333])

		let arc2 = new EllipseCurve(new Point(2, 0), new Point(0, 1), new Vector(2, 1), 0, 0, 0)
		expectCloseTo(arc2.center, {x: 2, y: 1})
		expect(arc2.startAngle).toBeCloseTo(-Math.PI * 0.5)
		expect(arc2.endAngle).toBeCloseTo(-Math.PI)

		let arc3 = new EllipseCurve(new Point(2, 0), new Point(0, 1), new Vector(2, 1), 0, 1, 1)
		expectCloseTo(arc3.center, {x: 2, y: 1})
		expect(arc3.startAngle).toBeCloseTo(-Math.PI * 0.5)
		expect(arc3.endAngle).toBeCloseTo(Math.PI)

		let arc4 = new EllipseCurve(new Point(2, 0), new Point(0, 1), new Vector(2, 1), 0, 1, 0)
		expectCloseTo(arc4.center, {x: 0, y: 0})
		expect(arc4.startAngle).toBeCloseTo(0)
		expect(arc4.endAngle).toBeCloseTo(-Math.PI * 3/2)
	})


	test('CubicBezier', () => {
		let bezier = new CubicBezierCurve(new Point(0, 0), new Point(1, 1), new Point(0.5, 0), new Point(1, 0.5))

		expect(bezier.getLength()).toBeCloseTo(1.5477503448916046)

		expect(bezier.mapU2T(0)).toBeCloseTo(0)
		expect(bezier.mapU2T(0.25)).toBeCloseTo(0.2545823183754293)
		expect(bezier.mapU2T(0.5)).toBeCloseTo(0.5)
		expect(bezier.mapU2T(0.75)).toBeCloseTo(0.7454176816245704)
		expect(bezier.mapU2T(1)).toBeCloseTo(1)
		expect(bezier.mapT2U(0.2545823183754293)).toBeCloseTo(0.25)
		expect(bezier.mapT2U(0.7454176816245704)).toBeCloseTo(0.75)

		expectCloseTo(bezier.pointAt(0), {x: 0, y: 0})
		expectCloseTo(bezier.pointAt(0.5), {x: 0.6875, y: 0.3125})
		expectCloseTo(bezier.pointAt(1), {x: 1, y: 1})

		expectCloseTo(bezier.spacedPointAt(0), {x: 0, y: 0})
		expectCloseTo(bezier.spacedPointAt(0.5), {x: 0.6875, y: 0.3125})
		expectCloseTo(bezier.spacedPointAt(1), {x: 1, y: 1})

		expectCloseTo(bezier.getPoints(2), [{x: 0, y: 0}, {x: 0.6875, y: 0.3125}, {x: 1, y: 1}])
		expectCloseTo(bezier.getSpacedPoints(2), [{x: 0, y: 0}, {x: 0.6875, y: 0.3125}, {x: 1, y: 1}])

		expectCloseTo(bezier.getSpacedTs(2), [0, 0.5, 1])

		expectCloseTo(bezier.tangentAt(0), {x: 1.5, y: 0})
		expectCloseTo(bezier.tangentAt(0.5), {x: 1.125, y: 1.125})
		expectCloseTo(bezier.tangentAt(1), {x: 0, y: 1.5})

		expectCloseTo(bezier.normalAt(0, 0), {x: 0, y: -1})
		expectCloseTo(bezier.normalAt(0.5, 0), {x: Math.sqrt(0.5), y: -Math.sqrt(0.5)})
		expectCloseTo(bezier.normalAt(1, 0), {x: 1, y: 0})

		expectCloseTo(bezier.normalAt(0, 1), {x: 0, y: 1})
		expectCloseTo(bezier.normalAt(0.5, 1), {x: -Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(bezier.normalAt(1, 1), {x: -1, y: 0})

		expect(bezier.curvatureAt(0)).toBeCloseTo(1.333332223555609)
		expect(bezier.curvatureAt(0.5)).toBeCloseTo(0.8380526676330599)
		expect(bezier.curvatureAt(1)).toBeCloseTo(1.333332223555609)

		expect(bezier.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(12)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 1000).length).toEqual(35)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 100)[0]).toBeCloseTo(0)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 100)[1]).toBeCloseTo(0.08097938283969396)

		expect(bezier.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expectCloseTo(bezier.closestPointTo(new Point(1, 0)), {x: 0.6875, y: 0.3125})
		expectCloseTo(bezier.calcTsByX(0.5), [0.34716796875])
		expectCloseTo(bezier.calcTsByY(0.5), [0.652587890625])
		
		let bezier2 = new CubicBezierCurve(new Point(0, 0), new Point(1, 1), new Point(1, 0), new Point(1, 0))
		expect(bezier2.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(12)
		expect(bezier2.getCurvatureAdaptiveTs(0.25, 100)[1]).toBeCloseTo(0.2211637627174764)
	})


	test('QuadraticBezier', () => {
		let bezier = new QuadraticBezierCurve(new Point(0, 0), new Point(1, 1), new Point(1, 0))

		expect(bezier.getLength()).toBeCloseTo(1.622067130107502)

		expect(bezier.mapU2T(0)).toBeCloseTo(0)
		expect(bezier.mapU2T(0.25)).toBeCloseTo(0.22672489827384587)
		expect(bezier.mapU2T(0.5)).toBeCloseTo(0.5)
		expect(bezier.mapU2T(0.75)).toBeCloseTo(0.7732751017261541)
		expect(bezier.mapU2T(1)).toBeCloseTo(1)
		expect(bezier.mapT2U(0.22672489827384587)).toBeCloseTo(0.25)
		expect(bezier.mapT2U(0.7732751017261541)).toBeCloseTo(0.75)

		expectCloseTo(bezier.pointAt(0), {x: 0, y: 0})
		expectCloseTo(bezier.pointAt(0.5), {x: 0.75, y: 0.25})
		expectCloseTo(bezier.pointAt(1), {x: 1, y: 1})

		expectCloseTo(bezier.spacedPointAt(0), {x: 0, y: 0})
		expectCloseTo(bezier.spacedPointAt(0.5), {x: 0.75, y: 0.25})
		expectCloseTo(bezier.spacedPointAt(1), {x: 1, y: 1})

		expectCloseTo(bezier.getPoints(2), [{x: 0, y: 0}, {x: 0.75, y: 0.25}, {x: 1, y: 1}])
		expectCloseTo(bezier.getSpacedPoints(2), [{x: 0, y: 0}, {x: 0.75, y: 0.25}, {x: 1, y: 1}])

		expectCloseTo(bezier.getSpacedTs(2), [0, 0.5, 1])

		expectCloseTo(bezier.tangentAt(0), {x: 2, y: 0})
		expectCloseTo(bezier.tangentAt(0.5), {x: 1, y: 1})
		expectCloseTo(bezier.tangentAt(1), {x: 0, y: 2})

		expectCloseTo(bezier.normalAt(0, 0), {x: 0, y: -1})
		expectCloseTo(bezier.normalAt(0.5, 0), {x: Math.sqrt(0.5), y: -Math.sqrt(0.5)})
		expectCloseTo(bezier.normalAt(1, 0), {x: 1, y: 0})

		expectCloseTo(bezier.normalAt(0, 1), {x: 0, y: 1})
		expectCloseTo(bezier.normalAt(0.5, 1), {x: -Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(bezier.normalAt(1, 1), {x: -1, y: 0})

		expect(bezier.curvatureAt(0)).toBeCloseTo(0.5)
		expect(bezier.curvatureAt(0.5)).toBeCloseTo(1.4142135623953878)
		expect(bezier.curvatureAt(1)).toBeCloseTo(0.5)

		expect(bezier.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(12)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 100)[0]).toBeCloseTo(0)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 100)[1]).toBeCloseTo(0.11525460691397445)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 1000).length).toEqual(36)

		expect(bezier.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expectCloseTo(bezier.closestPointTo(new Point(1, 0)), {x: 0.75, y: 0.25})
		expectCloseTo(bezier.calcTsByX(0.5), [0.292724609375])
		expectCloseTo(bezier.calcTsByY(0.5), [0.70703125])
	})

	test('Line', () => {
		let line = new LineCurve(new Point(0, 0), new Point(1, 1))

		expect(line.getLength()).toBeCloseTo(Math.sqrt(2))

		expect(line.mapU2T(0)).toBeCloseTo(0)
		expect(line.mapU2T(0.25)).toBeCloseTo(0.25)
		expect(line.mapU2T(0.5)).toBeCloseTo(0.5)
		expect(line.mapU2T(0.75)).toBeCloseTo(0.75)
		expect(line.mapU2T(1)).toBeCloseTo(1)
		expect(line.mapT2U(0.25)).toBeCloseTo(0.25)
		expect(line.mapT2U(0.75)).toBeCloseTo(0.75)

		expectCloseTo(line.pointAt(0), {x: 0, y: 0})
		expectCloseTo(line.pointAt(0.5), {x: 0.5, y: 0.5})
		expectCloseTo(line.pointAt(1), {x: 1, y: 1})

		expectCloseTo(line.spacedPointAt(0), {x: 0, y: 0})
		expectCloseTo(line.spacedPointAt(0.5), {x: 0.5, y: 0.5})
		expectCloseTo(line.spacedPointAt(1), {x: 1, y: 1})

		expectCloseTo(line.getPoints(2), [{x: 0, y: 0}, {x: 0.5, y: 0.5}, {x: 1, y: 1}])
		expectCloseTo(line.getSpacedPoints(2), [{x: 0, y: 0}, {x: 0.5, y: 0.5}, {x: 1, y: 1}])

		expectCloseTo(line.getSpacedTs(2), [0, 0.5, 1])

		expectCloseTo(line.tangentAt(), {x: 1, y: 1})

		expectCloseTo(line.normalAt(0, 0), {x: Math.sqrt(0.5), y: -Math.sqrt(0.5)})
		expectCloseTo(line.normalAt(0.5, 0), {x: Math.sqrt(0.5), y: -Math.sqrt(0.5)})
		expectCloseTo(line.normalAt(1, 0), {x: Math.sqrt(0.5), y: -Math.sqrt(0.5)})

		expectCloseTo(line.normalAt(0, 1), {x: -Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(line.normalAt(0.5, 1), {x: -Math.sqrt(0.5), y: Math.sqrt(0.5)})
		expectCloseTo(line.normalAt(1, 1), {x: -Math.sqrt(0.5), y: Math.sqrt(0.5)})

		expect(line.curvatureAt()).toBeCloseTo(0)

		expect(line.getCurvatureAdaptiveTs().length).toEqual(2)
		expect(line.getCurvatureAdaptiveTs()[0]).toBeCloseTo(0)
		expect(line.getCurvatureAdaptiveTs()[1]).toBeCloseTo(1)

		expect(line.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expectCloseTo(line.closestPointTo(new Point(1, 0)), {x: 0.5, y: 0.5})
		expectCloseTo(line.calcTsByX(0.5), [0.5])
		expectCloseTo(line.calcTsByY(0.5), [0.5])
	})
})