# lupos.paint - still under design

**lupos.paint** is a component-based 2d paint system, it provides easy way to build scalable, rich-interactive SVG / canvas / WebGL / WebGPU apps, like:

- Mind Map
- Flow Diagram
- Poster
- Video effects
- Figma like
- Photoshop or After Effects

**lupos.paint** works at higher level than normal paint library, but it has nearly the same performance as normal paint libraries benefit by **lupos**.

With it, your daily work is declaring components, decides which child components to includes and their properties.


## Core features

- High Performance benefit by **lupos**. In fact it normally has better performance for larger apps because of FrameBuffer-Reusing, Partial-Rendering and other Optimizations.
- Auto Data Change Observing benefit by **lupos**, simpler codes than all other paint libraries
- Easy to Use, developers have no need to know Graphic Algorithms well (but better to know)
- Auto Resource Management, especially for texture or frame buffer in WebGL / WebGPU
- Powerful Geometry Core, make it possible to implement complex geometry features like Path Transition
- Transition System, imagine in a mindmap app, expanding a node like a branch grows
- Shader-Based Effects (only for WebGL / WebGPU renderers).


## Some code samples

### 1. Mindmap:

```ts
class MindMap extends PaintComponent {
	data: MindMapData
	render() {
		return paint`
			<MindMapRoot .data=${this.data.root} />
			<MindMapFloats .data=${this.data.floats} />
		`
	}
}

class MindMapRoot extends PaintComponent {
	data: MindMapRootData
	render() {
		return paint`
			<MindMapLayout .name=${data.layoutName}>
				<lu:for ${this.data.children} />${item => paint`
					<MindMapMain .data=${item} />
				`}</>
			</>
		`
	}
}

class MindMapMain ...

class MindMapApp {
	data: MindMapData
	render() {
		return paint`
			<Camera2D>
				<MindMap .data=${data} />
			</>
			...
		`
	}
}
```


### 2. Flow Diagram:

```ts
class FlowDiagram extends PaintComponent {
	data: FlowDiagramData
	render() {
		return paint`
			<FlowDiagramNodes .data=${this.data.nodes} />
			<FlowDiagramConnections .data=${this.data.connections} />
		`
	}
}

class FlowDiagramApp {
	data: FlowDiagramData
	render() {
		return paint`
			<Camera2D>
				<FlowDiagram .data=${data} />
			</>
			...
		`
	}
}
```



## License

MIT