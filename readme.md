# driver-native

**driver.js-style product tours for React Native** — animated spotlight, tooltips, interactive steps. Pure JS, Fabric-ready, zero native code.

- 🔦 **Moving spotlight** — a dimmed overlay with a rounded cutout that *springs* from element to element, drawn as a single even-odd SVG path (renders correctly on the New Architecture, unlike `Mask`-based libraries)
- 👆 **Interactive steps** — `advanceOn: 'target-press'` makes the user tap the *real* highlighted element; its own `onPress` runs (navigation, actions), then the tour advances
- 🧭 **Navigation-agnostic** — the tour never navigates; when the next step's target lives on another screen, it simply waits for it to mount (with a timeout). Works with react-navigation, expo-router, anything
- 🪶 **Zero native code, zero hard dependencies** — peer deps only: `react-native-svg` + `react-native-reanimated`. Works in Expo (including Expo Go) and bare RN
- 🎨 **Fully themeable** — colors, radii, labels, or replace the whole tooltip with `renderTooltip`
- 📊 **App-owned side effects** — analytics, haptics, and persistence plug in via callbacks; the library stores nothing

## Install

```sh
npm install driver-native
```

Peer dependencies (you likely have them already):

```sh
npx expo install react-native-svg react-native-reanimated
```

## Usage

**1. Wrap your app** (above your navigator, inside gesture/safe-area providers):

```tsx
import { TourProvider } from 'driver-native'

export default function App() {
    return (
        <TourProvider>
            <Navigation />
        </TourProvider>
    )
}
```

**2. Mark targets** — wrap any element a tour should spotlight:

```tsx
import { TourTarget } from 'driver-native'

<TourTarget id='home.menu-button'>
    <MenuButton />
</TourTarget>
```

**3. Drive the tour:**

```tsx
import { useTour, type TourStep } from 'driver-native'

const steps: TourStep[] = [
    {
        target: 'home.menu-button',
        title: 'Your menu lives here',
        text: 'Tap Menu to open it.',
        advanceOn: 'target-press' // user must tap the real button — it navigates as usual
    },
    {
        target: 'menu.import-card', // on the next screen — the tour waits for it to mount
        title: 'Import your menu',
        text: 'Snap a photo and let AI do the typing.'
    }
]

const tour = useTour()
tour.start('first-run', steps)
```

## API

### `<TourProvider>`

| Prop | Default | Description |
| --- | --- | --- |
| `theme` | see below | Deep-partial `TourTheme` — dim/ring colors, spotlight padding/radius, tooltip colors |
| `labels` | `Next/Back/Skip/Done/…` | Button labels (i18n) |
| `targetTimeoutMs` | `5000` | How long to wait for a step's target to mount before skipping the step |
| `pressAdvanceDelayMs` | `150` | Delay after a `target-press` so the element's own `onPress` runs first |
| `waitingGraceMs` | `1200` | If a step's target stays unmounted past this (user navigated away, e.g. back), the overlay hides and stops blocking touches; the tour resumes if the target reappears |
| `renderTooltip` | built-in | `(api: TooltipApi) => ReactNode` — replace the tooltip entirely |
| `renderExtra` | — | `(api: TooltipApi) => ReactNode` — extra content above the dim on any step (mascots, illustrations); return null for steps that need nothing |
| `onTourStart` `onStepChange` `onTourComplete` `onTourSkip` `onStepTargetMissing` `onTargetPress` | — | Lifecycle callbacks — wire up analytics, haptics, persistence |

### `TourStep`

| Field | Default | Description |
| --- | --- | --- |
| `target` | — | `TourTarget` id to spotlight; omit for an intro/modal step (full dim, centered tooltip, Next button) |
| `title` / `text` | — | Tooltip content |
| `advanceOn` | `'next'` | `'next'` (button) or `'target-press'` (tap the real element) |
| `padding` / `radius` | theme | Per-step spotlight overrides |
| `tooltipPlacement` | `'auto'` | `'auto' \| 'above' \| 'below'` |

### `useTour()`

`{ start(tourId, steps, { startAt? }), stop(), next(), back(), active }` — `active` is `{ tourId, stepIndex, step, totalSteps } | null`.

### Touch model

On every step, four invisible views tile the screen *around* the spotlight and swallow touches — the only touchable region is the real element inside the cutout. On `'next'` steps the cutout is covered too. `TourTarget` observes taps in the capture phase and never blocks or re-implements the child's own touch handling.

### Resuming across sessions

The library keeps no state. Persist progress yourself via callbacks:

```tsx
<TourProvider
    onStepChange={(tourId, stepIndex) => AsyncStorage.setItem(`tour:${tourId}`, String(stepIndex))}
    onTourComplete={tourId => AsyncStorage.setItem(`tour:${tourId}`, 'done')}
>
```

…and pass `{ startAt }` to `tour.start()`.

## Known caveats

- Targets inside scroll views must be on-screen when their step activates; auto-scroll is on the roadmap.
- The overlay measures its own window offset and subtracts it from target coordinates, so status-bar/inset differences (esp. Android) are corrected automatically.
- `onTouchEndCapture` fires on any touch release inside the target, including the end of a scroll gesture that started there. In practice targets are buttons, where this is the desired tap.

## License

MIT © Satender Kumar
