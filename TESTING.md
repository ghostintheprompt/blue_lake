# Testing Blue Lake Studio

Blue Lake is open source, so testing should prove behavior without committing
private studio details. Keep real IPs, SSIDs, device serials, client names, media
filenames, screenshots, and `.env` values out of git.

The examples below use reserved documentation IPs from `192.0.2.0/24`. Replace
them only in your local `.env`, which is ignored by git.

## Privacy Rules

Before sharing a branch, issue, screenshot, or log:

- keep `BLUE_LAKE_ENABLE_ADB=false` unless you are testing on your private LAN;
- do not commit `.env`;
- do not paste real Fire TV IPs, MAC addresses, ADB serials, SSIDs, gateways,
  DNS servers, hostnames, or review URLs;
- do not commit client footage, client filenames, EXIF/GPS metadata, or room
  screenshots that reveal network details;
- leave the in-app privacy toggle on for public screenshots;
- use `Client Proof TV`, `Reference Playback TV`, and documentation IPs in docs
  and examples.

## Static Checks

Run these before every commit:

```bash
npm install
npm run lint
npm run build
npm audit
git diff --check
```

Expected result:

- TypeScript exits cleanly;
- Vite production build completes;
- `npm audit` reports no known vulnerabilities;
- `git diff --check` reports no whitespace errors.

## Dry-Run UI Test

Dry-run mode is the default and is safe for public/local testing because it logs
the ADB commands without sending them to hardware.

1. Create a local config:

```bash
cp .env.example .env
```

2. Confirm `.env` stays in dry-run:

```bash
BLUE_LAKE_ENABLE_ADB=false
FIRE_TV_A_IP=192.0.2.50
FIRE_TV_B_IP=192.0.2.51
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://127.0.0.1:3000`.

5. Verify these UI paths:

- top bar shows `ADB dry run`;
- Display cards render TV A and TV B with documentation IPs;
- `Wake`, `Home`, `Mute`, and volume buttons add dry-run commands to the log;
- mode buttons switch Capture One, DaVinci, Client Review, and Mirror Check;
- Quick Deck presets run without touching hardware;
- Discovery opens the discovery panel and shows dry-run candidates;
- Health Check returns dry-run reachability status;
- Settings panel does not reveal real network details when privacy is on.

## Dry-Run API Test

With the dev server running, test the core endpoints:

```bash
curl -s http://127.0.0.1:3000/api/studio/status

curl -s -X POST http://127.0.0.1:3000/api/studio/display/a/control \
  -H 'Content-Type: application/json' \
  -d '{"action":"wake"}'

curl -s -X POST http://127.0.0.1:3000/api/studio/preset/room-ready/run

curl -s -X POST http://127.0.0.1:3000/api/studio/health-check \
  -H 'Content-Type: application/json' \
  -d '{}'

curl -s http://127.0.0.1:3000/api/studio/discover
```

Expected result:

- responses include `"adbEnabled":false`;
- action details include `DRY RUN`;
- no real LAN address, SSID, serial, or client data appears in output.

## Armed Local ADB Test

Run this only on devices you own or administer on your private studio LAN.

1. Install Android platform tools so `adb` is available.
2. Enable Developer Options and ADB Debugging on each Fire TV.
3. Put real TV IPs only in your ignored `.env`.
4. Start armed mode:

```bash
npm run dev:armed
```

5. Open the dashboard and run Health Check.
6. Accept the pairing prompt on each Fire TV.
7. Verify:

- health state becomes `connected`;
- model/product metadata appears;
- `Wake`, `Home`, `Mute`, and `Sleep` affect only the intended TV;
- Discovery finds only expected local devices;
- Quick Deck presets match the actual room routine.

Do not paste armed-mode logs into public issues without redacting IPs, serials,
hostnames, and review URLs.

## Local Media Test

Use synthetic or personal test clips only.

1. Put a short generated clip in `public/media`.
2. Open the Media shelf.
3. Confirm the item appears and opens through `/api/stream/...`.
4. Remove the test file before committing unless it is intentionally licensed
   sample media.

## Pre-Commit Privacy Check

Run a final scan before publishing:

```bash
git status --ignored -sb

rg -n "([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}|@|client-|ssid|gateway|dns|serial|/Users/" \
  README.md BUILD.md TESTING.md .env.example PUNCHLIST.md src server.ts manifest.json

rg -n "192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[0-1])\\." \
  README.md BUILD.md TESTING.md .env.example PUNCHLIST.md src server.ts manifest.json
```

The scans are intentionally conservative. Review matches by hand and keep only
generic examples or reserved documentation addresses in committed files.
