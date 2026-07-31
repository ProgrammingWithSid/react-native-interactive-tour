import type { RefObject } from 'react'
import type { ScrollView, View } from 'react-native'

/**
 * Ready-made onRequestScroll implementation for targets inside a ScrollView:
 *
 *     const scrollRef = useRef<ScrollView>(null)
 *     const target = useTourTarget('receipt.confirm', {
 *         onRequestScroll: () => scrollTargetIntoView(target.ref, scrollRef)
 *     })
 *
 * Measures the target relative to the scroll view's content and scrolls it
 * into view, leaving `offsetY` px of breathing room above it.
 */
export function scrollTargetIntoView(
    target: RefObject<View | null>,
    scrollView: RefObject<ScrollView | null>,
    offsetY = 100
): void {
    const scrollNode = scrollView.current
    const targetNode = target.current
    if (!scrollNode || !targetNode) return

    const innerNode = (
        scrollNode as unknown as { getInnerViewNode?: () => number }
    ).getInnerViewNode?.()

    targetNode.measureLayout(
        (innerNode ?? scrollNode) as unknown as number,
        (_x, y) => scrollNode.scrollTo({ y: Math.max(0, y - offsetY), animated: true }),
        () => {}
    )
}
