import type { DeepPartial, TourLabels, TourTheme } from './types'

export const defaultTheme: TourTheme = {
    dimColor: 'rgba(0, 0, 0, 0.65)',
    ringColor: 'rgba(255, 255, 255, 0.9)',
    ringWidth: 2,
    spotlightPadding: 8,
    spotlightRadius: 12,
    tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111111',
        textColor: '#444444',
        buttonColor: '#111111',
        buttonTextColor: '#ffffff',
        secondaryTextColor: '#888888',
        borderRadius: 14
    }
}

export const defaultLabels: TourLabels = {
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    done: 'Done',
    targetHint: 'Tap the highlighted area to continue'
}

export function mergeTheme(theme?: DeepPartial<TourTheme>): TourTheme {
    if (!theme) return defaultTheme
    return {
        ...defaultTheme,
        ...theme,
        tooltip: { ...defaultTheme.tooltip, ...theme.tooltip }
    } as TourTheme
}
