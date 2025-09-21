import {CurvePath} from '../curve-paths'
import {Curve, LineCurve} from '../curves'
import {CurvePathSmoother} from './smoother'


/** Make path become wave line. */
export class CurvePathWaver {

	private curvePath: CurvePath

	/**Wave length of each upper or lower part. */
	private waveLength: number

	/** Wave amplitude based on rate of `waveLength`.*/
	private amplitudeRate: number

	/** 
	 * Wave smooth rate.
	 * `0` result in wave becomes polyline.
	 * `1` result in wave becomes arc sequence.
	 * Default value is `0`.
	 */
	private smoothRate: number

	constructor(
		curvePath: CurvePath,
		waveLength: number,
		amplitudeRate: number,
		smoothRate: number = 0
	) {
		this.curvePath = curvePath
		this.waveLength = waveLength
		this.amplitudeRate = amplitudeRate
		this.smoothRate = smoothRate
	}

	/** Generate a new filled path. */
	generate(): CurvePath {
		let path = this.generateWavePolyline()

		if (this.smoothRate) {
			let radius = this.waveLength * Math.sqrt((1 + Math.pow(this.amplitudeRate, 2))) / 2 * this.smoothRate
			path = new CurvePathSmoother(path, radius).generate()
		}

		return path
	}

	/** Generate polyline type wave. */
	private generateWavePolyline() {
		let curves: Curve[] = []
		let waveAmplitude = this.amplitudeRate * this.waveLength

		// Note here the waved result is not global continuous when curve length increases.
		for (let curve of this.curvePath.curves) {
			let curveLength = curve.getLength()
			let startPoint = curve.startPoint
			let divisions = Math.ceil(curveLength / this.waveLength)

			for (let i = 0; i < divisions; i++) {
				let u = (i + 0.5) / divisions
				let t = curve.mapU2T(u)
				let normal = curve.tangentAt(t).normalizeSelf()
				let flag = i % 2 === 0 ? -1 : 1
	
				normal.rotateSelf(Math.PI / 2)
				normal.multiplyScalarSelf(waveAmplitude * flag)
	
				let point = curve.pointAt(t)
				let endPoint = point.add(normal)

				curves.push(new LineCurve(startPoint, endPoint))
				startPoint = endPoint
			}

			curves.push(new LineCurve(startPoint, curve.endPoint))
		}
		
		return CurvePath.fromCurves(curves, true)!
	}
}
