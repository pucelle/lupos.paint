import {Point} from '@pucelle/ff'
import {ArcCurve, CubicBezierCurve} from '../../../src/geometry'


describe('Test Curve', () => {
	
	
	// Arc new cost: 100ns
	test('Arc', () => {
		let arc1 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 0, 1)
		expect(arc1.center.x).toBeCloseTo(0)
		expect(arc1.center.y).toBeCloseTo(0)
		expect(arc1.startAngle).toBeCloseTo(0)
		expect(arc1.endAngle).toBeCloseTo(Math.PI / 2)

		expect(arc1.getLengths(4)[0]).toBeCloseTo(Math.PI / 8)
		expect(arc1.getLengths(4)[1]).toBeCloseTo(Math.PI / 4)
		expect(arc1.getLengths(4)[2]).toBeCloseTo(Math.PI * 3/8)
		expect(arc1.getLengths(4)[3]).toBeCloseTo(Math.PI / 2)
		expect(arc1.getLength()).toBeCloseTo(Math.PI / 2)

		expect(arc1.mapU2T(0)).toBeCloseTo(0)
		expect(arc1.mapU2T(0.5)).toBeCloseTo(0.5)
		expect(arc1.mapU2T(1)).toBeCloseTo(1)

		expect(arc1.tAtLength(0)).toBeCloseTo(0)
		expect(arc1.tAtLength(Math.PI / 4)).toBeCloseTo(0.5)
		expect(arc1.tAtLength(Math.PI / 2)).toBeCloseTo(1)

		expect(arc1.tangentAt(0).x).toBeCloseTo(0)
		expect(arc1.tangentAt(0).y).toBeCloseTo(Math.PI / 2)
		expect(arc1.tangentAt(0.5).x).toBeCloseTo(-Math.sqrt(0.5) * Math.PI / 2)
		expect(arc1.tangentAt(0.5).y).toBeCloseTo(Math.sqrt(0.5) * Math.PI / 2)
		expect(arc1.tangentAt(1).x).toBeCloseTo(-Math.PI / 2)
		expect(arc1.tangentAt(1).y).toBeCloseTo(0)

		expect(arc1.normalAt(0, 0).x).toBeCloseTo(1)
		expect(arc1.normalAt(0, 0).y).toBeCloseTo(0)
		expect(arc1.normalAt(0.5, 0).x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.normalAt(0.5, 0).y).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.normalAt(1, 0).x).toBeCloseTo(0)
		expect(arc1.normalAt(1, 0).y).toBeCloseTo(1)

		expect(arc1.normalAt(0, 1).x).toBeCloseTo(-1)
		expect(arc1.normalAt(0, 1).y).toBeCloseTo(0)
		expect(arc1.normalAt(0.5, 1).x).toBeCloseTo(-Math.sqrt(0.5))
		expect(arc1.normalAt(0.5, 1).y).toBeCloseTo(-Math.sqrt(0.5))
		expect(arc1.normalAt(1, 1).x).toBeCloseTo(0)
		expect(arc1.normalAt(1, 1).y).toBeCloseTo(-1)

		expect(arc1.curvatureAt(0)).toBeCloseTo(1)
		expect(arc1.curvatureAt(0.5)).toBeCloseTo(1)
		expect(arc1.curvatureAt(1)).toBeCloseTo(1)

		expect(arc1.spacedPointAt(0).x).toBeCloseTo(1)
		expect(arc1.spacedPointAt(0).y).toBeCloseTo(0)
		expect(arc1.spacedPointAt(0.5).x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.spacedPointAt(0.5).y).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.spacedPointAt(1).x).toBeCloseTo(0)
		expect(arc1.spacedPointAt(1).y).toBeCloseTo(1)

		expect(arc1.pointAt(0).x).toBeCloseTo(1)
		expect(arc1.pointAt(0).y).toBeCloseTo(0)
		expect(arc1.pointAt(0.5).x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.pointAt(0.5).y).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.pointAt(1).x).toBeCloseTo(0)
		expect(arc1.pointAt(1).y).toBeCloseTo(1)

		expect(arc1.pointAtLength(0).x).toBeCloseTo(1)
		expect(arc1.pointAtLength(0).y).toBeCloseTo(0)
		expect(arc1.pointAtLength(0.5 * Math.PI / 2).x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.pointAtLength(0.5 * Math.PI / 2).y).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.pointAtLength(Math.PI / 2).x).toBeCloseTo(0)
		expect(arc1.pointAtLength(Math.PI / 2).y).toBeCloseTo(1)

		expect(arc1.getPoints(2)[0].x).toBeCloseTo(1)
		expect(arc1.getPoints(2)[0].y).toBeCloseTo(0)
		expect(arc1.getPoints(2)[1].x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.getPoints(2)[1].y).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.getPoints(2)[2].x).toBeCloseTo(0)
		expect(arc1.getPoints(2)[2].y).toBeCloseTo(1)

		expect(arc1.getSpacedPoints(2)[0].x).toBeCloseTo(1)
		expect(arc1.getSpacedPoints(2)[0].y).toBeCloseTo(0)
		expect(arc1.getSpacedPoints(2)[1].x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.getSpacedPoints(2)[1].y).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.getSpacedPoints(2)[2].x).toBeCloseTo(0)
		expect(arc1.getSpacedPoints(2)[2].y).toBeCloseTo(1)

		expect(arc1.getSpacedTs(2)[0]).toBeCloseTo(0)
		expect(arc1.getSpacedTs(2)[1]).toBeCloseTo(0.5)
		expect(arc1.getSpacedTs(2)[2]).toBeCloseTo(1)

		expect(arc1.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(12)
		expect(arc1.getCurvatureAdaptiveTs(0.25, 1000).length).toEqual(36)

		expect(arc1.partOf(0.25, 0.75).startAngle).toBeCloseTo(Math.PI / 8)
		expect(arc1.partOf(0.25, 0.75).endAngle).toBeCloseTo(Math.PI * 3/8)

		expect(arc1.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expect(arc1.closestPointTo(new Point(1, 1)).x).toBeCloseTo(Math.sqrt(0.5))
		expect(arc1.closestPointTo(new Point(1, 1)).y).toBeCloseTo(Math.sqrt(0.5))


		let arc2 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 0, 0)
		expect(arc2.center.x).toBeCloseTo(1)
		expect(arc2.center.y).toBeCloseTo(1)
		expect(arc2.startAngle).toBeCloseTo(-Math.PI * 0.5)
		expect(arc2.endAngle).toBeCloseTo(-Math.PI)

		let arc3 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 1, 1)
		expect(arc3.center.x).toBeCloseTo(1)
		expect(arc3.center.y).toBeCloseTo(1)
		expect(arc3.startAngle).toBeCloseTo(-Math.PI * 0.5)
		expect(arc3.endAngle).toBeCloseTo(Math.PI)

		let arc4 = new ArcCurve(new Point(1, 0), new Point(0, 1), 1, 1, 0)
		expect(arc4.center.x).toBeCloseTo(0)
		expect(arc4.center.y).toBeCloseTo(0)
		expect(arc4.startAngle).toBeCloseTo(0)
		expect(arc4.endAngle).toBeCloseTo(-Math.PI * 3/2)
	})


	test.only('CubicBezier', () => {
		let bezier = new CubicBezierCurve(new Point(0, 0), new Point(1, 1), new Point(0.5, 0), new Point(1, 0.5))

		expect(bezier.getLength()).toBeCloseTo(1.5477503448916046)

		expect(bezier.mapU2T(0)).toBeCloseTo(0)
		expect(bezier.mapU2T(0.25)).toBeCloseTo(0.2545823183754293)
		expect(bezier.mapU2T(0.5)).toBeCloseTo(0.5)
		expect(bezier.mapU2T(0.75)).toBeCloseTo(0.7454176816245704)
		expect(bezier.mapU2T(1)).toBeCloseTo(1)
		expect(bezier.mapT2U(0.2545823183754293)).toBeCloseTo(0.25)
		expect(bezier.mapT2U(0.7454176816245704)).toBeCloseTo(0.75)

		expect(bezier.tAtLength(0)).toBeCloseTo(0)

		expect(bezier.tangentAt(0).x).toBeCloseTo(1.5)
		expect(bezier.tangentAt(0).y).toBeCloseTo(0)
		expect(bezier.tangentAt(0.5).x).toBeCloseTo(1.125)
		expect(bezier.tangentAt(0.5).y).toBeCloseTo(1.125)
		expect(bezier.tangentAt(1).x).toBeCloseTo(0)
		expect(bezier.tangentAt(1).y).toBeCloseTo(1.5)

		expect(bezier.normalAt(0, 0).x).toBeCloseTo(0)
		expect(bezier.normalAt(0, 0).y).toBeCloseTo(1)
		expect(bezier.normalAt(0.5, 0).x).toBeCloseTo(-Math.sqrt(0.5))
		expect(bezier.normalAt(0.5, 0).y).toBeCloseTo(Math.sqrt(0.5))
		expect(bezier.normalAt(1, 0).x).toBeCloseTo(-1)
		expect(bezier.normalAt(1, 0).y).toBeCloseTo(0)

		expect(bezier.normalAt(0, 1).x).toBeCloseTo(0)
		expect(bezier.normalAt(0, 1).y).toBeCloseTo(-1)
		expect(bezier.normalAt(0.5, 1).x).toBeCloseTo(Math.sqrt(0.5))
		expect(bezier.normalAt(0.5, 1).y).toBeCloseTo(-Math.sqrt(0.5))
		expect(bezier.normalAt(1, 1).x).toBeCloseTo(1)
		expect(bezier.normalAt(1, 1).y).toBeCloseTo(0)

		expect(bezier.curvatureAt(0)).toBeCloseTo(1.333332223555609)
		expect(bezier.curvatureAt(0.5)).toBeCloseTo(0.8380526676330599)
		expect(bezier.curvatureAt(1)).toBeCloseTo(1.333332223555609)

		expect(bezier.spacedPointAt(0).x).toBeCloseTo(0)
		expect(bezier.spacedPointAt(0).y).toBeCloseTo(0)
		expect(bezier.spacedPointAt(0.5).x).toBeCloseTo(0.6875)
		expect(bezier.spacedPointAt(0.5).y).toBeCloseTo(0.3125)
		expect(bezier.spacedPointAt(1).x).toBeCloseTo(1)
		expect(bezier.spacedPointAt(1).y).toBeCloseTo(1)

		expect(bezier.pointAt(0).x).toBeCloseTo(0)
		expect(bezier.pointAt(0).y).toBeCloseTo(0)
		expect(bezier.pointAt(0.5).x).toBeCloseTo(0.6875)
		expect(bezier.pointAt(0.5).y).toBeCloseTo(0.3125)
		expect(bezier.pointAt(1).x).toBeCloseTo(1)
		expect(bezier.pointAt(1).y).toBeCloseTo(1)

		expect(bezier.pointAtLength(0).x).toBeCloseTo(0)
		expect(bezier.pointAtLength(0).y).toBeCloseTo(0)
		expect(bezier.pointAtLength(0.5).x).toBeCloseTo(0.472999654986354)
		expect(bezier.pointAtLength(0.5).y).toBeCloseTo(0.14289991717470202)
		expect(bezier.pointAtLength(1).x).toBeCloseTo(0.8313143760625261)
		expect(bezier.pointAtLength(1).y).toBeCloseTo(0.48686041210119274)

		expect(bezier.getPoints(2)[0].x).toBeCloseTo(0)
		expect(bezier.getPoints(2)[0].y).toBeCloseTo(0)
		expect(bezier.getPoints(2)[1].x).toBeCloseTo(0.6875)
		expect(bezier.getPoints(2)[1].y).toBeCloseTo(0.3125)
		expect(bezier.getPoints(2)[2].x).toBeCloseTo(1)
		expect(bezier.getPoints(2)[2].y).toBeCloseTo(1)

		expect(bezier.getSpacedPoints(2)[0].x).toBeCloseTo(0)
		expect(bezier.getSpacedPoints(2)[0].y).toBeCloseTo(0)
		expect(bezier.getSpacedPoints(2)[1].x).toBeCloseTo(0.6875)
		expect(bezier.getSpacedPoints(2)[1].y).toBeCloseTo(0.3125)
		expect(bezier.getSpacedPoints(2)[2].x).toBeCloseTo(1)
		expect(bezier.getSpacedPoints(2)[2].y).toBeCloseTo(1)

		expect(bezier.getSpacedTs(2)[0]).toBeCloseTo(0)
		expect(bezier.getSpacedTs(2)[1]).toBeCloseTo(0.5)
		expect(bezier.getSpacedTs(2)[2]).toBeCloseTo(1)

		expect(bezier.getCurvatureAdaptiveTs(0.25, 100).length).toEqual(11)
		expect(bezier.getCurvatureAdaptiveTs(0.25, 1000).length).toEqual(35)

		expect(bezier.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expect(bezier.closestPointTo(new Point(1, 0)).x).toBeCloseTo(0.6875)
		expect(bezier.closestPointTo(new Point(1, 0)).y).toBeCloseTo(0.3125)
	})
})