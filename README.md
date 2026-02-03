# Peg’s Solitaire (Electron)

Classic Klondike Solitaire built with Electron so it runs on macOS, Windows, and Linux. Created in memory of Peg.

## Gameplay
- Standard Klondike rules: build down in alternating colors on the tableau; build foundations Ace → King by suit.
- Click stock to draw; click waste to select; click/empty tableau columns to place Kings; click foundation or top card to place the next rank.
- “Auto Move” sends obvious cards to foundations; hints highlight valid targets when a card/stack is selected.

## Prerequisites
- Node.js 18+ and npm.
- Internet access to install dependencies from npm.

## Setup
```bash
npm install
```

## Run in development
```bash
npm run start
```
Launches the Electron app with live reload disabled (simple run). Set `ELECTRON_DEVTOOLS=true` to auto-open DevTools.

## Build installers
```bash
npm run dist
```
Creates platform-specific installers using `electron-builder`:
- macOS: `.dmg`
- Windows: NSIS installer
- Linux: AppImage and `.deb`

Outputs go to the `dist/` folder.

## Project structure
- `main.js` — Electron main process / window setup.
- `preload.js` — Secure bridge exposing minimal platform info.
- `src/index.html` — UI shell.
- `src/styles.css` — Modern styling and animations.
- `src/renderer.js` — Game logic (deal, moves, hints, auto-move).

## Troubleshooting
- If `npm install` fails with network errors, retry when online or configure your proxy.
- On Apple Silicon, allow the app in System Settings → Privacy & Security if macOS blocks unsigned builds.

Enjoy the game, and thanks for playing in Peg’s memory.
