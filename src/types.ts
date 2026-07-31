import type { ReactNode } from 'react'

export type TourAdvanceMode = 'next' | 'target-press'

export interface TourStep {
    /**
     * Id of the <TourTarget> to highlight. Omit for an intro/modal step:
     * full dim, centered tooltip, Next button — no spotlight.
     */
    target?: string
    title: string
    text?: string
    /**
     * 'next' — the Next button advances (spotlighted element is not tappable).
     * 'target-press' — the user must tap the real highlighted element; its own
     * onPress runs (navigation, actions), then the tour advances.
     * Default: 'next'.
     */
    advanceOn?: TourAdvanceMode
    /** Spotlight padding around the measured target. Default: theme.spotlightPadding. */
    padding?: number
    /** Spotlight corner radius. Default: theme.spotlightRadius. */
    radius?: number
    /** Tooltip placement relative to the spotlight. Default: 'auto'. */
    tooltipPlacement?: 'auto' | 'above' | 'below'
    /**
     * 'spotlight' (default) — dim + touch blockers; only the target is usable.
     * 'free' — no dim, no blockers: a ring marks the target and the tooltip
     * guides, but the WHOLE screen stays interactive (forms, lists, scrolling).
     * Use for steps where the user must work the screen before continuing.
     */
    mode?: 'spotlight' | 'free'
}

export interface Rect {
    x: number
    y: number
    w: number
    h: number
    r: number
}

export interface TourTheme {
    dimColor: string
    ringColor: string
    ringWidth: number
    spotlightPadding: number
    spotlightRadius: number
    tooltip: {
        backgroundColor: string
        titleColor: string
        textColor: string
        buttonColor: string
        buttonTextColor: string
        secondaryTextColor: string
        borderRadius: number
    }
}

export interface TourLabels {
    next: string
    back: string
    skip: string
    done: string
    /** Hint shown instead of the Next button on 'target-press' steps. */
    targetHint: string
}

export interface ActiveTour {
    tourId: string
    stepIndex: number
    step: TourStep
    totalSteps: number
}

export interface TooltipApi {
    step: TourStep
    stepIndex: number
    totalSteps: number
    isFirst: boolean
    isLast: boolean
    labels: TourLabels
    theme: TourTheme
    next: () => void
    back: () => void
    stop: () => void
}

export interface TourProviderProps {
    children: ReactNode
    theme?: DeepPartial<TourTheme>
    labels?: Partial<TourLabels>
    /** Ms to wait for a step's target to mount before skipping it. Default: 5000. */
    targetTimeoutMs?: number
    /** Ms between a 'target-press' tap and advancing, so the target's own onPress runs first. Default: 150. */
    pressAdvanceDelayMs?: number
    /**
     * Ms a step's target may stay unmounted (normal screen transition) before the
     * overlay hides and stops blocking touches — the user left the guided path
     * (e.g. pressed back). The tour resumes if the target reappears. Default: 1200.
     */
    waitingGraceMs?: number
    /** Android: hardware back closes the tour (counts as skip). Default: false. */
    dismissOnBack?: boolean
    /** Replace the default tooltip entirely. */
    renderTooltip?: (api: TooltipApi) => ReactNode
    /**
     * Extra content rendered above the dim on every step (mascots, illustrations,
     * step-specific decorations). Return null for steps that need nothing.
     */
    renderExtra?: (api: TooltipApi) => ReactNode
    onTourStart?: (tourId: string) => void
    onStepChange?: (tourId: string, stepIndex: number, step: TourStep) => void
    onTourComplete?: (tourId: string) => void
    /** Fired on stop() before the last step — carries the step the user left on. */
    onTourSkip?: (tourId: string, stepIndex: number) => void
    /** A step's target never mounted within targetTimeoutMs; the step was skipped. */
    onStepTargetMissing?: (tourId: string, step: TourStep) => void
    /** Fired when the user taps the target of a 'target-press' step. */
    onTargetPress?: (tourId: string, stepIndex: number, step: TourStep) => void
}

export interface TourControls {
    start: (tourId: string, steps: TourStep[], options?: { startAt?: number }) => void
    stop: () => void
    next: () => void
    back: () => void
    active: ActiveTour | null
}

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
