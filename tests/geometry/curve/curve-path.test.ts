import {Point} from '@pucelle/ff'
import {CurvePath, LineCurve} from '../../../src/geometry'


describe('Test CurvePath', () => {
	
	test('Line', () => {
		let path = new CurvePath()
		path.addCurve(new LineCurve(new Point(0, 0), new Point(1, 0)))
		path.addCurve(new LineCurve(new Point(1, 0), new Point(1, 2)))

		expect(path.getLength()).toBeCloseTo(3)

		expect(path.mapU2T(0)).toBeCloseTo(0)
		expect(path.mapU2T(0.25)).toBeCloseTo(0.375)
		expect(path.mapU2T(0.5)).toBeCloseTo(0.625)
		expect(path.mapU2T(0.75)).toBeCloseTo(0.8125)
		expect(path.mapU2T(1)).toBeCloseTo(1)
		expect(path.mapT2U(0.375)).toBeCloseTo(0.25)
		expect(path.mapT2U(0.625)).toBeCloseTo(0.5)
		expect(path.mapT2U(0.8125)).toBeCloseTo(0.75)

		expect(path.mapGlobalT2Local(0)).toEqual({i: 0, t: 0})
		expect(path.mapGlobalT2Local(0.5)).toEqual({i: 1, t: 0})
		expect(path.mapGlobalT2Local(1)).toEqual({i: 1, t: 1})
		expect(path.mapLocalT2Global(0, 0)).toEqual(0)
		expect(path.mapLocalT2Global(1, 0)).toEqual(0.5)
		expect(path.mapLocalT2Global(1, 1)).toEqual(1)

		expect(path.mapGlobalU2Local(0)).toEqual({i: 0, u: 0})
		expect(path.mapGlobalU2Local(0.5)).toEqual({i: 1, u: 0.25})
		expect(path.mapGlobalU2Local(1)).toEqual({i: 1, u: 1})
		expect(path.mapLocalU2Global(0, 0)).toEqual(0)
		expect(path.mapLocalU2Global(1, 0.25)).toEqual(0.5)
		expect(path.mapLocalU2Global(1, 1)).toEqual(1)

		expect(path.pointAt(0).x).toBeCloseTo(0)
		expect(path.pointAt(0).y).toBeCloseTo(0)
		expect(path.pointAt(0.5).x).toBeCloseTo(1)
		expect(path.pointAt(0.5).y).toBeCloseTo(0.5)
		expect(path.pointAt(1).x).toBeCloseTo(1)
		expect(path.pointAt(1).y).toBeCloseTo(2)

		expect(path.getPoints(2)[0].x).toBeCloseTo(0)
		expect(path.getPoints(2)[0].y).toBeCloseTo(0)
		expect(path.getPoints(2)[1].x).toBeCloseTo(1)
		expect(path.getPoints(2)[1].y).toBeCloseTo(0.5)
		expect(path.getPoints(2)[2].x).toBeCloseTo(1)
		expect(path.getPoints(2)[2].y).toBeCloseTo(2)

		expect(path.spacedPointAt(0).x).toBeCloseTo(0)
		expect(path.spacedPointAt(0).y).toBeCloseTo(0)
		expect(path.spacedPointAt(0.5).x).toBeCloseTo(1)
		expect(path.spacedPointAt(0.5).y).toBeCloseTo(0.5)
		expect(path.spacedPointAt(1).x).toBeCloseTo(1)
		expect(path.spacedPointAt(1).y).toBeCloseTo(2)

		expect(path.getSpacedPoints(2)[0].x).toBeCloseTo(0)
		expect(path.getSpacedPoints(2)[0].y).toBeCloseTo(0)
		expect(path.getSpacedPoints(2)[1].x).toBeCloseTo(1)
		expect(path.getSpacedPoints(2)[1].y).toBeCloseTo(0.5)
		expect(path.getSpacedPoints(2)[2].x).toBeCloseTo(1)
		expect(path.getSpacedPoints(2)[2].y).toBeCloseTo(2)

		expect(path.getSpacedTs(2)[0]).toBeCloseTo(0)
		expect(path.getSpacedTs(2)[1]).toBeCloseTo(0.625)
		expect(path.getSpacedTs(2)[2]).toBeCloseTo(1)

		expect(path.tangentAt(0).x).toBeCloseTo(1)
		expect(path.tangentAt(1).y).toBeCloseTo(2)

		expect(path.normalAt(0, 0).x).toBeCloseTo(Math.sqrt(0.5))
		expect(path.normalAt(0, 0).y).toBeCloseTo(-Math.sqrt(0.5))
		expect(path.normalAt(0.5, 0).x).toBeCloseTo(Math.sqrt(0.5))
		expect(path.normalAt(0.5, 0).y).toBeCloseTo(-Math.sqrt(0.5))
		expect(path.normalAt(1, 0).x).toBeCloseTo(Math.sqrt(0.5))
		expect(path.normalAt(1, 0).y).toBeCloseTo(-Math.sqrt(0.5))

		expect(path.normalAt(0, 1).x).toBeCloseTo(-Math.sqrt(0.5))
		expect(path.normalAt(0, 1).y).toBeCloseTo(Math.sqrt(0.5))
		expect(path.normalAt(0.5, 1).x).toBeCloseTo(-Math.sqrt(0.5))
		expect(path.normalAt(0.5, 1).y).toBeCloseTo(Math.sqrt(0.5))
		expect(path.normalAt(1, 1).x).toBeCloseTo(-Math.sqrt(0.5))
		expect(path.normalAt(1, 1).y).toBeCloseTo(Math.sqrt(0.5))

		expect(path.curvatureAt(0)).toBeCloseTo(0)

		expect(path.getCurvatureAdaptiveTs().length).toEqual(2)
		expect(path.getCurvatureAdaptiveTs()[0]).toBeCloseTo(0)
		expect(path.getCurvatureAdaptiveTs()[1]).toBeCloseTo(1)

		expect(path.getBox()).toEqual({x: 0, y: 0, width: 1, height: 1})
		expect(path.closestPointTo(new Point(1, 0)).x).toBeCloseTo(0.5)
		expect(path.closestPointTo(new Point(1, 0)).y).toBeCloseTo(0.5)
	})
})