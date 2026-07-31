import { createContext, useContext, type RefObject } from 'react'
import type { View } from 'react-native'
import type { ActiveTour, Rect, TourControls } from './types'

export type TargetEvent = 'layout' | 'press'

export interface TourContextValue extends TourControls {
    active: ActiveTour | null
    /** Padded spotlight rect of the active step, null while waiting for the target. */
    rect: Rect | null
    registerTarget: (id: string, ref: RefObject<View | null>) => void
    unregisterTarget: (id: string) => void
    notifyTargetEvent: (id: string, event: TargetEvent) => void
}

export const TourContext = createContext<TourContextValue | null>(null)

export function useTourContext(): TourContextValue {
    const ctx = useContext(TourContext)
    if (!ctx) throw new Error('driver-native: wrap your app in <TourProvider>.')
    return ctx
}
