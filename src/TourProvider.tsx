import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { StyleSheet, View } from 'react-native'
import { TourContext, type TargetEvent, type TourContextValue } from './context'
import { defaultLabels, mergeTheme } from './theme'
import { TourOverlay } from './TourOverlay'
import type { ActiveTour, Rect, TourProviderProps, TourStep } from './types'

interface ActiveState {
    tourId: string
    steps: TourStep[]
    stepIndex: number
}

export function TourProvider({
    children,
    theme: themeProp,
    labels: labelsProp,
    targetTimeoutMs = 5000,
    pressAdvanceDelayMs = 150,
    waitingGraceMs = 1200,
    renderTooltip,
    renderExtra,
    onTourStart,
    onStepChange,
    onTourComplete,
    onTourSkip,
    onStepTargetMissing,
    onTargetPress
}: TourProviderProps) {
    const theme = useMemo(() => mergeTheme(themeProp), [themeProp])
    const labels = useMemo(() => ({ ...defaultLabels, ...labelsProp }), [labelsProp])

    const [active, setActive] = useState<ActiveState | null>(null)
    const [rect, setRect] = useState<Rect | null>(null)
    // Bumped when the active step's target unmounts (e.g. the user navigated back)
    // so the activation effect re-arms its wait-for-target flow.
    const [waitRevision, setWaitRevision] = useState(0)
    // Prevents duplicate onStepChange announcements when the effect re-arms.
    const lastAnnouncedStep = useRef('')

    const targets = useRef(new Map<string, RefObject<View | null>>())
    const registrationListeners = useRef(new Set<(id: string) => void>())
    // Guards stale async callbacks (measure/timeout) after the step has moved on.
    const activationToken = useRef(0)

    // Refs so stable callbacks (used in effects/timeouts) always see current state.
    const activeRef = useRef<ActiveState | null>(null)
    activeRef.current = active

    const callbacksRef = useRef({ onTourStart, onStepChange, onTourComplete, onTourSkip, onStepTargetMissing, onTargetPress })
    callbacksRef.current = { onTourStart, onStepChange, onTourComplete, onTourSkip, onStepTargetMissing, onTargetPress }

    const measureStep = useCallback(
        (step: TourStep, token: number) => {
            if (!step.target) return false
            const ref = targets.current.get(step.target)
            const node = ref?.current
            if (!node) return false
            node.measureInWindow((x, y, w, h) => {
                if (token !== activationToken.current) return
                if (!(w > 0) || !(h > 0)) return
                const padding = step.padding ?? theme.spotlightPadding
                setRect({
                    x: x - padding,
                    y: y - padding,
                    w: w + 2 * padding,
                    h: h + 2 * padding,
                    r: step.radius ?? theme.spotlightRadius
                })
            })
            return true
        },
        [theme]
    )

    const goToStep = useCallback((state: ActiveState | null) => {
        activationToken.current += 1
        setRect(null)
        setActive(state)
    }, [])

    const finish = useCallback((reason: 'complete' | 'skip') => {
        const current = activeRef.current
        if (!current) return
        activationToken.current += 1
        setActive(null)
        setRect(null)
        if (reason === 'complete') callbacksRef.current.onTourComplete?.(current.tourId)
        else callbacksRef.current.onTourSkip?.(current.tourId, current.stepIndex)
    }, [])

    const next = useCallback(() => {
        const current = activeRef.current
        if (!current) return
        if (current.stepIndex >= current.steps.length - 1) finish('complete')
        else goToStep({ ...current, stepIndex: current.stepIndex + 1 })
    }, [finish, goToStep])

    const back = useCallback(() => {
        const current = activeRef.current
        if (!current || current.stepIndex === 0) return
        goToStep({ ...current, stepIndex: current.stepIndex - 1 })
    }, [goToStep])

    const stop = useCallback(() => finish('skip'), [finish])

    const start = useCallback(
        (tourId: string, steps: TourStep[], options?: { startAt?: number }) => {
            if (!steps.length) return
            const stepIndex = Math.min(Math.max(options?.startAt ?? 0, 0), steps.length - 1)
            lastAnnouncedStep.current = ''
            goToStep({ tourId, steps, stepIndex })
            callbacksRef.current.onTourStart?.(tourId)
        },
        [goToStep]
    )

    // Activate the current step: measure its target, or wait for it to register.
    useEffect(() => {
        if (!active) return
        const token = activationToken.current
        const step = active.steps[active.stepIndex]
        const stepKey = `${active.tourId}:${active.stepIndex}`
        if (lastAnnouncedStep.current !== stepKey) {
            lastAnnouncedStep.current = stepKey
            callbacksRef.current.onStepChange?.(active.tourId, active.stepIndex, step)
        }

        // Target-less intro/modal step — nothing to measure or wait for.
        if (!step.target) return

        if (measureStep(step, token)) return

        const timeout = setTimeout(() => {
            if (token !== activationToken.current) return
            callbacksRef.current.onStepTargetMissing?.(active.tourId, step)
            next()
        }, targetTimeoutMs)

        const onRegistered = (id: string) => {
            if (token !== activationToken.current || id !== step.target) return
            // Let the target lay out before measuring.
            requestAnimationFrame(() => {
                if (token !== activationToken.current) return
                if (measureStep(step, token)) clearTimeout(timeout)
            })
        }
        registrationListeners.current.add(onRegistered)

        return () => {
            clearTimeout(timeout)
            registrationListeners.current.delete(onRegistered)
        }
    }, [active, waitRevision, measureStep, next, targetTimeoutMs])

    const registerTarget = useCallback((id: string, ref: RefObject<View | null>) => {
        targets.current.set(id, ref)
        registrationListeners.current.forEach(listener => listener(id))
    }, [])

    const unregisterTarget = useCallback((id: string) => {
        targets.current.delete(id)
        // If the active step's target just unmounted (screen popped / user went
        // back), drop the stale spotlight and re-enter the wait-for-target flow —
        // the overlay's grace timer then hides it and releases touches.
        const current = activeRef.current
        if (current && current.steps[current.stepIndex].target === id) {
            setRect(null)
            setWaitRevision(revision => revision + 1)
        }
    }, [])

    const notifyTargetEvent = useCallback(
        (id: string, event: TargetEvent) => {
            const current = activeRef.current
            if (!current) return
            const step = current.steps[current.stepIndex]
            if (step.target !== id) return

            if (event === 'layout') {
                measureStep(step, activationToken.current)
            } else if (event === 'press' && (step.advanceOn ?? 'next') === 'target-press') {
                callbacksRef.current.onTargetPress?.(current.tourId, current.stepIndex, step)
                // Let the target's own onPress (navigation, actions) run first.
                setTimeout(next, pressAdvanceDelayMs)
            }
        },
        [measureStep, next, pressAdvanceDelayMs]
    )

    const activeTour: ActiveTour | null = useMemo(
        () =>
            active
                ? {
                      tourId: active.tourId,
                      stepIndex: active.stepIndex,
                      step: active.steps[active.stepIndex],
                      totalSteps: active.steps.length
                  }
                : null,
        [active]
    )

    const contextValue: TourContextValue = useMemo(
        () => ({ start, stop, next, back, active: activeTour, rect, registerTarget, unregisterTarget, notifyTargetEvent }),
        [start, stop, next, back, activeTour, rect, registerTarget, unregisterTarget, notifyTargetEvent]
    )

    return (
        <TourContext.Provider value={contextValue}>
            <View style={styles.root}>
                {children}
                {activeTour && (
                    <TourOverlay
                        active={activeTour}
                        rect={rect}
                        theme={theme}
                        labels={labels}
                        renderTooltip={renderTooltip}
                        renderExtra={renderExtra}
                        waitingGraceMs={waitingGraceMs}
                        next={next}
                        back={back}
                        stop={stop}
                    />
                )}
            </View>
        </TourContext.Provider>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1 }
})
