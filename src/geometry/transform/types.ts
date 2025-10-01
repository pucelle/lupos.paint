/** 
 * This is a normative 2D transform data.
 * Compare with a matrix, use this can easily adjust each parameter separately.
 * The transform order is `Scaling -> Rotation -> SkewingY -> Translation`.
 */
export interface TransformComponentData {

	/** 
	 * Where is the origin, in current object coordinate system.
	 * By default it's the left-top position, which is (0, 0).
	 */
	origin?: [number, number]

	/** Translate part. */
	translate?: [number, number]

	/** Scaling rate of x and y axises based on origin. */
	scale?: [number, number]

	/** Rotation angle in clockwise direction based on origin. */
	rotate?: number

	/** 
	 * Skew axis angle that skew based,
	 * `0` means the y axis direction, in clockwise direction.
	 */
	skewAxis?: number

	/** 
	 * Skew angle.
	 * If `skewAxis` is `0`, skew will cause pixels persist x property and move in y direction.
	 */
	skew?: number
}
