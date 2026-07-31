import { computeTooltipLayout, MIN_TOOLTIP_SPACE, TOP_SAFE } from '../src/placement'

const H = 800
const rect = (y: number, h: number) => ({ x: 0, y, w: 100, h, r: 12 })

describe('computeTooltipLayout', () => {
    it('centers for intro steps', () => {
        expect(computeTooltipLayout(null, true, H)).toEqual({ placement: 'center', style: { top: H * 0.3 } })
    })

    it('centers while waiting for a target', () => {
        expect(computeTooltipLayout(null, false, H).placement).toBe('center')
    })

    it('places below a target near the top', () => {
        const layout = computeTooltipLayout(rect(50, 60), false, H)
        expect(layout.placement).toBe('below')
        expect(layout.style).toEqual({ top: 50 + 60 + 16 })
    })

    it('places above a target near the bottom', () => {
        const layout = computeTooltipLayout(rect(700, 60), false, H)
        expect(layout.placement).toBe('above')
        expect(layout.style).toEqual({ bottom: H - 700 + 16 })
    })

    it('centers for a target spanning (nearly) the full height', () => {
        const layout = computeTooltipLayout(rect(40, H - 80), false, H)
        expect(layout.placement).toBe('center')
        expect(layout.style).toEqual({ top: Math.max(TOP_SAFE, H * 0.3) })
    })

    it('never lets an above-placed tooltip cross the top safe area', () => {
        const layout = computeTooltipLayout(rect(MIN_TOOLTIP_SPACE + 1, H), false, H, 'above')
        const bottom = (layout.style as { bottom: number }).bottom
        expect(H - bottom).toBeGreaterThanOrEqual(TOP_SAFE)
    })

    it('respects a forced placement', () => {
        expect(computeTooltipLayout(rect(50, 60), false, H, 'above').placement).toBe('above')
    })
})
