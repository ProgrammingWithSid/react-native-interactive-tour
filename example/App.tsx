import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { TourProvider, TourTarget, useTour, type TourStep } from 'driver-native'

// Two fake "screens" to demonstrate a cross-screen tour without a navigation library.
export default function App() {
    return (
        <TourProvider
            onStepChange={(tourId, i) => console.log('step', tourId, i)}
            onTourComplete={tourId => console.log('complete', tourId)}
            onStepTargetMissing={(tourId, step) => console.log('target missing', tourId, step.target)}
        >
            <Demo />
        </TourProvider>
    )
}

const steps: TourStep[] = [
    { target: 'home.title', title: 'Welcome 👋', text: 'This is a passive step — hit Next.' },
    {
        target: 'home.go-menu',
        title: 'Interactive step',
        text: 'This button really navigates. Tap it to continue the tour on the next screen.',
        advanceOn: 'target-press'
    },
    { target: 'menu.sample', title: 'Cross-screen spotlight', text: 'The tour waited for this card to mount.' },
    { target: 'menu.back', title: 'All done', text: 'Back you go.', advanceOn: 'target-press' }
]

function Demo() {
    const [screen, setScreen] = useState<'home' | 'menu'>('home')
    const tour = useTour()

    return screen === 'home' ? (
        <View style={styles.screen}>
            <TourTarget id='home.title'>
                <Text style={styles.title}>driver-native example</Text>
            </TourTarget>

            <Pressable style={styles.button} onPress={() => tour.start('demo', steps)}>
                <Text style={styles.buttonText}>Start tour</Text>
            </Pressable>

            <TourTarget id='home.go-menu'>
                <Pressable style={styles.button} onPress={() => setScreen('menu')}>
                    <Text style={styles.buttonText}>Open menu screen</Text>
                </Pressable>
            </TourTarget>
        </View>
    ) : (
        <View style={styles.screen}>
            <TourTarget id='menu.sample'>
                <View style={styles.card}>
                    <Text style={styles.cardText}>🍜 Sample menu card</Text>
                </View>
            </TourTarget>

            <TourTarget id='menu.back'>
                <Pressable style={styles.button} onPress={() => setScreen('home')}>
                    <Text style={styles.buttonText}>Back home</Text>
                </Pressable>
            </TourTarget>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: '#f4f4f5' },
    title: { fontSize: 22, fontWeight: '700' },
    button: { backgroundColor: '#111', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    buttonText: { color: '#fff', fontWeight: '600' },
    card: { backgroundColor: '#fff', padding: 28, borderRadius: 16, elevation: 3 },
    cardText: { fontSize: 16 }
})
