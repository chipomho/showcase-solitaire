# Solitaire

An unfinished Klondike table in React and TypeScript. It deals a game and lets you move
cards around, but it doesn't know the rules yet. What it shows is the plumbing: a seeded
shuffle, reducer-driven state shared through context, and drag and drop written directly
against Pointer Events.

## What it does

- Deals from a numbered, reproducible shuffle (Fisher-Yates over mulberry32). The deal
  number is in the header and the address bar, so `?deal=48213` always gives the same table.
- Clicking the stock turns a card onto the waste; an empty stock turns the waste back over.
- Any face-up card, with the cards on top of it, can be dragged onto any other pile by
  mouse, pen or touch. Uncovered face-down cards turn over.
- Without dragging: click (or press Enter on) a card, then the pile it should go to.
  Escape cancels, and moves are announced to screen readers.
- Cards are drawn with CSS and Unicode suit symbols, with no image assets.

Not done yet: move rules, scoring, win detection and undo.

## Running it

Needs Node 24 or later.

```sh
npm ci
npm run dev       # http://localhost:5173
npm run check     # typecheck, lint, then tests with coverage (100% thresholds)
```

## Containers

`compose.yaml` serves the build from unprivileged nginx (read-only filesystem, strict CSP)
behind Traefik. A one-off `certificates` service creates a local CA and a wildcard
certificate for `*.showcases.chipomho.local`.

```sh
docker compose up --build -d
curl --cacert .certs/ca.crt --resolve solitaire.showcases.chipomho.local:443:127.0.0.1 \
  https://solitaire.showcases.chipomho.local/
```

To use a browser, map `solitaire.showcases.chipomho.local` to 127.0.0.1 in your hosts file
and trust `.certs/ca.crt`. `SHOWCASES_HTTP_PORT` and `SHOWCASES_HTTPS_PORT` move Traefik off
80 and 443, and the HTTP redirect follows. `SHOWCASES_CA_DIR` shares one CA between
projects; create that directory first, because Podman won't create a missing bind mount.
With Podman, build with `DOCKER_BUILDKIT=0 COMPOSE_BAKE=false` so it uses its own builder.

## How it's put together

- `src/game` is plain TypeScript: cards, the PRNG and shuffle, the deal, and the reducer.
  Piles are arrays from bottom to top, keyed by ids like `tableau-3`. The reducer has four
  actions (`newGame`, `draw`, `recycleWaste`, `moveCards`) and deliberately no rules; it
  only refuses nonsense such as moving a face-down card.
- `src/state` holds `GameProvider`: one `useReducer`, with state and dispatch in separate
  contexts.
- `src/table` has the components and `useCardDrag`, a small idle/pressed/dragging state
  machine. The pressed card captures the pointer, so moves and the release come back to it
  for any pointer type. After 4px of travel it becomes a drag. A preview with
  `pointer-events: none` follows the pointer while the originals turn transparent, and the
  drop target is the nearest `data-drop-target` above `document.elementFromPoint`.

Tests use Testing Library and user-event, including mouse and multi-touch pointer
sequences. jsdom has no layout, so tests stub `elementFromPoint` to say what's under the
pointer.
