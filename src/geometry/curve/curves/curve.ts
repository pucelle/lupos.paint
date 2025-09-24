import {Box, Matrix, Point, Vector, IntegralLookup, NumberUtils, ListUtils} from '@pucelle/ff'
import {CurveData} from '../types'
import {CubicBezierCurve} from './cubic-bezier'


// Reference to:
// https://github.com/mrdoob/three.js/blob/dev/src/extras/core/Curve.js


/** Abstract class of all the curves, even line. */
export abstract class Curve {

	/** 
	 * Default division count.
	 * This value is used to make an equivalent-t sampling,
	 * It affects the precision of equal-length or equal-curvature division.
	 * 
	 * The default value `12` come from source codes of three.js,
	 * It causes about 0.8% error for circle, and about 0.25px error for 30px circle.
	 * Normally no need to increase it because default division normally provides only for testing.
	 */
	lengthDivisions: number = 12

	/** Curve start point. */
	readonly startPoint: Readonly<Point>

	/** Curve end point. */
	readonly endPoint: Readonly<Point>

	/** 
	 * Cached accumulate curve lengths.
	 * List length is `lengthDivisions`, start value is not 0.
	 */
	protected cachedLengths: number[] | null = null

	/** Cached points got from `getPoints`. */
	protected cachedPoints: Readonly<Point>[] | null = null

	/** Cached bounding box. */
	protected cachedBox: Readonly<Box> | null = null

	constructor(startPoint: Point, endPoint: Point) {
		this.startPoint = startPoint
		this.endPoint = endPoint
	}

	/**
	 * Get an accumulated arc length list.
	 * The got length of list is `lengthDivisions`, end value is total length.
	 */
	getLengths(divisions: number = this.lengthDivisions): number[] {
		if (this.cachedLengths?.length === divisions) {
			return this.cachedLengths
		}

		let lengths: number[] = []
		let points = this.getPoints(divisions)
		let currentLength = 0
		let lastPoint = this.startPoint

		for (let d = 1; d <= divisions; d++) {
			let point = points[d]

			// For a low count of division, sampling `ds/dt` can gain better result.
			currentLength += point.distanceTo(lastPoint)

			lengths.push(currentLength)
			lastPoint = point
		}

		if (divisions === this.lengthDivisions) {
			this.cachedLengths = lengths
		}

		return lengths
	}

	/** 
	 * Get total curve arc length.
	 * This is not a accurate result, but normally no hurt,
	 * normally at most (π - sin(π / 12) * 12) / π = 1.1% difference.
	 */
	getLength(): number {
		let lengths = this.getLengths()
		return lengths[lengths.length - 1]
	}

	/** Map arc length rate parameter `u` to generating parameter `t`. */
	mapU2T(u: number): number {
		return IntegralLookup.lookupXRateByYRate(u, this.getLengths())
	}

	/** Map generating parameter `t` to arc length rate parameter `u`. */
	mapT2U(t: number): number {
		return IntegralLookup.lookupYRateByXRate(t, this.getLengths())
	}

	/** Get generating parameter `t` at specified arc length. */
	tAtLength(length: number): number {
		let totalLength = this.getLength()
		let u = length / totalLength

		return this.mapU2T(u)
	}

	/** 
	 * Get tangent vector by generating parameter `t`.
	 * The returned vector length also represent the changing speed of arc length by t - `dL/dt`.
	 * This is a approximate method, better ways need solving `dL/dt`. 
	 */
	tangentAt(t: number): Vector {
		let point1 = this.pointAt(t)
		let point2 = this.pointAt(t + 0.001)

		return Vector.fromDiff(point2, point1).multiplyScalarSelf(1000)
	}

	/** 
	 * Get unit normal vector by generating parameter `t`.
	 * Normal vector direction is always equals tangent vector rotate +-90° clockwise.
	 */
	normalAt(t: number, clockwiseFlag: 0 | 1): Vector {
		let tangent = this.tangentAt(t)
		return tangent.rotateSelf(clockwiseFlag ? Math.PI / 2 : -Math.PI / 2).normalizeSelf()
	}

	/** Get curvature, which means `1 / Curvature Radius`. */
	curvatureAt(t: number): number {
		let point1 = this.pointAt(t - 0.001)
		let point2 = this.pointAt(t)
		let point3 = this.pointAt(t + 0.001)

		// Solution 1:
		// Curvature C = 1 / R
		// Curvature Radius R = ds / dθ
		// C = dθ / ds

		// Solution 2:
		// C = |x'y'' - x''y'| / (x'^2 + y'^2)^1.5
		// x' = (x(t+Δt) - x(t)) / Δt
		// x'' = (x(t+2Δt) + x(t) - 2*x(t+Δt)) / Δt^2
		// ...

		// Solution 3:
		// C = 4S/abc
		// S = ∑(i=1~n) 0.5 * (xi * yi⊕1 - xi⊕1 * yi)

		let x1 = point1.x
		let y1 = point1.y
		let x2 = point2.x
		let y2 = point2.y
		let x3 = point3.x
		let y3 = point3.y
		let c = Math.sqrt((x3 - x1) ** 2 + (y3 - y1) ** 2)
		
		return 8 * Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
			/ (c ** 3)
	}
			
	/** Get point at arc length percentage, `u` betweens 0~1. */
	spacedPointAt(u: number): Point {
		return this.pointAt(this.mapU2T(u))
	}

	/** Get point at specified arc length. */
	pointAtLength(length: number): Point {
		let totalLength = this.getLength()
		let u = length / totalLength

		return this.spacedPointAt(u)
	}

	/** 
	 * Get a sequence of points based on divisions of equal-distanced `t`.
	 * Length of returned list is `divisions + 1`, and is cacheable.
	 * For cubic bezier, the equal-t division has a little like equal-curvature division,
	 * The more curvature, the shorter of the segment.
	 */
	getPoints(divisions: number = this.lengthDivisions): Readonly<Point>[] {
		if (this.cachedPoints && this.cachedPoints.length === divisions + 1) {
			return this.cachedPoints
		}

		let points: Point[] = [this.startPoint]
		
		for (let d = 1; d < divisions; d++) {
			let t = d / divisions
			points.push(this.pointAt(t))
		}

		points.push(this.endPoint)

		if (divisions === this.lengthDivisions) {
			this.cachedPoints = points
		}

		return points
	}

	/** 
	 * Get a sequence of points based on divisions of equal-distanced arc length rate `u`.
	 * Length of returned list is `divisions + 1`.
	 */
	getSpacedPoints(divisions: number = this.lengthDivisions): Readonly<Point>[] {
		let points: Point[] = [this.startPoint]

		for (let d = 1; d < divisions; d++) {
			let u = d / divisions
			points.push(this.spacedPointAt(u))
		}

		points.push(this.endPoint)

		return points
	}

	/** 
	 * Get a sequence of generating parameter t based on divisions of equal-distanced arc length rate `u`.
	 * Length of returned list is `divisions + 1`.
	 */
	getSpacedTs(divisions: number = this.lengthDivisions): number[] {
		let ts: number[] = [0]
		
		for (let d = 1; d <= divisions; d++) {
			let u = d / divisions
			ts.push(this.mapU2T(u))
		}

		return ts
	}

	/** 
	 * Get a sequence of points based on adaptive divisions.
	 * The bigger the curvature is, the more divisions to make.
	 * About `segmentCurvature`, reference to `getEqualCurvaturePoints`,
	 */
	getCurvatureAdaptivePoints(segmentCurvature?: number, scaling?: number): Readonly<Point>[] {
		let points: Point[] = [this.startPoint]
		let ts = this.getCurvatureAdaptiveTs(segmentCurvature, scaling)
		
		for (let i = 1; i < ts.length; i++) {
			let t = ts[i]
			points.push(this.pointAt(t))
		}

		return points
	}

	/** 
	 * Get a sequence of generating parameter t based on divisions of curvature adaptive.
	 * The bigger the curvature is, the more divisions to make.
	 */
	getCurvatureAdaptiveTs(maxPixelDiff: number = 0.25, scaling: number = 1): number[] {

		// Let R be radius, C = 1/R, Arc is Arc Length after subdivision
		// MaxPixelDiff
		// 		= R * (1 - cos(Arc / R / 2))
		// 		≈ R * (Arc / R / 2)^2 / 2
		// 		= Arc^2 / 8R

		// Normally we want it < MaxPixelDiff, so:
		// Arc^2 / 8R < MaxPixelDiff
		// Arc < (MaxPixelDiff * 8R)^0.5

		// TotalArcLength = ∫dArc
		// 		= ∫(MaxPixelDiff * 8R)^0.5
		// 		= (8 * MaxPixelDiff)^0.5 * Average(R^0.5) * DivisionCount

		// DivisionCount = TotalArcLength / Average((MaxPixelDiff * 8R)^0.5)
		// 		≈ TotalArcLength / (MaxPixelDiff * 8)^0.5) * Average(C^0.5)
		// Which also means when scaling for S, DivisionCount increased by S^0.5

		let curvatureSqrtIntegral = this.generateCurvatureSqrtIntegral(this.lengthDivisions, scaling)
		let totalCurvatureSqrt = curvatureSqrtIntegral[curvatureSqrtIntegral.length - 1]
		let averageCurvatureSqrt = totalCurvatureSqrt / curvatureSqrtIntegral.length
		let newDivisions = this.getLength() / Math.sqrt(8 * maxPixelDiff) * averageCurvatureSqrt * Math.sqrt(scaling)
		
		newDivisions = Math.max(Math.floor(newDivisions), 1)
		let ts: number[] = [0]

		for (let d = 1; d < newDivisions; d++) {
			let c = d / newDivisions
			let t = IntegralLookup.lookupXRateByYRate(c, curvatureSqrtIntegral)

			ts.push(t)
		}

		ts.push(1)

		return ts
	}

	/** 
	 * Sampling curvature as `C`,
	 * do `∫C^0.5dt` and make a integral graph.
	 * Resulted list length is `divisions`.
	 */
	private generateCurvatureSqrtIntegral(divisions: number, scaling: number): number[] {
		let accumulated: number[] = []
		let total = 0

		for (let d = 1; d <= divisions; d++) {

			// Must minus 0.5 here to balance.
			let t = (d - 0.5) / divisions
			
			let curvature = this.curvatureAt(t)

			// A infinite curvature is meaningless and will make the whole calculation wrong.
			// Normally if assume drawing curve as pixels 1:1, the most curvature that can be recognized is 1.
			curvature = Math.min(curvature, scaling)

			total += Math.sqrt(curvature)
			accumulated.push(total)
		}

		return accumulated
	}

	/** Get partial curve by start and end generating parameters `t`. */
	partOf(startT: number, endT: number): this {
		if (startT <= 0 && endT >= 1) {
			return this
		}

		return this.getUnFulfilledPartOf(startT, endT)
	}

	/** 
	 * Get box of current curve.
	 * Note it's not affected by outer transform and stroking width.
	 */
	getBox(): Readonly<Box> {
		if (this.cachedBox) {
			return this.cachedBox
		}

		let box = Box.fromCoords(this.startPoint, this.endPoint)!

		for (let t of this.calcExtremeTs()) {
			box.expandToContainSelf(this.pointAt(t))
		}

		return this.cachedBox = box
	}

	/** Find the closest point on the curve to specified `point`. */
	closestPointTo(point: Point): Readonly<Point> {
		let points = this.getPoints()

		// Find index of the minimum distance from sampling points.
		let minIndex = ListUtils.minIndex(points, (p) => {
			return Vector.fromDiff(p, point).getLengthSquare()
		})

		let minT = minIndex / points.length
		let minPoint = points[minIndex]
		let tangent = this.tangentAt(minT)

		// `flag = 1` means should increase t to find next.
		let flag = Vector.fromDiff(point, minPoint).dot(tangent) > 0 ? 1 : -1

		// At edge, already end.
		if (flag > 0 && minT === 1 || flag < 0 && minT === 0) {
			return minPoint
		}

		let startT = minT
		let endT = minT + flag / points.length
		let closestAtStart = true
		let closestPoint = minPoint
		let closestDistance = Vector.fromDiff(minPoint, point).getLengthSquare()

		// To precision 1/2^12, normally at most 0.5 pixel error.
		for (let i = 0; i < 12; i++) {
			let centerT = (startT + endT) / 2
			let centerPoint = this.pointAt(centerT)
			let centerDistance = Vector.fromDiff(centerPoint, point).getLengthSquare()

			if (centerDistance < closestDistance) {
				closestPoint = centerPoint
				closestDistance = centerDistance
				closestAtStart = !closestAtStart
			}

			if (closestAtStart) {
				endT = centerT
			}
			else {
				startT = centerT
			}
		}

		return closestPoint
	}

	/** Know X value, calc generating parameter `t`. */
	calcTsByX(x: number): number[] {
		let extremeTs = this.calcYExtremeTs()
		let ts: number[] = []

		for (let i = 0; i <= extremeTs.length; i++) {
			let startT = i === 0 ? 0 : extremeTs[i - 1]
			let endT = i === extremeTs.length ? 1 : extremeTs[i]
			let startX = this.pointAt(startT).x
			let endX = this.pointAt(endT).x

			if (x > startX && x > endX || x < startX && x < endX) {
				continue
			}

			let flag = NumberUtils.flag(endX - startX)

			// To precision 1/2^12 / 12, normally at most 0.5 pixel error.
			for (let i = 0; i < 12; i++) {
				let centerT = (startT + endT) / 2
				let centerX = this.pointAt(centerT).x
				let centerFlag = (centerX - x) * flag

				if (centerFlag < 0) {
					startT = centerT
				}
				else {
					endT = centerT
				}
			}

			ts.push(startT)
		}

		return ts
	}

	/** Know Y value, calc generating parameter `t`. */
	calcTsByY(y: number): number[] {
		let extremeTs = this.calcYExtremeTs()
		let ts: number[] = []

		for (let i = 0; i <= extremeTs.length; i++) {
			let startT = i === 0 ? 0 : extremeTs[i - 1]
			let endT = i === extremeTs.length ? 1 : extremeTs[i]
			let startX = this.pointAt(startT).y
			let endX = this.pointAt(endT).y

			if (y > startX && y > endX || y < startX && y < endX) {
				continue
			}

			let flag = NumberUtils.flag(endX - startX)

			for (let i = 0; i < 12; i++) {
				let centerT = (startT + endT) / 2
				let centerX = this.pointAt(centerT).y
				let centerFlag = (centerX - y) * flag

				if (centerFlag < 0) {
					startT = centerT
				}
				else {
					endT = centerT
				}
			}

			ts.push(startT)
		}

		return ts
	}

	/** Get partial curve by start and end generating parameter `t`. */
	protected abstract getUnFulfilledPartOf(startT: number, endT: number): this

	/** 
	 * Get extreme generating parameters `t`, where `dx / dt = 0` or `dy / dt = 0`.
	 * Exclude start and end point, always sort from lower to upper.
	 * Note this doesn't be affected by outer transform.
	 */
	protected abstract calcExtremeTs(): number[]

	/** 
	 * Get extreme generating parameters `t`, where `dx / dt = 0`.
	 * Exclude start and end point, always sort from lower to upper.
	 */
	protected abstract calcXExtremeTs(): number[]

	/** 
	 * Get extreme generating parameters `t`, where `dy / dt = 0`.
	 * Exclude start and end point, always sort from lower to upper.
	*/
	protected abstract calcYExtremeTs(): number[]

	/** Get point by generating parameter `t` betweens 0~1. */
	abstract pointAt(t: number): Point

	/** Do transform, returns a new curve. */
	abstract transform(matrix: Matrix): Curve

	/** Convert current curve to cubic bezier curves, then can mix it easier with another. */
	abstract toCubicBezierCurves(): CubicBezierCurve[]

	/** Whether equals another same type curve. */
	abstract equals(curve: this): boolean

	/** Export as standardized JSON data. */
	abstract toJSON(): CurveData
}

