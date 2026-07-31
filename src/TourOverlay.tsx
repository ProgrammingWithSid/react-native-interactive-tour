import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
    AccessibilityInfo,
    BackHandler,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
    type LayoutChangeEvent
} from 'react-native'
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated'
import Svg, { Path, type PathProps } from 'react-native-svg'
import { roundedRectPath } from './geometry'
import { computeTooltipLayout } from './placement'
import { DefaultTooltip } from './Tooltip'
import type { ActiveTour, Rect, TooltipApi, TourLabels, TourTheme } from './types'

const AnimatedPath = Animated.createAnimatedComponent(Path)

const SPRING = { damping: 18, stiffness: 180, mass: 0.6 }

interface TourOverlayProps {
    active: ActiveTour
    rect: Rect | null
    theme: TourTheme
    labels: TourLabels
    renderTooltip?: (api: TooltipApi) => ReactNode
    renderExtra?: (api: TooltipApi) => ReactNode
    waitingGraceMs: number
    dismissOnBack: boolean
    next: () => void
    back: () => void
    stop: () => void
}

export function TourOverlay({
    active,
    rect,
    theme,
    labels,
    renderTooltip,
    renderExtra,
    waitingGraceMs,
    dismissOnBack,
    next,
    back,
    stop
}: TourOverlayProps) {
    const window = useWindowDimensions()
    // Actual laid-out size of the overlay (can differ from the window on Android
    // depending on system bars); window dimensions are only the pre-layout fallback.
    const [size, setSize] = useState({ w: window.width, h: window.height })
    const W = size.w
    const H = size.h

    // measureInWindow returns window coordinates, but this overlay's origin may
    // not be the window origin (status bar / insets, esp. Android). Measure our
    // own window offset and subtract it from every target rect.
    const rootRef = useRef<View>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const onRootLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout
        setSize(prev => (prev.w === width && prev.h === height ? prev : { w: width, h: height }))
        rootRef.current?.measureInWindow((x, y) => {
            setOffset(prev => (prev.x === x && prev.y === y ? prev : { x, y }))
        })
    }

    const adjustedRect = useMemo<Rect | null>(
        () => (rect ? { ...rect, x: rect.x - offset.x, y: rect.y - offset.y } : null),
        [rect, offset]
    )

    // Intro/modal step: no target — full dim, centered tooltip.
    const isIntro = !active.step.target

    // When a step's target stays unmounted beyond the grace window, the user has
    // left the guided path (e.g. pressed back). Hide the overlay and release all
    // touches — the tour resumes automatically if the target shows up again.
    const [suppressed, setSuppressed] = useState(false)
    useEffect(() => {
        if (rect || isIntro) {
            setSuppressed(false)
            return
        }
        const timeout = setTimeout(() => setSuppressed(true), waitingGraceMs)
        return () => clearTimeout(timeout)
    }, [rect, isIntro, active.tourId, active.stepIndex, waitingGraceMs])

    const hx = useSharedValue(W / 2)
    const hy = useSharedValue(H * 0.45)
    const hw = useSharedValue(0)
    const hh = useSharedValue(0)
    const hr = useSharedValue(theme.spotlightRadius)
    const appeared = useRef(false)

    useEffect(() => {
        if (adjustedRect) {
            if (!appeared.current) {
                // First spotlight of the tour with no prior anchor: appear in place.
                hx.value = adjustedRect.x
                hy.value = adjustedRect.y
                hw.value = adjustedRect.w
                hh.value = adjustedRect.h
                hr.value = adjustedRect.r
            } else {
                hx.value = withSpring(adjustedRect.x, SPRING)
                hy.value = withSpring(adjustedRect.y, SPRING)
                hw.value = withSpring(adjustedRect.w, SPRING)
                hh.value = withSpring(adjustedRect.h, SPRING)
                hr.value = withSpring(adjustedRect.r, SPRING)
            }
            appeared.current = true
        } else if (isIntro) {
            // Collapse to screen center; the next target's spotlight grows out of it.
            hx.value = withTiming(W / 2, { duration: 150 })
            hy.value = withTiming(H * 0.45, { duration: 150 })
            hw.value = withTiming(0, { duration: 150 })
            hh.value = withTiming(0, { duration: 150 })
            appeared.current = true
        } else if (appeared.current) {
            // Waiting for the next screen's target: collapse the hole in place.
            hx.value = withTiming(hx.value + hw.value / 2, { duration: 150 })
            hy.value = withTiming(hy.value + hh.value / 2, { duration: 150 })
            hw.value = withTiming(0, { duration: 150 })
            hh.value = withTiming(0, { duration: 150 })
        }
    }, [adjustedRect, isIntro, W, H, hx, hy, hw, hh, hr])

    const dimProps = useAnimatedProps<PathProps>(() => ({
        d: `M0,0H${W}V${H}H0Z` + roundedRectPath(hx.value, hy.value, hw.value, hh.value, hr.value)
    }))

    const ringProps = useAnimatedProps<PathProps>(() => ({
        d: roundedRectPath(hx.value, hy.value, hw.value, hh.value, hr.value)
    }))

    const topBlocker = useAnimatedStyle(() => ({ left: 0, right: 0, top: 0, height: Math.max(hy.value, 0) }))
    const bottomBlocker = useAnimatedStyle(() => ({ left: 0, right: 0, top: hy.value + hh.value, bottom: 0 }))
    const leftBlocker = useAnimatedStyle(() => ({
        left: 0,
        top: hy.value,
        width: Math.max(hx.value, 0),
        height: hh.value
    }))
    const rightBlocker = useAnimatedStyle(() => ({
        left: hx.value + hw.value,
        right: 0,
        top: hy.value,
        height: hh.value
    }))
    const holeBlocker = useAnimatedStyle(() => ({
        left: hx.value,
        top: hy.value,
        width: hw.value,
        height: hh.value
    }))

    const interactive = (active.step.advanceOn ?? 'next') === 'target-press'
    const free = active.step.mode === 'free'

    const tooltipApi: TooltipApi = {
        step: active.step,
        stepIndex: active.stepIndex,
        totalSteps: active.totalSteps,
        isFirst: active.stepIndex === 0,
        isLast: active.stepIndex === active.totalSteps - 1,
        labels,
        theme,
        next,
        back,
        stop
    }

    // Screen-reader users hear each step as it appears.
    useEffect(() => {
        const message = [active.step.title, active.step.text].filter(Boolean).join('. ')
        if (message) AccessibilityInfo.announceForAccessibility(message)
    }, [active.tourId, active.stepIndex, active.step.title, active.step.text])

    // Optional: Android hardware back closes the tour instead of navigating.
    useEffect(() => {
        if (!dismissOnBack) return
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            stop()
            return true
        })
        return () => subscription.remove()
    }, [dismissOnBack, stop])

    const tooltipStyle = computeTooltipLayout(adjustedRect, isIntro, H, active.step.tooltipPlacement).style

    return (
        <View ref={rootRef} onLayout={onRootLayout} style={StyleSheet.absoluteFill} pointerEvents='box-none'>
            {!suppressed && (
                <Animated.View
                    style={StyleSheet.absoluteFill}
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    pointerEvents='box-none'
                >
                    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents='none'>
                        {!free && <AnimatedPath animatedProps={dimProps} fill={theme.dimColor} fillRule='evenodd' />}
                        <AnimatedPath
                            animatedProps={ringProps}
                            fill='none'
                            stroke={theme.ringColor}
                            strokeWidth={theme.ringWidth}
                        />
                    </Svg>

                    {/* Touch blockers around the spotlight — the hole itself stays touchable on
                        interactive steps. Free-mode steps block nothing at all. */}
                    {!free && (
                        <>
                            <AnimatedBlocker style={topBlocker} />
                            <AnimatedBlocker style={bottomBlocker} />
                            <AnimatedBlocker style={leftBlocker} />
                            <AnimatedBlocker style={rightBlocker} />
                            {!interactive && <AnimatedBlocker style={holeBlocker} />}
                        </>
                    )}

                    {(adjustedRect !== null || isIntro) && (
                        <Animated.View
                            key={`${active.tourId}:${active.stepIndex}`}
                            entering={FadeIn.duration(180)}
                            style={[styles.tooltipWrap, tooltipStyle]}
                            pointerEvents='box-none'
                        >
                            {renderTooltip ? renderTooltip(tooltipApi) : <DefaultTooltip api={tooltipApi} />}
                        </Animated.View>
                    )}

                    {/* App-provided decorations (mascots, illustrations) above the dim */}
                    {renderExtra && (
                        <Animated.View
                            key={`extra:${active.tourId}:${active.stepIndex}`}
                            entering={FadeIn.duration(250)}
                            style={StyleSheet.absoluteFill}
                            pointerEvents='box-none'
                        >
                            {renderExtra(tooltipApi)}
                        </Animated.View>
                    )}
                </Animated.View>
            )}
        </View>
    )
}

function AnimatedBlocker({ style }: { style: ReturnType<typeof useAnimatedStyle> }) {
    return (
        <Animated.View style={[styles.blocker, style]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} />
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    blocker: { position: 'absolute' },
    tooltipWrap: { position: 'absolute', left: 16, right: 16 }
})
