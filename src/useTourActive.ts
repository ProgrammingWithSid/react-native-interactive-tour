import { useTourContext } from './context'
import type { ActiveTour } from './types'

/**
 * The currently active tour, or null. Optionally scoped to one tour id —
 * handy for components that only care whether a specific tour is running.
 */
export function useTourActive(tourId?: string): ActiveTour | null {
    const { active } = useTourContext()
    if (!active) return null
    if (tourId && active.tourId !== tourId) return null
    return active
}
