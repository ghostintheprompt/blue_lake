# Blue Lake Studio Punch List

## Completed

- [x] Add a repo-level punch list for the next studio-control tranche.
- [x] Add LAN discovery for configured Fire TVs and local ADB candidates.
- [x] Add display health checks for TCP reachability, ADB state, authorization,
  and device metadata.
- [x] Add Capture One, DaVinci, Client Review, Room Ready, and Sleep Room
  presets.
- [x] Add keyboard shortcuts and a compact quick deck suitable for Stream Deck
  style mapping.
- [x] Add a more controller-like dashboard flow with discovery, presets, and
  diagnostics available from the main surface.
- [x] Document `.env` knobs for discovery limits, explicit IP lists, launch
  targets, and review URLs.
- [x] Add an open-source-safe testing guide with dry-run, API, armed-local,
  media, and pre-commit privacy checks.
- [x] Replace committed example addresses with reserved documentation IPs so
  real studio network details stay only in ignored local config.

## Needs Physical Studio Validation

- [ ] Confirm real ADB behavior against the two actual Fire TVs.
- [ ] Confirm each TV accepts the pairing prompt and persists authorization.
- [ ] Confirm preferred receiver app package names for Capture One proofing and
  DaVinci/client review.
- [ ] Tune presets around the real room routine after one tether session and one
  Resolve review session.

## Later Polish

- [ ] Add a native macOS menu-bar wrapper if the browser quick deck becomes a
  daily-use tool.
- [ ] Add Stream Deck profile export once final shortcuts and presets settle.
- [ ] Add saved room profiles for alternate monitor layouts.
