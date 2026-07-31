import { defaultTheme, mergeTheme } from '../src/theme'

describe('mergeTheme', () => {
    it('returns the default theme when nothing is provided', () => {
        expect(mergeTheme()).toEqual(defaultTheme)
    })

    it('deep-merges tooltip overrides without dropping defaults', () => {
        const theme = mergeTheme({ tooltip: { backgroundColor: '#000' } })
        expect(theme.tooltip.backgroundColor).toBe('#000')
        expect(theme.tooltip.titleColor).toBe(defaultTheme.tooltip.titleColor)
        expect(theme.dimColor).toBe(defaultTheme.dimColor)
    })

    it('overrides top-level values', () => {
        expect(mergeTheme({ ringColor: 'red' }).ringColor).toBe('red')
    })
})
