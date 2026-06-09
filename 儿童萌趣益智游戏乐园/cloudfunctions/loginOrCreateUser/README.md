# loginOrCreateUser

Status: planning skeleton only. No deployable cloud function code yet.

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

Create the real WeChat cloud function entry after cloud environment selection, then add a tiny integration test or manual verification note showing `_openid` is available.
