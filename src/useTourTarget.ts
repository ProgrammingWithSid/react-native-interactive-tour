import { useEffect, useMemo, useRef, type RefObject } from 'react'
import type { View } from 'react-native'
import { useTourContext, type TargetOptions } from './context'

export interface TourTargetHandle {
    /** Attach to the component the tour should spotlight (any host component). */
    ref: RefObject<View | null>
    /** Spread onto the same component so the spotlight re-measures on layout. */
    onLayout: () => void
    /** Spread onto the same component so 'target-press' steps can advance. */
    onTouchEndCapture: () => void
}

/**
 * Ref-based alternative to <TourTarget> — makes an existing component a tour
 * target WITHOUT introducing a wrapper View (so no layout side effects):
 *
 *     const target = useTourTarget('home.menu-button')
 *     <Pressable ref={target.ref} onLayout={target.onLayout}
 *         onTouchEndCapture={target.onTouchEndCapture} ...>
 */
export function useTourTarget(id: string, options?: TargetOptions): TourTargetHandle {
    const { registerTarget, unregisterTarget, notifyTargetEvent } = useTourContext()
    const ref = useRef<View>(null)

    const optionsRef = useRef(options)
    optionsRef.current = options

    useEffect(() => {
        registerTarget(id, ref, optionsRef.current)
        return () => unregisterTarget(id)
    }, [id, registerTarget, unregisterTarget])

    return useMemo(
        () => ({
            ref,
            onLayout: () => notifyTargetEvent(id, 'layout'),
            onTouchEndCapture: () => notifyTargetEvent(id, 'press')
        }),
        [id, notifyTargetEvent]
    )
}
