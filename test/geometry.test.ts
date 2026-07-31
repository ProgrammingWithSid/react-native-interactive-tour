import { roundedRectPath } from '../src/geometry'

describe('roundedRectPath', () => {
    it('builds a closed path starting after the top-left radius', () => {
        const d = roundedRectPath(10, 20, 100, 50, 8)
        expect(d.startsWith('M18,20')).toBe(true)
        expect(d.endsWith('z')).toBe(true)
    })

    it('clamps the radius to half the smaller dimension', () => {
        // h/2 = 5 is the max radius here, so the horizontal edge is w - 2*5
        const d = roundedRectPath(0, 0, 100, 10, 50)
        expect(d).toContain('M5,0')
        expect(d).toContain('h90')
    })

    it('handles a zero-size (collapsed) hole without negative arcs', () => {
        const d = roundedRectPath(50, 50, 0, 0, 12)
        expect(d).toContain('M50,50')
        expect(d).not.toContain('NaN')
    })
})
