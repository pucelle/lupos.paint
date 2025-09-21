/** 
 * This is a normative 2D transform data.
 * Compare with a matrix, use this can easily adjust each parameter separately.
 * The transform order is `Scaling -> Rotation -> SkewingY -> Translation`.
 */
export interface TransformData {

	/** Where is the anchor point located in world coordinate system. */
	position?: [number, number]

	/** Where is the anchor point, in current object coordinate system. */
	origin?: [number, number]

	/** Scaling rate, 1 based. */
	scale?: [number, number]

	/** Rotation angle in clockwise direction. */
	rotation?: number

	/** 
	 * Skew axis angle that skew based on,
	 * `0` means the y axis direction, in clockwise direction.
	 */
	skewAxis?: number

	/** 
	 * Skew angle.
	 * If `skewAxis` is `0`, skew will cause pixels keep x value and move in y direction based on how x is.
	 */
	skew?: number

	/** 
	 * Opacity value, 0~1.
	 * You may create a 0-opacity layer to accept mouse events but keeps invisible.
	 */
	opacity?: number
}
