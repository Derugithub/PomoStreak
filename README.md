# PomoStreak

Offline focus timer for iOS and Android. Work in timed blocks, take breaks, and keep a daily streak. Everything stays on the device: there is no account, no backend, and no cloud sync.

After the JavaScript bundle has loaded, the app works in airplane mode.

## Run it

```bash
npm install
npx expo start
```

Then open the project in Expo Go, an iOS simulator, or an Android emulator. The dev server needs a network connection to deliver the bundle. After that load, timer, history, and settings do not need a connection.

Useful scripts:

- `npm test` — streak day counting and focus-completion rules
- `npm start` — same as `npx expo start`
- `npx expo start --ios` / `--android` — open a simulator if one is installed

Node.js 20 or newer is required. This project uses Expo SDK 57 and Expo Router.

## What it does

- Two short onboarding screens explain that data stays on device and how streaks work. No permissions are requested there.
- The timer runs Focus (25m), Short break (5m), and Long break (15m). After every 4 finished focus sessions, the next phase is a long break. Start, pause, resume, skip, and reset.
- The countdown is based on an absolute end time, so backgrounding the app does not drift the clock. A local notification can fire when the session ends if the system allows it. Permission is requested only when you start a session or turn notifications on. Declining it does not block the timer.
- A finished focus session counts toward today and the streak. Breaks are logged, but they do not. The current streak is consecutive calendar days with at least one finished focus. If today is still empty, yesterday’s run remains until the day ends.
- Settings for durations, the long-break interval, a short chime, and haptics are stored locally. Sound and haptics fail quietly when the device cannot play them.
- The streak screen shows the current and longest runs, this week, a month calendar, and today’s finished sessions.

To try a full cycle without waiting, set Focus to 1 minute in Settings.

## Brand assets

The shipped images are placeholders so Expo Go can boot. Replace them with a brand pack later:

| Path | Use |
| --- | --- |
| `assets/images/icon.png` | App icon (1024×1024) |
| `assets/images/splash-icon.png` | Splash mark on `#0C0C0E` |
| `assets/images/favicon.png` | Web favicon |
| `assets/images/android-icon-foreground.png` | Android adaptive foreground |
| `assets/images/android-icon-background.png` | Android adaptive background |
| `assets/images/android-icon-monochrome.png` | Android monochrome icon |
| `assets/sounds/complete.wav` | Session-end chime |

`scripts/generate-placeholder-assets.py` redraws these placeholders.
