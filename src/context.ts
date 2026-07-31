import { createContext, useContext, type RefObject } from 'react'
import type { View } from 'react-native'
import type { ActiveTour, Rect, TourControls } from './types'

export type TargetEvent = 'layout' | 'press'

export interface TargetOptions {
    /**
     * Called when this target's step activates but the target measures
     * off-screen (or with zero size) — bring it into view (e.g. scroll the
     * enclosing ScrollView). The engine re-measures after the scroll settles.
     */
    onRequestScroll?: () => void
}

export interface TourContextValue extends TourControls {
    active: ActiveTour | null
    /** Padded spotlight rect of the active step, null while waiting for the target. */
    rect: Rect | null
    registerTarget: (id: string, ref: RefObject<View | null>, options?: TargetOptions) => void
    unregisterTarget: (id: string) => void
    notifyTargetEvent: (id: string, event: TargetEvent) => void
}

export const TourContext = createContext<TourContextValue | null>(null)

export function useTourContext(): TourContextValue {
    const ctx = useContext(TourContext)
    if (!ctx) throw new Error('react-native-docent: wrap your app in <TourProvider>.')
    return ctx
}
