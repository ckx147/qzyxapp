# getLeaderboard

Status: implementation draft. Core logic is test-covered, but this function is not deployed or wired into production yet.

## Responsibility

- Read leaderboard rows from `user_stats.pointsBalance`.
- Return public display fields only.
- Mark the current user row with `isCurrentUser` when it appears in the result.

## Request

```json
{
  "limit": 50,
  "scope": "global"
}
```

Migration note: the current frontend cloud port may still pass `profile` and `localFallback`. The real cloud function should ignore client-provided final points or rank.

## Response Shape

```json
{
  "leaderboard": [
    {
      "id": "public_rank_001",
      "nickname": "小布探险家",
      "avatarId": "avatar_dino",
      "points": 920
    }
  ]
}
```

## Collections

- `user_stats`
- `users`

Optional:

- `leaderboard_snapshots`

## Safety Notes

- Never return `_openid`.
- Never trust client-submitted score or rank.
- Default to cartoon avatar ids and display nicknames.
- Consider limiting scope to family/classroom before public launch if child privacy requirements tighten.

## Next Implementation Step

Deploy this function after the user collections are created, then verify the real cloud database can sort by `user_stats.pointsBalance` and return public display fields only.

## Local Coverage

- `index.cjs` contains the current implementation draft and WeChat cloud function entry.
- `tests/get-leaderboard-cloudfunction.test.mjs` covers server-side points sorting, current-user marking, limit normalization, missing `_openid`, and missing-user errors.
