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

## WeChat Deploy Checklist

Before opening WeChat Developer Tools:

1. Run `npm.cmd run test:cloudfunctions`.
2. Run `npm.cmd run test:data-service`.
3. Keep `.env.example` at `VITE_USE_WECHAT_CLOUD=false`.
4. Confirm the real rollout notes are ready in `微信云开发真实接入操作闭环.md`.

In WeChat Developer Tools / Cloud Development:

1. Create or select the target cloud environment.
2. Create the required collections before deploying this function:
   - `users`
   - `user_stats`
   - `achievements`
   - `inventory_items`
3. Upload/deploy the folder `cloudfunctions/loginOrCreateUser`.
4. Confirm the deployed execution method is `index.main`; `index.js` forwards to the tested `index.cjs` implementation.
5. Confirm the package installs `wx-server-sdk`.
6. Manually call `loginOrCreateUser` with an empty request `{}`.

Deployment verification:

- `cloud.getWXContext().OPENID` returns a non-empty `OPENID`.
- A new user creates rows in `users`, `user_stats`, `achievements`, and `inventory_items`.
- Calling again returns the same user and refreshes `lastLoginAt`.
- The response includes `profile` but never includes `_openid`.
- A missing trusted `OPENID` path returns `UNAUTHENTICATED`.

Do not set `VITE_USE_WECHAT_CLOUD=true` yet. That switch can only be enabled after all four cloud functions pass the rollout playbook checks.

## Local Coverage

- `index.cjs` contains the current implementation draft and WeChat cloud function entry.
- `tests/login-or-create-user-cloudfunction.test.mjs` covers new-user initialization, existing-user login refresh, and missing `_openid` rejection.
