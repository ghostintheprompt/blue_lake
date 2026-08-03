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

## Troubleshooting

- **TV does not respond:** run `adb connect <tv-ip>:5555` manually and accept
  the prompt on the Fire TV.
- **Wrong device:** keep dry-run on until the command log shows the intended
  serial/IP.
- **Review URL does not open:** use a URL reachable from the Fire TV, not
  `localhost` on the Mac.
- **Color looks wrong:** Fire TVs are client/reference displays. Use calibrated
  direct output for final color decisions.
