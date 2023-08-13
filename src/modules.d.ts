// pull request from voronoi repo adding types: https://github.com/gorhill/Javascript-Voronoi/pull/40/files

declare module 'voronoi' {
    export class Point {
        x: number
        y: number
    }

    export class Site {
        x: number
        y: number
        voronoiId: number
    }

    export class Cell {
        site: Site
        halfedges: HalfEdge[]
        closeMe: boolean
    }

    export class Edge {
        lSite: Site
        rSite: Site
        vb: Point
        va: Point
    }

    export class HalfEdge {
        site: Site
        edge: Edge
        angle: number
        getStartpoint(): Point
        getEndpoint(): Point
    }

    export class BBox {
        xl: number
        xr: number
        yt: number
        yb: number
    }

    export class VoronoiDiagram {
        site: any
        cells: Cell[]
        edges: Edge[]
        vertices: Point[]
        execTime: number
    }

    export default class Voronoi {
        constructor()
        compute(sites: Point[], bbox: BBox): VoronoiDiagram
        recycle(diagram: VoronoiDiagram): void
    }
}
