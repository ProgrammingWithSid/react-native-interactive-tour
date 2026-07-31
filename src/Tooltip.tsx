import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { TooltipApi } from './types'

export function DefaultTooltip({ api }: { api: TooltipApi }) {
    const { step, stepIndex, totalSteps, isFirst, isLast, labels, theme, next, back, stop } = api
    const t = theme.tooltip
    const interactive = (step.advanceOn ?? 'next') === 'target-press'

    return (
        <View style={[styles.card, { backgroundColor: t.backgroundColor, borderRadius: t.borderRadius }]}>
            <View style={styles.header}>
                {totalSteps > 1 && (
                    <View style={styles.dots}>
                        {Array.from({ length: totalSteps }, (_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    { backgroundColor: i === stepIndex ? t.buttonColor : t.secondaryTextColor, opacity: i === stepIndex ? 1 : 0.35 }
                                ]}
                            />
                        ))}
                    </View>
                )}
                <Pressable onPress={stop} hitSlop={12} accessibilityRole='button' accessibilityLabel={labels.skip}>
                    <Text style={[styles.skip, { color: t.secondaryTextColor }]}>{labels.skip}</Text>
                </Pressable>
            </View>

            <Text style={[styles.title, { color: t.titleColor }]}>{step.title}</Text>
            {!!step.text && <Text style={[styles.text, { color: t.textColor }]}>{step.text}</Text>}

            <View style={styles.footer}>
                {!isFirst ? (
                    <Pressable onPress={back} hitSlop={8} accessibilityRole='button' accessibilityLabel={labels.back}>
                        <Text style={[styles.back, { color: t.secondaryTextColor }]}>{labels.back}</Text>
                    </Pressable>
                ) : (
                    <View />
                )}

                {interactive ? (
                    <Text style={[styles.hint, { color: t.secondaryTextColor }]}>{labels.targetHint}</Text>
                ) : (
                    <Pressable
                        onPress={next}
                        accessibilityRole='button'
                        accessibilityLabel={isLast ? labels.done : labels.next}
                        style={[styles.button, { backgroundColor: t.buttonColor, borderRadius: t.borderRadius / 1.6 }]}
                    >
                        <Text style={[styles.buttonText, { color: t.buttonTextColor }]}>{isLast ? labels.done : labels.next}</Text>
                    </Pressable>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dots: { flexDirection: 'row', gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    skip: { fontSize: 13 },
    title: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
    text: { fontSize: 14, lineHeight: 20 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    back: { fontSize: 14 },
    hint: { fontSize: 13, fontStyle: 'italic', flexShrink: 1, textAlign: 'right' },
    button: { paddingHorizontal: 18, paddingVertical: 9 },
    buttonText: { fontSize: 14, fontWeight: '600' }
})
