import {CurvePath} from '..'
import {CubicBezierCurve} from '../../curves'


/** 
 * Mix two paths to generate a new path.
 * Only transition points pair simply.
 * For a more complex transition,
 * should generate a dominate transform matrix by least square method.
 */
export class CurvePathMixer {

	private fromPath: CurvePath
	private toPath: CurvePath
	private fromCubicBezierCurves!: CubicBezierCurve[]
	private toCubicBezierCurves!: CubicBezierCurve[]

	constructor(fromPath: CurvePath, toPath: CurvePath) {
		if (fromPath.closed !== toPath.closed) {
			throw new Error(`Two paths wait for transition must both be closed or not closed!`)
		}

		this.fromPath = fromPath
		this.toPath = toPath

		this.initCubicCurvePairs()
	}

	private initCubicCurvePairs() {
		let fromPath = this.fromPath.toCubicBezierCurvePath()
		let toPath = this.toPath.toCubicBezierCurvePath()

		// Same length.
		if (fromPath.curves.length === toPath.curves.length) {
			this.fromCubicBezierCurves = fromPath.curves as CubicBezierCurve[]
			this.toCubicBezierCurves = toPath.curves as CubicBezierCurve[]
		}

		// Do curve cutting.
		else {
			this.bundledCuttingToInitCurvePairs(fromPath, toPath)
		}
	}

	/** 
	 * Bundle two paths, align start and end edge points,
	 * cut at each curve join point.
	 */
	private bundledCuttingToInitCurvePairs(fromPath: CurvePath, toPath: CurvePath) {
		let lengths1 = fromPath.getLengths()
		let length1 = fromPath.getLength()
		let t1s = lengths1.map(l => l / length1)

		let lengths2 = toPath.getLengths()
		let length2 = toPath.getLength()
		let t2s = lengths2.map(l => l / length2)

		let ts = [...t1s, ...t2s].sort()
		let curves1: CubicBezierCurve[] = []
		let curves2: CubicBezierCurve[] = []

		for (let i = 1; i < ts.length; i++) {
			let prevT = ts[i - 1]
			let currT = ts[i]

			if (currT === prevT) {
				continue
			}

			let piece1 = this.fromPath.partOf(prevT, currT)
			let piece2 = this.fromPath.partOf(prevT, currT)

			curves1.push(piece1.curves[0] as CubicBezierCurve)
			curves2.push(piece2.curves[0] as CubicBezierCurve)
		}

		this.fromCubicBezierCurves = curves1
		this.toCubicBezierCurves = curves2
	}

	/** Generate a mixed curve path. */
	mix(rate: number): CurvePath {
		let curves: CubicBezierCurve[] = []

		for (let i = 0; i < this.fromCubicBezierCurves.length; i++) {
			let curve = this.fromCubicBezierCurves[i].mix(this.toCubicBezierCurves[i], rate)
			curves.push(curve)
		}

		return CurvePath.fromCurves(curves, this.fromPath.closed)!
	}
}