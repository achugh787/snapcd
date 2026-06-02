# snapcd

> Automatically snapshot your local dev environment every time you `cd` into a project, and diff any two snapshots to see exactly what changed.

Solves the "it worked yesterday" problem — instead of guessing why your app broke, run one command and see exactly what changed in your environment.

## Install

```sh
npm install -g snapcd
```

## What it tracks

Each snapshot captures:

- Node.js version
- npm version
- All globally installed npm packages and versions
- Environment variables (sensitive values like `KEY`, `TOKEN`, `SECRET`, `PASSWORD` are automatically redacted)
- PATH entries
- Currently listening ports
- Current working directory, hostname, platform
- Timestamp and optional label

## Commands

```sh
snapback save [label]          # Save a snapshot with an optional label
snapback diff                  # Diff the two most recent snapshots
snapback diff <label1> <label2> # Diff any two named snapshots
snapback list                  # List all snapshots for the current project
snapback show <label>          # Show full details of a specific snapshot
snapback hook                  # Output shell hook for auto-snapshotting on cd
snapback clean [-n <number>]   # Delete old snapshots, keep last N (default: 10)
```

## Auto-snapshot on `cd`

Add this to your `.zshrc` or `.bashrc`:

```sh
eval "$(snapback hook)"
```

Every time you `cd` into a directory, `snapback` silently saves a snapshot in the background (under 100ms, no interruption to your workflow). Same trick used by `nvm` and `direnv`.

## Diff output

```
Snapback diff: "before-upgrade" → "after-upgrade"
Project: my-app

Core
  ✅ Node.js : v20.11.0
  ⚠️  npm     : 9.8.1 → 10.2.4
  ✅ CWD     : /Users/me/projects/my-app

Global npm Packages
┌─────────────────┬────────────┬───────────────────────┐
│ Package         │ Status     │ Detail                │
├─────────────────┼────────────┼───────────────────────┤
│ typescript      │ ⚠️  changed │ 4.9.5 → 5.3.2        │
│ vercel          │ ✚ added    │ 33.0.0                │
│ netlify-cli     │ ✗ removed  │ 17.0.0                │
└─────────────────┴────────────┴───────────────────────┘

Open Ports
  ✚ 3000
  ✗ 8080
```

## Storage

All snapshots stored locally in `~/.snapback/<project-name>/snapshots.json`. No cloud, no database, no account required.

## License

MIT
