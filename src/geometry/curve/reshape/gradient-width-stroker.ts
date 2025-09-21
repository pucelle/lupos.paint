import {MathUtils, Point, Vector} from '@pucelle/ff'
import {CurvePath, CurvePathGroup} from '../curve-paths'
import {LineCurve, ArcCurve, Curve} from '../curves'
import {DashArrayGenerator} from './helpers/dash-array'
import {calcMiterLineJoinBevelPoints, calcRoundLineJoinRadius} from './helpers/line-join'
import {connectTwoLineSegments, makeRadial, tieEdgeMessesKnot} from './helpers/line-segments'


/** When dash array set, cut to several parts. */
interface DashPart {
	path: CurvePath
	startLength: number
}


/** 
 * Make a filled path from a curve path.
 * Some parts of it have gradient stroke width.
 */
export class GradientWidthStroker {

	private curvePath: CurvePath
	private indexRange: [number, number] | null
	private startWidth: number
	private endWidth: number
	private power: number
	private lineCap: 'butt' | 'round' | 'square'
	private lineJoin: 'bevel' | 'round' | 'miter'
	private miterLimit: number
	private dashArrayGenerator: DashArrayGenerator | null
	
	private gradientLength: number = 0
	private lengthBeforeGradient: number = 0

	constructor(
		curvePath: CurvePath,
		indexRange: [number, number] | null,
		startWidth: number,
		endWidth: number,
		power: number = 1,
		lineCap: 'butt' | 'round' | 'square' = 'butt',
		lineJoin: 'bevel' | 'round' | 'miter' = 'miter',
		miterLimit: number = 10,
		dashArray: number[] | null = null,
		dashOffset: number = 0
	) {
		this.curvePath = curvePath
		this.indexRange = indexRange
		this.startWidth = startWidth
		this.endWidth = endWidth
		this.power = power
		this.lineCap = lineCap
		this.lineJoin = lineJoin
		this.miterLimit = miterLimit

		this.dashArrayGenerator = dashArray ? new DashArrayGenerator(dashArray, dashOffset) : null
		this.initGradientLengths()
	}

	/** Make the length of the part that should do gradient stroke. */
	private initGradientLengths() {
		if (this.indexRange) {
			let startRange = Math.min(this.indexRange[0], this.curvePath.curves.length)
			let endRange = Math.min(this.indexRange[1], this.curvePath.curves.length)
		
			for (let i = 0; i < startRange; i++) {
				this.lengthBeforeGradient += this.curvePath.curves[i].getLength()
			}

			for (let i = startRange; i < endRange; i++) {
				this.gradientLength += this.curvePath.curves[i].getLength()
			}
		}
		else {
			this.gradientLength = this.curvePath.getLength()
		}
	}

	/** Get gradient rate by current arc length. */
	private getGradientRateAtLength(length: number): number {
		if (this.indexRange) {
			if (length < this.lengthBeforeGradient) {
				return 0
			}

			return MathUtils.linearStep(length - this.lengthBeforeGradient, 0, this.gradientLength)
		}
		else {
			return length / this.curvePath.getLength()
		}
	}

	/** Get gradient rate by current arc length. */
	private getStrokeWidthAtLength(length: number): number {
		let rate = this.getGradientRateAtLength(length)
		return MathUtils.mix(this.startWidth, this.endWidth,  Math.pow(rate, this.power))
	}

	/** Generate a new filled path, or a dashed path. */
	generate(): CurvePath | CurvePathGroup {
		if (this.dashArrayGenerator) {
			return this.generateDashParts()
		}
		else {
			return this.generateOne(this.curvePath, 0)
		}
	}

	/** Generate a multi curve path when dash array set. */
	private generateDashParts(): CurvePathGroup {
		let parts = this.cutToDashParts()
		let paths = parts.map(part => this.generateOne(part.path, part.startLength))

		return CurvePathGroup.fromCurvePaths(paths)!
	}

	/** Cut to several parts when setting dash array. */
	private cutToDashParts() {
		let totalLength = this.curvePath.getLength()
		let currentLength = 0
		let parts: DashPart[] = []

		for (let dashItem of this.dashArrayGenerator!.iterate()) {
			let strokeWidth = this.getStrokeWidthAtLength(currentLength)
			let startLength = currentLength + dashItem.empty * strokeWidth
			let endLength = currentLength + (dashItem.empty + dashItem.solid) * strokeWidth
			let startT = startLength / totalLength

			if (startT >= 1) {
				continue
			}

			let endT = Math.min(endLength / totalLength, 1)
			let curvePart = this.curvePath.partOf(startT, endT)

			// Make the part Low sampling.
			for (let curve of curvePart.curves) {
				curve.lengthDivisions = 1
			}

			parts.push({
				path: curvePart,
				startLength,
			})

			if (endT >= 1) {
				continue
			}

			currentLength = endLength
		}

		return parts
	}

	/** Generate a new filled path. */
	private generateOne(path: CurvePath, pathStartLength: number): CurvePath {
		let curves: Curve[] = []
		let {leftList, rightList} = this.doCurvePathSampling(path, pathStartLength)

		// Connect left.
		for (let i = 0; i < leftList.length - 1; i++) {
			this.connectSegments(leftList[i], leftList[i + 1], curves)
		}

		// Connect left end to right start.
		this.connectSides(leftList[leftList.length - 1], rightList[0], curves, false)

		// Connect right.
		for (let i = 0; i < rightList.length - 1; i++) {
			this.connectSegments(rightList[i], rightList[i + 1], curves)
		}

		// Connect right end to left start.
		this.connectSides(leftList[leftList.length - 1], rightList[0], curves, true)

		return CurvePath.fromCurves(curves, true)!
	}

	/** Sampling curve path for points, and make left and right stroke curve points. */
	private doCurvePathSampling(path: CurvePath, pathStartLength: number) {
		let currentLength = 0

		// Assume a vector going down, `left` is where the vector pointed after anti-clockwise rotation 90°.
		let leftList: Point[][] = []
		let rightList: Point[][] = []

		for (let i = 0; i < path.curves.length; i++) {
			let curve = path.curves[i]
			let {left, right} = this.doCurveSampling(curve, pathStartLength + currentLength)

			leftList.push(left)
			rightList.push(right)

			currentLength += curve.getLength()
		}

		return {
			leftList,
			rightList,
		}
	}

	/** Sampling one curve points, and make left and right stroke curve points. */
	private doCurveSampling(curve: Curve, startLength: number): {left: Point[], right: Point[]} {
		let points: Point[] = []
		let left: Point[] = []
		let right: Point[] = []
		let ts: number[] = curve.getEqualCurvatureTs()

		for (let t of ts) {
			let normal = curve.tangentAt(t).normalizeSelf()
			normal.rotateSelf(Math.PI / 2)

			let point = curve.pointAt(t)
			let u = curve.mapT2U(t)
			let strokeWidth = this.getStrokeWidthAtLength(startLength + u * curve.getLength())
			let halfWidth = strokeWidth / 2
			
			normal.multiplyScalarSelf(-halfWidth)

			let leftPoint = point.add(normal)
			let rightPoint = point.add(normal.negativeSelf())

			left.push(leftPoint)
			right.push(rightPoint)
			points.push(point)
		}

		// Removes self-intersections.
		tieEdgeMessesKnot(left, points)
		tieEdgeMessesKnot(right, points)

		return {
			left,
			right,
		}
	}

	/** Connect two adjacent line segments. */
	private connectSegments(segments1: Point[], segments2: Point[], curves: Curve[]) {
		let {list1, list2, point} = connectTwoLineSegments(segments1, segments2)

		for (let i = 0; i < list1.length - 1; i++) {
			curves.push(new LineCurve(list1[i], list1[i+1]))
		}

		if (point) {
			if (this.lineJoin === 'round') {
				let radial1 = makeRadial(list1, list1.length - 1, 1)
				let radial2 = makeRadial(list2, 0, -1)
				let radius = calcRoundLineJoinRadius(radial1, radial2)

				// Always clockwise.
				let rotationFlag: 0 | 1 = 1 // radial1.vector.getRotateFlagFrom(radial2.vector)

				curves.push(new ArcCurve(radial1.point, radial2.point, radius, 0, rotationFlag))
			}
			else if (this.lineJoin === 'bevel') {
				curves.push(new LineCurve(list1[list1.length - 1], list2[0]))
			}

			// Handle miter.
			else {
				let radial1 = makeRadial(list1, list1.length - 1, 1)
				let radial2 = makeRadial(list2, 0, -1)
				let miterLimit = this.miterLimit
				let bevelPoints = calcMiterLineJoinBevelPoints(radial1, radial2, miterLimit)

				if (bevelPoints) {
					curves.push(new LineCurve(list1[list1.length - 1], bevelPoints[0]))
					curves.push(new LineCurve(bevelPoints[0], bevelPoints[1]))
					curves.push(new LineCurve(bevelPoints[1], list2[0]))
				}
				else {
					curves.push(new LineCurve(list1[list1.length - 1], point))
					curves.push(new LineCurve(point, list2[0]))
				}
			}
		}

		for (let i = 0; i < list2.length - 1; i++) {
			curves.push(new LineCurve(list2[i], list2[i+1]))
		}
	}

	/** Connect left and right sides in clockwise. */
	private connectSides(segments1: Point[], segments2: Point[], curves: Curve[], atStart: boolean) {
		if (this.lineCap === 'round') {
			curves.push(
				new ArcCurve(
					segments1[segments1.length - 1],
					segments2[0],
					atStart ? this.startWidth / 2 : this.endWidth / 2,
					0,
					1
				)
			)
		}
		else if (this.lineCap === 'square') {
			let radial1 = makeRadial(segments1, segments1.length - 1, 1)
			let radial2 = makeRadial(segments2, 0, -1)
			let pointDiffLengthHalf = Vector.fromDiff(radial1.point, radial2.point).getLength() / 2
			let point1 = radial1.point.add(radial1.vector.multiplyScalar(pointDiffLengthHalf))
			let point2 = radial2.point.add(radial2.vector.multiplyScalar(pointDiffLengthHalf))

			curves.push(
				new LineCurve(
					radial1.point,
					point1,
				),
				new LineCurve(
					point1,
					point2,
				),
				new LineCurve(
					point2,
					radial2.point,
				)
			)
		}
		else {
			curves.push(
				new LineCurve(
					segments1[segments1.length - 1],
					segments2[0]
				)
			)
		}
	}
}
