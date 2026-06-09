# loginOrCreateUser

Status: implementation draft. Core logic is test-covered, but this function is not deployed or wired into production yet.

## Responsibility

- Read `_openid` from WeChat cloud function context.
- Find or create the current user in `users`.
- Initialize `user_stats`, default achievements, and default inventory for new users.
- Update `lastLoginAt`.
- Return the minimal profile payload needed by the client.

## Request

```json
{}
```

The client must not send `_openid`.

## Response Shape

```json
{
  "userId": "user_xiaobu_001",
  "isNewUser": false,
  "profile": {}
}
```

`profile` must map to the frontend `UserProfile` shape.

## Collections

- `users`
- `user_stats`
- `achievements`
- `inventory_items`

## Safety Notes

- Do not trust a client-provided user id.
- Do not return `_openid`.
- Keep nickname and avatar data non-sensitive by default.
- If custom avatars are added later, require the privacy and deletion flow first.

## Next Implementation Step

Deploy this function in the selected WeChat cloud environment, then add a manual verification note showing `_openid` is available from `cloud.getWXContext()`.

## Local Coverage

- `index.cjs` contains the current implementation draft and WeChat cloud function entry.
- `tests/login-or-create-user-cloudfunction.test.mjs` covers new-user initialization, existing-user login refresh, and missing `_openid` rejection.
