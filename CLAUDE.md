# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # expo start (Metro dev server)
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run reset      # expo start --clear (purge Metro cache)
```

No test runner, linter, or formatter configured. TypeScript strict mode is on; rely on `tsc` via the editor / `npx tsc --noEmit` for type checks.

## Environment

Requires two `EXPO_PUBLIC_*` vars (see `lib/supabase.ts`):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

App scheme is `tennisraptor://` (`app.json`). For native Google OAuth in Expo Go, the redirect URI is `exp://<lan-ip>:8081` — `signInWithGoogle` logs `redirectTo` at runtime; that exact URL must be registered in Supabase Auth → Redirect URLs.

## Architecture

Expo SDK 52 + React Native 0.76 + expo-router v4 (file-based routing, typed routes enabled). New Architecture (Fabric) is on. UI is dark-mode-only; copy is Portuguese (pt-BR).

### Routing layers (`app/`)

`app/_layout.tsx` is the root Stack. It wraps everything in `AuthProvider` and an `AuthGate` that redirects based on session:
- no session + outside `/auth` → `/auth/login`
- session + inside `/auth` → `/(tabs)`

Route groups:
- `(tabs)/` — main bottom-tab UI (home, players, tournaments, history, profile)
- `auth/` — login / signup / forgot / OAuth callback
- `match/` — `new` (modal), `[id]` detail
- `tournament/` — `new` (modal), `[id]` detail
- `player/[id]` — player detail
- `onboarding.tsx` — gated, no back gesture

When adding a new screen outside `(tabs)`, also register a `<Stack.Screen>` in `app/_layout.tsx` if it needs custom header / presentation options.

### Auth (`lib/AuthContext.tsx`, `lib/supabase.ts`)

Single Supabase client, platform-aware storage adapter: `localStorage` on web (SSR-guarded — `expo-router` does static export), `AsyncStorage` on native. `detectSessionInUrl` is web-only.

Native Google OAuth uses the **implicit flow** (tokens in URL fragment), not PKCE:
1. `signInWithGoogle` calls `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true`.
2. iOS: `WebBrowser.openAuthSessionAsync` (ASWebAuthenticationSession) intercepts the redirect.
3. Android: falls back to `Linking.openURL` because Chrome Custom Tabs may be unavailable; the OS Intent reopens the app, and the `Linking.addEventListener('url', ...)` listener picks it up.
4. `createSessionFromUrl` parses `access_token` + `refresh_token` from the URL and calls `supabase.auth.setSession`.

Cold-start deep links are handled by `Linking.getInitialURL()` in the same effect. Don't switch this to PKCE without also changing the redirect parsing.

### State (`stores/`)

Three Zustand stores act as in-memory caches over Supabase tables. Hydration runs from `lib/useHydrate.ts`, called inside `AuthGate` — every session change triggers `loadAll(userId)` on each store; sign-out calls `reset()`. Mutations are async: each writes through to Supabase, then updates local state on success. There is no AsyncStorage persistence — the source of truth is the database.

IDs are generated client-side with `Crypto.randomUUID()` from `expo-crypto` (see `lib/db.ts:newId`) so optimistic local state can use the same UUID that gets inserted.

- `useMatchStore` — matches loaded from Supabase; `logMatch`, approvals (`approveMatch` / `rejectMatch`), deletes/updates, and helpers (`getPendingForMe`, `getPlayerMatches`, `getPlayerStats`).
- `usePlayerStore` — players + `myPlayerId` (the user's own profile player, `isMe: true`; DB has a partial unique index enforcing one `is_me` row per owner). `setupMe(userId, name, handle)` upserts the me-player. `getH2H(p1, p2, matches)` takes matches as an arg to avoid cross-store coupling — pass `useMatchStore.getState().matches`.
- `useTournamentStore` — tournaments + groups. Membership lives in `tournament_players` / `group_members` junction tables; `loadAll` fans out and reconstructs the denormalized `playerIds` / `memberIds` arrays. `getStandings` / `getGroupStandings` take `allMatches` for the same reason; sort order is points → set diff → game diff (3 pts per win, no draws).

When stats need players × matches together, the call site joins them — stores never import each other.

Row mappers (snake_case ↔ camelCase) and DB row types live in `lib/db.ts`. Every mutation in a store should also have its mapping there if it touches a new column.

### Database (`supabase/migrations/`)

Single migration `0001_init.sql` defines: `profiles` (1:1 with `auth.users`, auto-created via trigger from `raw_user_meta_data.full_name`), `players`, `matches`, `tournaments` + `tournament_players`, `groups` + `group_members`. Every owned table has an `owner_id uuid` column and RLS policies that gate every operation by `auth.uid() = owner_id`. Junction tables gate by parent ownership via `exists` subqueries. Apply via the Supabase SQL editor or `supabase db push`.

### Types and theme

`constants/types.ts` is the single source of truth for domain types (`Match`, `Player`, `Tournament`, etc.). `constants/theme.ts` exports `Colors`, `Spacing`, `Radius`, `Font`, and `SurfaceColors` (per-surface accent). Use these instead of hardcoding hex / numbers.

### Path alias

`@/*` maps to repo root (`tsconfig.json`). Existing code uses relative imports — match the surrounding file.
