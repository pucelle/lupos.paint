import {CurvePath, CurvePathGroup} from '../curve-paths'
import {GradientWidthStroker} from './gradient-width-stroker'
import {CurvePathSmoother} from './smoother'


/** For reshape stroking. */
export interface ReshapeStrokeStyleData {

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
		 * If want to apply smooth to partial corners, specifies their indices.
		 * Index `0` means the start point / corner.
		 */
		cornerIndices?: number[]
	}

	/** Reshape path with gradient stroking, normally tapered line. */
	gradientStroking?: {

		/** At the specified index range pair do gradient stroke. */
		indexRange?: [number, number]

		/** The start width of the gradient part. */
		startWidth: number

		/** The end width of the gradient part. */
		endWidth: number

		/** 
		 * The gradient width changing rate based on `LengthRate^power`.
		 * Default value is `1`.
		 */
		power?: number
	}
}

/** Path reshaped result. */
export interface ReshapedPaths {

	/** Without gradient stroking */
	continuous: CurvePath

	/** Reshaped result. */
	result: CurvePath | CurvePathGroup
}


/** 
 * Reshape a curve path:
 * 	 partial: pick partial of whole path.
 *   smooth: smooth corners.
 *   gradientStroking: to a tapered line
 */
export function reshapeCurvePath(
	path: CurvePath,
	viewScaling: number,
	style: ReshapeStrokeStyleData = {},
	options: PathReshapeOptions = {}
): ReshapedPaths {
	let continuous: CurvePath = path

	if (options.partial) {
		continuous = path.partOf(options.partial[0], options.partial[1])
	}

	if (options.smooth) {
		continuous = new CurvePathSmoother(path, options.smooth.radius, options.smooth.cornerIndices).generate()
	}

	let result: CurvePath | CurvePathGroup = continuous

	if (options.gradientStroking) {
		result = new GradientWidthStroker(
			path,
			viewScaling,
			options.gradientStroking.indexRange,
			options.gradientStroking.startWidth,
			options.gradientStroking.endWidth,
			options.gradientStroking.power,
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