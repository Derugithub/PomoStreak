# PomoStreak

## Overview

Offline focus timer for iOS and Android. Work in timed blocks, take breaks, and keep a daily streak. Everything stays on the device: there is no account, no backend, and no cloud sync.

After the JavaScript bundle has loaded, the app works in airplane mode.

The dev server needs a network connection to deliver the bundle. After that load, timer, history, and settings do not need a connection.

`app.json` names the app PomoStreak, version 1.0.0, slug `pomostreak`. The interface is portrait and dark. iOS supports tablet. The URL scheme is `pomostreak`.

## Features

- Two short onboarding screens explain that data stays on device and how streaks work. No permissions are requested there.
- The timer runs Focus (25m), Short break (5m), and Long break (15m). After every 4 finished focus sessions, the next phase is a long break. Start, pause, resume, skip, and reset.
- The countdown is based on an absolute end time, so backgrounding the app does not drift the clock. A local notification can fire when the session ends if the system allows it. Permission is requested only when you start a session or turn notifications on. Declining it does not block the timer.
- A finished focus session counts toward today and the streak. Breaks are logged, but they do not. The current streak is consecutive calendar days with at least one finished focus. If today is still empty, yesterday’s run remains until the day ends.
- Settings for durations, the long-break interval, a short chime, and haptics are stored locally. Sound and haptics fail quietly when the device cannot play them.
- The streak screen shows the current and longest runs, this week, a month calendar, and today’s finished sessions.
- The app has three tabs: Timer, Streak, and Settings.
- Completed sessions are stored newest first, up to 180. Streak day counts are stored separately from that list.
- The Settings screen states there is no account, no analytics, and nothing to sync.

To try a full cycle without waiting, set Focus to 1 minute in Settings.

## Requirements

- Node.js 20 or newer.
- npm. The repository includes `package-lock.json`.
- Expo SDK 57 (`expo` `~57.0.26`) and Expo Router (`expo-router` `~57.0.24`).
- Expo Go, an iOS simulator, or an Android emulator.

[TODO: minimum iOS and Android versions are not stated in this repository.]

## Installation

```bash
npm install
```

[TODO: store or binary install steps are not documented in this repository.]

## Configuration

The app does not read environment variables. No `.env` file is part of the project.

Session settings, history, the timer, and onboarding state are stored on the device with AsyncStorage:

| Key | Contents |
| --- | --- |
| `pomostreak.settings.v1` | Durations, long-break interval, sound, haptics, notifications |
| `pomostreak.history.v1` | Completed sessions and focus-day counts |
| `pomostreak.timer.v1` | Current phase and countdown |
| `pomostreak.meta.v1` | Whether onboarding is complete |

Defaults and allowed ranges in `src/core/settings.ts`:

| Setting | Default | Range |
| --- | --- | --- |
| Focus | 25 minutes | 1–180 |
| Short break | 5 minutes | 1–60 |
| Long break | 15 minutes | 1–90 |
| Long break every | 4 finished focus sessions | 2–12 |
| Sound | off | on or off |
| Haptics | on | on or off |
| Notifications | on | on or off |

Idle phases use the new length. A running timer keeps its end time. Paused time is kept, and capped if it is longer than the new length.

`app.json` also sets:

- iOS bundle identifier and Android package `com.pomostreak.app`
- App background `#0C0C0E`
- Splash and Android adaptive-icon backgrounds `#0B0A0F`
- Splash image `./assets/images/splash-icon.png` at width 140
- Notification color `#E07A4C`
- `expo-audio` with microphone permission off, Android audio recording off, and background playback off
- Web output `static`, with favicon `./assets/images/favicon.png`
- Typed routes and the React compiler experiments

[TODO: release signing and environment-specific build configuration are not in this repository.]

## Usage

```bash
npx expo start
```

Then open the project in Expo Go, an iOS simulator, or an Android emulator.

The first launch shows two onboarding screens. **Continue** advances; **Begin** finishes onboarding and opens the timer. Later launches skip onboarding.

Timer controls:

- **Start focus**, **Pause**, and **Resume** run the current phase. On a break, the primary button is **Start break** or **Start long break**.
- **Skip** leaves the current phase without counting it.
- **Reset** restores the current phase to its planned duration.

The Streak tab shows the current run, the longest run, today’s finished focus count, this week, a month calendar through the current month, and today’s finished sessions.

Settings changes durations, how many finished focus sessions precede a long break, the session-end chime, haptics, and notifications.

Local notifications are skipped on web. Notification permission checks there return ungranted.

## Project structure

```
.
├── app.json
├── assets/
│   ├── images/
│   └── sounds/complete.wav
├── LICENSE
├── package.json
├── package-lock.json
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── onboarding.tsx
│   │   └── (app)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       ├── settings.tsx
│   │       └── streak.tsx
│   ├── components/
│   ├── constants/theme.ts
│   ├── core/
│   ├── services/
│   ├── state/app-state.tsx
│   └── storage/repository.ts
└── tsconfig.json
```

`src/app` holds the Expo Router screens. `src/core` holds timer, streak, date, and settings logic, plus the Node test files. `src/services` schedules local notifications and plays the session-end chime and haptics. `src/storage` reads and writes AsyncStorage. `src/state/app-state.tsx` provides that state to the screens.

### Brand assets

The app icon, splash mark, favicon, and Android adaptive icons are the PomoStreak brand pack. Splash and adaptive-icon backgrounds use `#0B0A0F`.

| Path | Use |
| --- | --- |
| `assets/images/icon.png` | App icon (1024×1024) |
| `assets/images/splash-icon.png` | Splash mark on `#0B0A0F` |
| `assets/images/favicon.png` | Web favicon |
| `assets/images/android-icon-foreground.png` | Android adaptive foreground |
| `assets/images/android-icon-background.png` | Android adaptive background |
| `assets/images/android-icon-monochrome.png` | Android monochrome icon |
| `assets/sounds/complete.wav` | Session-end chime |

## Development

```bash
npm install
npx expo start
```

Scripts in `package.json`:

- `npm test` — streak day counting and focus-completion rules, plus local date keys and clock formatting (`src/core/dates.test.ts`, `src/core/format.test.ts`, `src/core/streak.test.ts`, `src/core/session.test.ts`)
- `npm start` — same as `npx expo start`
- `npm run ios` — `expo start --ios`
- `npm run android` — `expo start --android`
- `npm run web` — `expo start --web`
- `npm run lint` — `expo lint`

`npx expo start --ios` and `npx expo start --android` open a simulator if one is installed.

`tsconfig.json` extends `expo/tsconfig.base` with `strict` enabled. `@/*` maps to `src/*`, and `@/assets/*` maps to `assets/*`. Files matching `src/core/**/*.test.ts` are excluded from the TypeScript project.

[TODO: continuous integration is not configured in this repository.]

## Contributing

[TODO: how to report issues, propose changes, and the review process.]

## License

[MIT License](LICENSE). Copyright (c) 2026 PomoStreak.
