import { useTourContext } from './context'
import type { TourControls } from './types'

/** Tour controls: start/stop/next/back and the currently active tour (or null). */
export function useTour(): TourControls {
    const { start, stop, next, back, active } = useTourContext()
    return { start, stop, next, back, active }
}
