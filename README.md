# ARIAS Estimator

Estimating and proposal tool for ARIAS Interior Systems (drywall + metal stud
framing). Next.js 14 web app, also installable as a Progressive Web App (PWA)
and packaged for iOS / Android via Capacitor for app-store submission.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Google Generative AI (plan extraction)
- `@react-pdf/renderer` (proposal export)
- Capacitor 8 (native iOS + Android shells)

---

## Local development (web)

```bash
npm install
npm run dev          # http://localhost:3000
```

Other useful scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Production Next.js build (PWA-capable) |
| `npm start` | Run the production build on port 3000 |
| `npm run lint` | Next.js lint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run icons` | Regenerate placeholder PWA + native icons |

---

## Running as a PWA

The app is installable from any modern browser when served over HTTPS.

What's wired up:

- `public/manifest.json` — name, icons, theme color (`#0052CC`), `display: standalone`
- `public/sw.js` — manual service worker (no build step). Registers on `load`,
  caches the app shell + static assets, network-first for navigations,
  network-only for `/api/*` (so estimates and signatures stay fresh)
- `app/layout.tsx` — apple-mobile-web-app meta tags, theme color, icon links
- `public/icons/*` — placeholder PNGs at 72/96/128/144/152/167/180/192/256/384/512/1024,
  plus `apple-touch-icon.png` and `favicon-{16,32}.png`

To install:

1. `npm run build && npm start` (or deploy to any HTTPS host that supports
   Next.js — Vercel, Render, Fly, your own Node host).
2. Open the app in Safari (iOS), Chrome (Android), or any Chromium browser.
3. Use **Add to Home Screen** (mobile) or the install icon in the URL bar
   (desktop). The browser will use `manifest.json` and the service worker for
   offline shell support.

> The service worker only registers on **production** builds (`npm run build`
> + `npm start` or any non-dev deployment). In `next dev` it stays out of the
> way to avoid stale caches during development.

### Replacing the placeholder icons

The icons in `public/icons/` and `resources/` are generated from
`scripts/generate-icons.py` and use the `LogoMark` design (blue rounded square
with a white "A"). To replace them with finished art:

1. Drop a 1024×1024 master into `resources/icon.png` (and a 1024×1024
   transparent foreground into `resources/icon-foreground.png` for adaptive
   Android icons).
2. Re-run the generator (or use `@capacitor/assets` for sharper resizing):

   ```bash
   npm run icons
   # or, recommended for production art:
   npx @capacitor/assets generate --iconBackgroundColor '#ffffff' \
                                  --iconBackgroundColorDark '#0052CC' \
                                  --splashBackgroundColor '#ffffff'
   ```

3. `npx cap sync` to copy the new icons into the iOS / Android projects.

---

## Building for native (Capacitor)

The native shells live in `ios/` and `android/`. Configuration is in
`capacitor.config.ts` (`appId: com.ariasinterior.estimator`).

### One-time setup per machine

- **iOS** — macOS + Xcode 15+ + CocoaPods (`sudo gem install cocoapods`)
- **Android** — Android Studio (Hedgehog or newer) + Android SDK + JDK 17

### Build pipeline

```bash
npm run cap:build      # CAPACITOR_BUILD=1 next build && npx cap sync
npm run cap:ios        # opens ios/App.xcworkspace in Xcode
npm run cap:android    # opens android/ in Android Studio
```

`cap:build` produces a static export under `out/` (driven by the
`CAPACITOR_BUILD=1` switch in `next.config.mjs`, which sets
`output: 'export'`) and then runs `npx cap sync` to copy the bundle into both
native projects.

> **Architectural note.** This app currently includes API routes
> (`app/api/extract`, `app/api/sign`) and a dynamic route (`app/sign/[id]`).
> Static export cannot include them, so the native shells expect those
> endpoints to be reachable on a hosted origin. Before the first native build:
>
> 1. Deploy the Next.js app (with `next build`, no static export) to a real
>    host so `/api/extract` and `/api/sign` are reachable over HTTPS.
> 2. Either point the native client at that origin via
>    `capacitor.config.ts` `server.url`, or convert each `fetch('/api/...')`
>    call in `components/*.tsx` to use a configurable base URL
>    (`process.env.NEXT_PUBLIC_API_BASE`).
> 3. Add `generateStaticParams()` to `app/sign/[id]/page.tsx` (returning the
>    set of signature ids you want to ship in the static bundle, or an empty
>    array if signing is exclusively backend-served).
>
> The PWA path (`npm run build`) does **not** have this constraint — it ships
> the full server-rendered app and works with the existing API routes today.

### iOS (App Store)

```bash
npm run cap:build
npm run cap:ios
```

Inside Xcode:

1. Set your Team in **Signing & Capabilities**.
2. Bump **Version** / **Build** under General.
3. **Product → Archive**, then **Distribute App → App Store Connect → Upload**.
4. In [App Store Connect](https://appstoreconnect.apple.com): create the app
   record (bundle id `com.ariasinterior.estimator`), attach the build, fill
   metadata + screenshots (required sizes: 6.7"/iPhone, 5.5"/iPhone,
   12.9"/iPad), submit for review.

Replace the placeholder app icon at
`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` with the
final 1024×1024 PNG before submitting (or run `npx @capacitor/assets
generate` as described above).

### Android (Google Play)

```bash
npm run cap:build
npm run cap:android
```

Inside Android Studio:

1. **Build → Generate Signed Bundle / APK → Android App Bundle**.
2. Create or select a release keystore (keep the `.jks` and passwords safe —
   you cannot rotate without resetting your Play listing).
3. Build the **release** AAB.
4. In [Play Console](https://play.google.com/console): create the app
   (package `com.ariasinterior.estimator`), upload the AAB to **Production**
   (or **Internal testing** first), fill content rating, data safety, and
   store listing (icon, feature graphic, screenshots), and submit for review.

Replace placeholder launcher icons under
`android/app/src/main/res/mipmap-*/ic_launcher*.png` before submitting.

---

## Project layout

```
app/                    Next.js App Router (UI + API routes)
components/             React components for each step
lib/                    Estimate math, types, defaults
public/
  icons/                PWA icons (multiple sizes)
  manifest.json         PWA manifest
  sw.js                 Manual service worker
resources/              Source assets for `npx @capacitor/assets generate`
android/                Capacitor Android project (gradle)
ios/                    Capacitor iOS project (Xcode workspace)
capacitor.config.ts     Capacitor app id, name, webDir, native flags
next.config.mjs         Next config; toggles `output: 'export'` for native
scripts/generate-icons.py  Placeholder icon generator (PIL)
```

---

## Troubleshooting

- **`cap:build` errors with `Page "/sign/[id]" is missing "generateStaticParams()"`** —
  expected with the current architecture; see the architectural note above.
- **`pod install` fails on iOS** — `cd ios/App && pod repo update && pod install`.
- **Android build can't find SDK** — create `android/local.properties` with
  `sdk.dir=/path/to/Android/sdk`.
- **PWA icon doesn't update after change** — bump the `VERSION` constant in
  `public/sw.js` to bust the service worker cache, then hard-refresh.
