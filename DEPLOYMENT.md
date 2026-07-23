# RouteShip Railway deployment

This repository is intended to run on Railway only.

Use Railway services for:

- `backend/` as the Node.js API service
- `courier-cart-client/` as the app frontend service
- `admin-dashboard/` as the admin frontend service
- `landing/` as the public landing frontend service

For monorepo deployments, set each Railway service root directory to the matching folder
above. The landing service includes its own `railway.json`, `nixpacks.toml`, and `start`
script so Railway can build the Vite app and serve `dist/` on the injected `PORT`.

Keep all production values in Railway service variables, not committed env files.

Recommended Railway variables:

- Backend: `DATABASE_URL`, `API_URL`, `PUBLIC_API_URL`, `CORS_ALLOWED_ORIGINS`, auth secrets, courier/provider secrets
- Client/admin/landing: `VITE_API_URL` or the framework-specific public API URL variable used by that package

Innofulfill can be configured from the admin credentials card or these backend variables:

- `INNOFULFILL_API_BASE`
- `INNOFULFILL_API_KEY`
- `INNOFULFILL_USERNAME`
- `INNOFULFILL_PASSWORD`
- `INNOFULFILL_TENANT_ID`
- `INNOFULFILL_USER_ID`
- `INNOFULFILL_SIGNIN_TYPE`
- `INNOFULFILL_WEBHOOK_SIGNATURE_KEY`

Shopify OAuth deployment needs these Railway/GitHub secrets:

- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_SCOPES` optional; defaults to the Shiplifi order/product/webhook/fulfillment scopes
- `SHOPIFY_SEND_OAUTH_SCOPE` optional; defaults to `false` because Shopify app config manages scopes

Set `SHOPIFY_USE_EXPIRING_OFFLINE_TOKENS=true` for the multi-merchant OAuth flow.
After the secrets are present, run the backend Shopify OAuth smoke check to verify the Railway production redirect URI, signed state, offline grant shape, and callback HMAC validation without printing secrets.
