# react-native-interactive-tour example

Minimal Expo app exercising the tour engine: passive steps, an interactive `target-press` step that navigates, and a cross-screen step that waits for its target to mount.

## Run

```sh
npx create-expo-app tmp-example --template blank-typescript
cd tmp-example
npx expo install react-native-svg react-native-reanimated
npm install ../..            # link react-native-interactive-tour from the repo root
cp ../App.tsx App.tsx
npx expo start
```

(The example is kept as a single `App.tsx` rather than a committed Expo project so the package repo stays free of a second dependency tree.)
