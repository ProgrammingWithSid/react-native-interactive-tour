import { type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useTourTarget } from './useTourTarget'

interface TourTargetProps {
    id: string
    children: ReactNode
    style?: StyleProp<ViewStyle>
    /** Bring the target on-screen when its step activates off-screen (see scrollTargetIntoView). */
    onRequestScroll?: () => void
}

/**
 * Wraps a real UI element so a tour step can spotlight it. Renders a plain
 * View (collapsable={false} so it stays measurable on Android) and reports
 * layout changes and taps to the tour engine. It never intercepts or blocks
 * the child's own touch handling.
 *
 * Prefer useTourTarget() when a wrapper View would disturb the layout
 * (flex rows, absolutely positioned elements, list cells).
 */
export function TourTarget({ id, children, style, onRequestScroll }: TourTargetProps) {
    const target = useTourTarget(id, { onRequestScroll })

    return (
        <View
            ref={target.ref}
            collapsable={false}
            style={style}
            onLayout={target.onLayout}
            onTouchEndCapture={target.onTouchEndCapture}
        >
            {children}
        </View>
    )
}
