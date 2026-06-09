# saveGameState

Status: implementation draft. Core logic is test-covered, but this function is not deployed or wired into production yet.

## Responsibility

- Save the current user's profile stats, records, achievements, check-in state, and inventory.
- Infer the current user from `_openid`.
- Reject saves when `state.profile.id` does not belong to the current `_openid`.
- Ignore client-submitted leaderboard rows.

## Request

```json
{
  "state": {
    "profile": {},
    "achievements": [],
    "checkIn": {},
    "leaderboard": []
  }
}
```

The client must not send `_openid`.

## Response Shape

```json
{
  "profile": {},
  "achievements": [],
  "checkIn": {},
  "leaderboard": []
}
```

`leaderboard` is intentionally returned as an empty array in the draft response. The real ranking source is `getLeaderboard`.

## Collections

- `users`
- `user_stats`
- `achievements`
- `checkins`
- `inventory_items`

## Safety Notes

- Do not trust a client-provided user id unless it matches the `_openid` owner.
- Do not persist `_openid` from request payloads.
- Do not write leaderboard rows from the client.
- Save only known fields; drop unknown client payload fields.

## Next Implementation Step

Deploy this function after the core collections exist, then verify writes in the real WeChat cloud database.

## Local Coverage

- `index.cjs` contains the current implementation draft and WeChat cloud function entry.
- `tests/save-game-state-cloudfunction.test.mjs` covers profile/stat saves, achievements/check-in/inventory saves, user mismatch rejection, missing `_openid`, and leaderboard write avoidance.
