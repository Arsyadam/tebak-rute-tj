# Multiplayer Production Test — Bug Fix Plan

**Date:** 2026-07-26  
**Environment:** https://transitguessr.arsyadam.id  
**Scope:** Host + joiner PeerJS race (`Halte di Rute`), share links, roster, start sync

## Verdict

Lobby + start race mostly works. **Live score sync is broken in one direction and can double-count in the other.** Multiplayer is not fair/reliable until the critical fix ships.

## What passed

| Flow | Result |
|---|---|
| Host guest login → create room → share link | Pass |
| Deep link `/?room=CODE` pre-fills code + Friends tab | Pass |
| Room code survives joiner login | Pass |
| Join + roster (host ↔ joiner names) | Pass |
| Host Start race → both enter same round/seed | Pass |
| Hint disabled in multiplayer (`Hint hanya solo`) | Pass |
| Host guess → joiner eventually sees host on board | Pass (but score can be wrong) |

## Bugs found

### P0 — Joiner scores never reach host

- **ID:** `joiner-score-not-synced-to-host`
- **Evidence:** Joiner scored `Blok M` (924 pts local). Host race board kept `ScoreJoin` at 0.
- **Root cause (code):** In `GameRoom.join()`, connection is opened with `waitOpen(conn)` **before** `wireConn(conn)`. `wireConn` only adds the conn inside `conn.on('open')`, but `open` already fired → joiner `connections` stays empty → `broadcast()` no-ops → host never gets `guess-stop`.

```81:96:src/lib/multiplayer.ts
  static async join(user: UserProfile, code: string): Promise<GameRoom> {
    // ...
    const conn = peer.connect(roomPeerId(code.toUpperCase()), { reliable: true })
    await waitOpen(conn)
    room.wireConn(conn) // open already happened → conn never stored
    conn.send({ type: 'hello', player: self })
```

- **Fix:**
  1. In `wireConn`, if `conn.open`, immediately `connections.set(conn.peer, conn)`.
  2. Or register `wireConn` before `waitOpen`, or pass conn into constructor after open and set it directly.
  3. Add unit/integration assert: after join, `room.connections.size >= 1`.

### P1 — Host scores can double on joiner

- **ID:** `host-score-double-applied-on-joiner`
- **Evidence:** Host scored 937; joiner board showed host as **1874** (2×).
- **Root cause:** `sendGuessStop` runs local `onGuessStop` → `applyScore` (host broadcasts `score-sync`) **then** broadcasts `guess-stop`. Joiner applies `score-sync` (sets 937) then handles `guess-stop` → `applyScore` again (+937).
- **Fix (pick one authoritative path):**
  - **Preferred:** Only broadcast `guess-stop`. Receivers apply via `onGuessStop`. Host does not also `score-sync` from that path — OR `score-sync` becomes full replace without receivers also adding from `guess-stop`.
  - **Alternative:** On `guess-stop`, if stop already claimed skip; on `score-sync`, also mark claimed stop IDs (needs richer payload: include claimed stop ids).
  - Simplest immediate fix: `applyScore` should not broadcast when called from `onGuessStop` that originated locally after already broadcasting; better: change `sendGuessStop` to only `broadcast(guess-stop)` and let **only host** apply + `score-sync` once when receiving (including echo to self via host handler). Cleanest protocol:
    1. Any client sends `guess-stop`.
    2. Host is authority: applies score, marks stop, broadcasts `score-sync` + optional `stop-claimed`.
    3. Non-hosts never `applyScore` from raw `guess-stop` except optimistically with reconciliation — or only host processes `guess-stop`.

### P2 — Share link does not auto-join after login

- **ID:** `no-auto-join-from-share-link`
- **Evidence:** `/?room=KHDB3` fills code, but after guest login user must still click **Join**.
- **Fix:** When `user` becomes available and `room` query param (or `roomCode`) is set and `!room`, auto-call `joinRoom()` once (guard with ref to avoid double join).

### P3 — Joiner lobby UX noise

- **ID:** `joiner-sees-host-share-ui` / sticky `Gabung room…` status
- **Evidence:** After join, joiner still sees “Bagikan link room” + Copy; status can remain “Gabung room CODE…”.
- **Fix:** Show share link only if `room.isHost`. Set status to `Sudah gabung · menunggu host` on successful join; clear busy/status properly.

## Implementation plan

### Sprint slice A — correctness (ship first)

1. Fix `wireConn` open-race (P0) in `src/lib/multiplayer.ts`.
2. Fix scoring protocol double-apply (P1) in `multiplayer.ts` + `NameStopsGame.tsx` handler.
3. Add a small Playwright (or scripted) smoke:
   - host+joiner room
   - joiner scores a stop → host board updates once
   - host scores a stop → joiner board matches host (not 2×)
4. Deploy to Dokploy and re-run production E2E.

### Sprint slice B — join UX

1. Auto-join from `?room=` after auth (P2).
2. Host-only share link + clearer joiner status (P3).

### Out of scope (watchlist)

- PeerJS public broker reliability / self-host PeerServer
- Reconnect if host refreshes mid-race
- Persisting multiplayer results as a single room session in DB

## Acceptance criteria

- [x] Joiner correct stop → host race score for joiner increases within ~1s
- [x] Host correct stop → joiner shows the **same** host score (not 2×)
- [x] Opening share link → login → lands in room without extra Join click
- [x] Only host sees Copy share link
- [x] Production Playwright host/joiner suite green on `transitguessr.arsyadam.id`

**Shipped:** commit `3af92e0` — verified live 2026-07-26 (joiner→host 926=926, host→joiner 846=846, auto-join OK).

## Suggested order of code changes

1. `src/lib/multiplayer.ts` — connection registry + message protocol
2. `src/components/NameStopsGame.tsx` — align with host-authoritative scoring if needed
3. `src/components/Landing.tsx` — auto-join + host-only share UI
4. Redeploy + production retest
