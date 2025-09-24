import {Point} from '@pucelle/ff'
import {CurvePath, CurvePathGroup, LineCurve} from '../../../src/geometry'


function expectCloseTo(o: any, compare: any) {
	if (Array.isArray(o)) {
		for (let i = 0; i < o.length; i++) {
			expectCloseTo(o[i], compare[i])
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


describe('Test CurvePath', () => {
	
	test('Line CurvePath', () => {
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

		expectCloseTo(path.pointAt(0), {x: 0, y: 0})
		expectCloseTo(path.pointAt(0.5), {x: 1, y: 0})
		expectCloseTo(path.pointAt(1), {x: 1, y: 2})

		expectCloseTo(path.spacedPointAt(0), {x: 0, y: 0})
		expectCloseTo(path.spacedPointAt(0.5), {x: 1, y: 0.5})
		expectCloseTo(path.spacedPointAt(1), {x: 1, y: 2})

		expectCloseTo(path.getPoints(2), [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 2}])
		expectCloseTo(path.getSpacedPoints(2), [{x: 0, y: 0}, {x: 1, y: 0.5}, {x: 1, y: 2}])

		expectCloseTo(path.getSpacedTs(2), [0, 0.625, 1])

		expectCloseTo(path.tangentAt(0), {x: 1, y: 0})
		expectCloseTo(path.tangentAt(1), {x: 0, y: 2})

		expectCloseTo(path.normalAt(0, 0), {x: 0, y: -1})
		expectCloseTo(path.normalAt(1, 0), {x: 1, y: 0})

		expectCloseTo(path.normalAt(0, 1), {x: 0, y: 1})
		expectCloseTo(path.normalAt(1, 1), {x: -1, y: 0})

		expect(path.curvatureAt(0)).toBeCloseTo(0)

		expect(path.getCurvatureAdaptiveTs().length).toEqual(3)

		expect(path.getBox()).toEqual({x: 0, y: 0, width: 1, height: 2})
		expectCloseTo(path.closestPointTo(new Point(0.5, 0.5)), {x: 0.5, y: 0})
		expectCloseTo(path.calcTsByX(0.5), [0.16666666666666666])
		expectCloseTo(path.calcTsByY(0.5), [0.5])
		
		expect(path.getDistance(new Point(2, 1))).toBeCloseTo(1)

		expect(path.toSVGPathD()).toBe('M0 0L1 0L1 2')
		expect(CurvePathGroup.fromSVGPathD(path.toSVGPathD())?.curvePaths[0]!.equals(path)).toBeTruthy()


		let path2 = path.clone()
		path2.closePath()

		expect(path2.getDistance(new Point(0.5, 0.5))).toBeCloseTo(-0.22360679774997896)
	})
})