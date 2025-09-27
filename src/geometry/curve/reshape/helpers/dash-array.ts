interface DashItem {

	/** Empty length in front. */
	empty: number

	/** Solid length after empty. */
	solid: number
}


export class DashArrayGenerator {

	private dashArray: number[]
	private dashOffset: number

	/** Accumulated index, plus after each iteration. */
	private itemIndex: number = 0

	/** Index in dash array, indicates the last index of solid. */
	private dashIndex = 0

	constructor(
		dashArray: number[],
		dashOffset: number
	) {
		if (dashArray.length === 0) {
			throw new Error(`Dash array must contain at least one value!`)
		}

		this.dashArray = dashArray
		this.dashOffset = dashOffset
	}

	*iterate(): Iterable<DashItem> {
		while (true) {
			if (this.itemIndex === 0) {
				let item = this.produceFirstItem()
				this.itemIndex++

				yield item
			}
			else {
				let empty = this.dashArray[(this.dashIndex + 1) % this.dashArray.length]
				let solid = this.dashArray[(this.dashIndex + 2) % this.dashArray.length]

				this.dashIndex += 2
				this.itemIndex++

				yield {
					empty,
					solid,
				}
			}
		}
	}

	/** Process dash offset, produce the first item. */
	private produceFirstItem(): DashItem {
		let oneLoopLength = 0

		// [1, 2, 1] equals [1, 2, 1, 1, 2, 1],
		// Double it if odd count.
		for (let v of this.dashArray) {
			oneLoopLength += v * 2
		}

		let offset = this.dashOffset - Math.floor(this.dashOffset / oneLoopLength) * oneLoopLength
		let currentLength = 0
		let empty = 0
		let solid = 0

		for (let i = 0; i < this.dashArray.length * 2; i++) {
			let v = this.dashArray[i % this.dashArray.length]
			currentLength += v

			if (currentLength < offset) {
				continue
			}

			let value = currentLength - offset

			if (i % 2 === 0) {
				solid = value
				this.dashIndex = i
			}
			else {
				empty = value
				solid = this.dashArray[(i + 1) % this.dashArray.length]
				this.dashIndex = i + 1
			}
			break
		}

		return {
			empty,
			solid,
		}
	}
}