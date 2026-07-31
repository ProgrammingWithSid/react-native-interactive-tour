import type { Rect, TourStep } from './types'

export interface TooltipLayout {
    placement: 'above' | 'below' | 'center'
    style: { top: number } | { bottom: number }
}

export const MIN_TOOLTIP_SPACE = 170
export const TOP_SAFE = 60

/**
 * Pure tooltip placement: pick the side of the spotlight with room; a target
 * spanning (nearly) the full height leaves no room above OR below — then center
 * the tooltip over the dim instead of overflowing into the status bar.
 */
export function computeTooltipLayout(
    rect: Rect | null,
    isIntro: boolean,
    screenHeight: number,
    forced?: TourStep['tooltipPlacement']
): TooltipLayout {
    if (isIntro) return { placement: 'center', style: { top: screenHeight * 0.3 } }
    if (!rect) return { placement: 'center', style: { top: screenHeight * 0.4 } }

    const spaceBelow = screenHeight - (rect.y + rect.h)
    const spaceAbove = rect.y

    const placement: TooltipLayout['placement'] =
        forced && forced !== 'auto'
            ? forced
            : spaceBelow >= MIN_TOOLTIP_SPACE
              ? 'below'
              : spaceAbove >= MIN_TOOLTIP_SPACE
                ? 'above'
                : 'center'

    if (placement === 'below') {
        return { placement, style: { top: Math.min(rect.y + rect.h + 16, screenHeight - MIN_TOOLTIP_SPACE) } }
    }
    if (placement === 'above') {
        return {
            placement,
            style: { bottom: Math.min(screenHeight - rect.y + 16, screenHeight - TOP_SAFE - MIN_TOOLTIP_SPACE) }
        }
    }
    return { placement, style: { top: Math.max(TOP_SAFE, screenHeight * 0.3) } }
}
