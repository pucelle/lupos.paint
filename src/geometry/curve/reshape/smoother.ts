import {MathUtils, NumberUtils, Point, RadialLine} from '@pucelle/ff'
import {CurvePath} from '../curve-paths'
import {CubicBezierCurve, Curve} from '../curves'


/** Every corner smooth result. */
interface SmoothCorner {
    leftT: number
    rightT: number
	leftPoint: Point
	rightPoint: Point
	leftRadius: number
	rightRadius: number
    qPoint: Point | null

	/** 
	 * How much the smooth curve close to arc, `0~1`.
	 * If 1, be pure arc.
	 * If 0, be pure quadratic bezier curve.
	 * If a curve is nearly 100% transformed to smooth, then it's arcRate is nearly `1`.
	 */
	arcRate: number
}


/** Smooth every or picked connection corners of all the curves inside. */
export class CurvePathSmoother {

	private curvePath: CurvePath
	private radius: number
	private cornerIndices: number[] | null

	/** If `cornerIndices` specified, only corners that inside this indices will be smooth. */
	constructor(curvePath: CurvePath, radius: number, cornerIndices: number[] | null = null) {
		this.curvePath = curvePath
		this.radius = radius
		this.cornerIndices = cornerIndices
	}

	/** Do modulo on index, convert it to a index in range. */
	private normalizeIndex(index: number) {
		return NumberUtils.euclideanModulo(index, this.curvePath.curves.length)
	}

	/** Smooth the curve path, returns a new smoothed curve path. */
	generate(): CurvePath {
		let curves: Curve[] = []
		let cornerList: (SmoothCorner | null)[] = []

		for (let i = 0; i < this.curvePath.curves.length; i++) {
			let corner = this.generateBaseSmoothCorner(i)
			cornerList.push(corner)
		}

		for (let i = 0; i < cornerList.length; i++) {
			let corner = cornerList[i]
			if (corner) {
				this.fillCornerArcRate(corner, i, cornerList)
			}
		}

		for (let i = 0; i < this.curvePath.curves.length; i++) {
			this.fillSmoothCurveAt(i, cornerList, curves)
		}

		return CurvePath.fromCurves(curves, this.curvePath.closed)!
	}

	/** Smooth curve at index, push results into `curves`. */
	private fillSmoothCurveAt(index: number, cornerList: (SmoothCorner | null)[], curves: Curve[]) {
		let curve = this.curvePath.curves[index]
		let left = cornerList[index]
		let right = cornerList[this.normalizeIndex(index + 1)]

		if (left?.qPoint) {
			let arcRate = left.arcRate

			// 0.552: pure arc,	equals `(1 - 2^0.5 / 2) * 8/3`.
			// 0.75: pure quadratic bezier curve.
			let tension = MathUtils.mix(0.75, 0.552, arcRate)

			curves.push(new CubicBezierCurve(
				left.leftPoint,
				left.rightPoint,
				left.leftPoint.mix(left.qPoint, tension),
				left.rightPoint.mix(left.qPoint, tension),
			))
		}

		// Partial curve.
		if (left || right) {
			curves.push(curve.partOf(left?.rightT ?? 0, right?.leftT ?? 1))
		}

		// Use raw curve.
		else {
			curves.push(curve)
		}
	}

	/** Generate corner smooth result at index. */
	private generateBaseSmoothCorner(index: number): SmoothCorner | null {
		let modIndex = this.normalizeIndex(index)
		if (!this.shouldSmoothCornerAt(modIndex)) {
			return null
		}

		let closed = this.curvePath.closed
		let left = this.curvePath.curves[this.normalizeIndex(modIndex - 1)]
		let right = this.curvePath.curves[modIndex]

		if (!this.shouldSmoothCornerBetween(left, right)) {
			return null
		}

		// Smooth radius can't exceed half arc length, except the edge..
		let leftLength = left.getLength()
		let rightLength = right.getLength()
		let maxLeftRadius = !closed && modIndex === 1 ? leftLength : leftLength / 2
		let maxRightRadius = !closed && modIndex === this.curvePath.curves.length - 1 ? rightLength : rightLength / 2

		let leftRadius = Math.min(this.radius, maxLeftRadius)
		let rightRadius = Math.min(this.radius, maxRightRadius)

		// Get start and end point after making a smooth arc.
		let leftT = left.tAtLength(leftLength - leftRadius)
		let rightT = right.tAtLength(rightRadius)

		let leftPoint = left.pointAt(leftT)
		let rightPoint = right.pointAt(rightT)

		let leftTangent = left.tangentAt(leftT)
		let rightTangent = right.tangentAt(rightT)

		// Intersect edge lines to get a point as control point.
		let radialLine1 = new RadialLine(leftPoint, leftTangent)
		let radialLine2 = new RadialLine(rightPoint, rightTangent)
		let qPoint = radialLine1.intersect(radialLine2)?.point || null

		return {
			leftT,
			rightT,
			leftPoint,
			rightPoint,
			leftRadius,
			rightRadius,
			qPoint,
	
			// Process it next step.
			arcRate: 0,
		}
	}

	/** Whether should smooth corner at index. */
	private shouldSmoothCornerAt(modIndex: number): boolean {
		let closed = this.curvePath.closed

		// Corner indices is `0 ~ curves.length`.
		// `0` should be smooth when closed, always ignores corner index `curves.length`.
		if (!closed && modIndex === 0) {
			return false
		}

		if (this.cornerIndices) {
			return this.cornerIndices.includes(modIndex)
		}
		else {
			return true
		}
	}

	/** Whether should smooth corner between curves. */
	private shouldSmoothCornerBetween(left: Curve, right: Curve): boolean {

		let leftEndTangent = left.tangentAt(1).normalize()
		let rightStartTangent = right.tangentAt(0).normalize()

		// One curve degenerate to a point.
		if (leftEndTangent.isZero() || rightStartTangent.isZero()) {
			return false
		}

		// Rotation angle must at least 5°.
		if (rightStartTangent.dot(leftEndTangent) > 0.9962) {
			return false
		}

		return true
	}

	/** 
	 * If the curve have a long rest part, make the smooth part looks like an arc.
	 * If the curve have a short rest part after smooth, make smooth part looks like a quadratic curve.
	 */
	private fillCornerArcRate(curr: SmoothCorner, index: number, smoothList: (SmoothCorner | null)[]) {
		let prev = smoothList[this.normalizeIndex(index - 1)]
		let next = smoothList[this.normalizeIndex(index + 1)]
		let leftCurve = this.curvePath.curves[this.normalizeIndex(index - 1)]
		let rightCurve = this.curvePath.curves[this.normalizeIndex(index)]
		
		// Rest length after excluding smooth length.
		let leftRest = leftCurve.getLength() - curr.leftRadius - (prev ? prev.rightRadius : 0)
		leftRest = Math.max(0, leftRest)

		let rightRest = rightCurve.getLength() - curr.rightRadius - (next ? next.leftRadius : 0)
		rightRest = Math.max(0, rightRest)

		// If rest length is long, this rate becomes nearly 0.
		// If rest length is short, this rate becomes nearly 1.
		let leftArcRate = 1 - leftRest / (leftRest + curr.leftRadius + 0.0001)
		let rightArcRate = 1 - rightRest / (rightRest + curr.rightRadius + 0.0001)

		// Choose bigger value.
		let arcRate = Math.max(leftArcRate, rightArcRate)

		curr.arcRate = arcRate
	}
}