import { useEffect, useRef, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useTourContext } from './context'

interface TourTargetProps {
    id: string
    children: ReactNode
    style?: StyleProp<ViewStyle>
}

/**
 * Wraps a real UI element so a tour step can spotlight it. Renders a plain
 * View (collapsable={false} so it stays measurable on Android) and reports
 * layout changes and taps to the tour engine. It never intercepts or blocks
 * the child's own touch handling.
 */
export function TourTarget({ id, children, style }: TourTargetProps) {
    const { registerTarget, unregisterTarget, notifyTargetEvent } = useTourContext()
    const ref = useRef<View>(null)

    useEffect(() => {
        registerTarget(id, ref)
        return () => unregisterTarget(id)
    }, [id, registerTarget, unregisterTarget])

    return (
        <View
            ref={ref}
            collapsable={false}
            style={style}
            onLayout={() => notifyTargetEvent(id, 'layout')}
            onTouchEndCapture={() => notifyTargetEvent(id, 'press')}
        >
            {children}
        </View>
    )
}
