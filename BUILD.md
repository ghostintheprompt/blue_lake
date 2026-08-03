# Building Blue Lake Studio

Blue Lake Studio is a local web dashboard backed by an Express/Vite server.

## Requirements

- Node.js 18+
- npm
- Android platform tools (`adb`) only if you want armed Fire TV control

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

The server binds to `127.0.0.1` by default. Set `HOST=0.0.0.0` only if you
need another trusted device on your LAN to open the dashboard.

## Dry-Run First

By default:

```bash
BLUE_LAKE_ENABLE_ADB=false
```

The app logs the exact ADB command it would run without controlling the TVs.
Use this to verify names, IPs, and roles.

## Armed Local ADB

After enabling ADB Debugging on your Fire TVs and confirming their IPs:

```bash
BLUE_LAKE_ENABLE_ADB=true
```

Restart the server. Controls will now send real ADB commands to the configured
devices on your local network.

## Discovery

Discovery has two modes:

- dry-run checks configured display ports and previews the local subnet plan;
- armed mode probes the local subnet for open ADB ports.

Use a narrow explicit list when your LAN is busy:

```bash
BLUE_LAKE_DISCOVERY_IPS=192.0.2.50,192.0.2.51
```

The probe is intentionally simple: it looks for a reachable ADB port, then the
health check confirms whether `adb` can connect and whether the device is
authorized.

The addresses above are reserved documentation examples. Put real Fire TV IPs
only in your ignored `.env`.

## Health Checks

Run health checks from the dashboard or with:

```bash
curl -s -X POST http://127.0.0.1:3000/api/studio/health-check \
  -H 'Content-Type: application/json' \
  -d '{}'
```

In armed mode this confirms:

- TCP reachability on the configured ADB port;
- `adb connect` behavior;
- `adb devices` state;
- Fire TV model and product metadata when authorized.

`missing-adb` means Android platform tools are not installed or not on `PATH`.
`unauthorized` means the Fire TV prompt still needs to be accepted.

## Presets And Shortcuts

The dashboard exposes a quick deck for physical-controller style use:

| Key | Preset |
|---|---|
| `R` | Room Ready |
| `C` | Capture Proof |
| `D` | DaVinci Review |
| `V` | Client Review |
| `S` | Sleep Room |

This maps cleanly to Stream Deck buttons or a small browser window pinned on the
Mac. Package and URL targets are configured through `.env`.

## Build

```bash
npm run lint
npm run build
```

The static frontend is written to `dist/`. In production mode the same server
serves that directory.

```bash
NODE_ENV=production npm run dev
```

## Test Plan

See [TESTING.md](TESTING.md) for dry-run UI checks, API checks, armed local ADB
validation, local media testing, and the open-source privacy checklist.

At minimum before a public commit:

```bash
npm run lint
npm run build
npm audit
git diff --check
```

## Troubleshooting

- **TV does not respond:** run `adb connect <tv-ip>:5555` manually and accept
  the prompt on the Fire TV.
- **Discovery finds nothing:** wake the Fire TVs, confirm both devices are on
  the same LAN, and try `BLUE_LAKE_DISCOVERY_IPS` with known IPs.
- **Wrong device:** keep dry-run on until the command log shows the intended
  serial/IP.
- **Review URL does not open:** use a URL reachable from the Fire TV, not
  `localhost` on the Mac.
- **Color looks wrong:** Fire TVs are client/reference displays. Use calibrated
  direct output for final color decisions.
