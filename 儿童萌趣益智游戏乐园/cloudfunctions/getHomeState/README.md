# getHomeState

Status: implementation draft. Core logic is test-covered, but this function is not deployed or wired into production yet.

## Responsibility

- Read the current user's profile, stats, achievements, check-in state, inventory, and leaderboard preview.
- Return the frontend `GameState` shape.
- Avoid returning full point transaction history.

## Request

```json
{}
```

The server should infer the user from `_openid`.

## Response Shape

```json
{
  "profile": {},
  "achievements": [],
  "checkIn": {},
  "leaderboard": []
}
```

This must match `GameState` in `src/utils/gameDataService.ts`.

## Collections

- `users`
- `user_stats`
- `achievements`
- `checkins`
- `inventory_items`

Optional:

- `leaderboard_snapshots`

## Safety Notes

- Only return the current user's private state.
- Leaderboard rows must contain public display fields only.
- Do not expose `_openid`, internal audit data, or point transaction details here.

## Next Implementation Step

Deploy this function after `loginOrCreateUser`, then verify the real cloud database can return the frontend `GameState` shape without exposing `_openid`.

## Local Coverage

- `index.cjs` contains the current implementation draft and WeChat cloud function entry.
- `tests/get-home-state-cloudfunction.test.mjs` covers home-state mapping, leaderboard current-user fallback, missing `_openid`, and missing-user errors.
