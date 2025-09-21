import {CurvePath, CurvePathGroup} from '../curve-paths'
import {GradientWidthStroker} from './gradient-width-stroker'
import {CurvePathSmoother} from './smoother'
import {CurvePathWaver} from './waver'


interface PaintStrokeStyleData {

	/** Default value is `butt`. */
	strokeLineCap?: 'butt' | 'round' | 'square'

	/** Default value is `miter`. */
	strokeLineJoin?: 'bevel' | 'round' | 'miter'

	/** Miter limit rate for `miter` line join type, Default value is `10`. */
	strokeMiterLimit?: number
}


export interface PathReshapeOptions {

	/** Only take partial of path.  */
	partial?: [number, number]

	/** Smoother corners of the path. */
	smooth?: {

		/** Smooth radius. */
		radius: number

		/** 
		 * If want only partial corners, specifies their indices.
		 * Index `0` means the start point / corner.
		 */
		cornerIndices?: number[]
	}

	/** Make the path wave like. */
	wave?: {

		/**Wave length of each upper or lower part. */
		waveLength: number

		/** Wave amplitude rate based on `waveLength`.*/
		amplitudeRate: number

		/** 
		 * Wave smooth rate.
		 * `0` result in wave becomes polyline.
		 * `1` result in wave becomes arc sequence.
		 * Default value is `0`.
		 */
		smoothRate?: number
	}

	/** Reshape path with gradient stroking, normally tapered line. */
	gradientStrokeWidth?: {

		/** At the specified index range pair do gradient stroke. */
		indexRange: [number, number] | null

		/** The start width of the gradient part. */
		startWidth: number

		/** The end width of the gradient part. */
		endWidth: number

		/** The gradient width changing rate based on `LengthRate^power`. */
		power?: number
	}
}

/** Path reshaped result. */
export interface ReshapedPaths {

	/** Without gradient stroking */
	continuous: CurvePath

	result: CurvePath | CurvePathGroup
}


/** 
 * Reshape a curve path:
 *   smooth: smooth corners.
 *   wave: make the path wave like.
 *   gradientStrokeWidth: to a tapered line
 */
export function reshapePath(path: CurvePath, style: PaintStrokeStyleData, options: PathReshapeOptions): ReshapedPaths {
	let continuous: CurvePath = path

	if (options.partial) {
		continuous = path.partOf(options.partial[0], options.partial[1])
	}

	if (options.smooth) {
		continuous = new CurvePathSmoother(path, options.smooth.radius, options.smooth.cornerIndices).generate()
	}

	if (options.wave) {
		continuous = new CurvePathWaver(path, options.wave.waveLength, options.wave.amplitudeRate, options.wave.smoothRate).generate()
	}

	let result: CurvePath | CurvePathGroup = continuous

	if (options.gradientStrokeWidth) {
		result = new GradientWidthStroker(
			path,
			options.gradientStrokeWidth.indexRange,
			options.gradientStrokeWidth.startWidth,
			options.gradientStrokeWidth.endWidth,
			options.gradientStrokeWidth.power,
			style.strokeLineCap,
			style.strokeLineJoin,
			style.strokeMiterLimit,
		).generate()
	}

	return {
		continuous,
		result,
	}
}