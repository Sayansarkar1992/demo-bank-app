# Demo Bank App (Automation Testing Focus)

Lightweight full-stack web app for UI + API automation testing.

## Stack
- Backend: Node.js + Express
- Frontend: Plain HTML/CSS/Vanilla JS
- API Docs: OpenAPI + Swagger UI at `/api-docs`
- Storage: In-memory users/sessions + local file uploads (`public/uploads`)

## Why this is automation-friendly
- End-to-end flow: Login -> Home -> Accounts/Loan/Credit Card pages
- Demo user pre-provisioned and auto session creation on login page
- Strong client + server validation paths with predictable error messages
- Savings + Current account operations: add amount, withdraw amount, print/download passbook
- Credit card operations: apply new card, upgrade card, download last statement, unbilled transactions, card controls, block/unblock card, real bill payment
- Customer dashboard enhancements: notifications center, service request workflow, relationship/KYC indicators
- Banking offer banners + popup ads (for UI automation of modal interactions)
- File upload/download flows
- Drag-and-drop component (Loan page)
- Shadow DOM component (Loan page)
- Hidden element toggle + delayed rendering (Home page)
- Stable `data-testid` attributes for selectors
- API testing utilities:
  - `POST /api/testing/echo`
  - `GET /api/testing/status/:code`
  - `GET /api/testing/delay/:ms`

## Default demo credentials
- Email: `demo@bank.test`
- Password: `Demo@123`

## Run locally
```bash
npm install
npm start
```

Open in browser:
- App: `http://localhost:3000/login.html`
- Swagger: `http://localhost:3000/api-docs`

## Deploy to Render (Free)
This project includes `render.yaml` so you can deploy with near-zero setup.

1. Push this project to a GitHub repository.
2. In Render dashboard, choose `New` -> `Blueprint`.
3. Select your GitHub repo and deploy using the detected `render.yaml`.
4. Confirm service settings:
- Runtime: `Node`
- Plan: `Free`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Auto deploy: enabled for `main`
5. After deploy completes, verify:
- `<your-render-url>/api/health`
- `<your-render-url>/login.html`
- `<your-render-url>/home.html`
- `<your-render-url>/credit-card.html`
- `<your-render-url>/api-docs/`

Optional quick verification from terminal:
```bash
./scripts/verify-hosted.sh https://<your-render-url>
```

Free-tier note:
- Service may cold-start after inactivity.
- Uploaded files are not durable across restarts/redeployments.

## Main API endpoints
### Auth
- `POST /api/auth/demo-login`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/register` (multipart form, optional document)

### Customer and Support (Bearer token)
- `GET /api/customer/dashboard`
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `GET /api/offers/active`
- `GET /api/support/requests`
- `POST /api/support/requests`

### Accounts (Bearer token)
- `GET /api/accounts/summary`
- `GET /api/accounts/savings`
- `POST /api/accounts/savings/deposit`
- `POST /api/accounts/savings/withdraw`
- `GET /api/accounts/savings/passbook`
- `GET /api/accounts/current`
- `POST /api/accounts/current/deposit`
- `POST /api/accounts/current/withdraw`
- `GET /api/accounts/current/passbook`

### Credit Card (Bearer token)
- `GET /api/cards/credit`
- `POST /api/cards/credit/apply`
- `POST /api/cards/credit/upgrade`
- `GET /api/cards/credit/statement/latest`
- `GET /api/cards/credit/unbilled-transactions`
- `GET /api/cards/credit/controls`
- `PUT /api/cards/credit/controls`
- `POST /api/cards/credit/block`
- `POST /api/cards/credit/unblock` (demo OTP: `123456`)
- `POST /api/cards/credit/pay-bill`

### Loans (Bearer token)
- `GET /api/loans`
- `POST /api/loans/apply`

### File operations
- `POST /api/files/upload`
- `GET /api/files/list`
- `GET /api/files/download/:filename`
- `GET /api/files/template`

### Test utility APIs
- `POST /api/testing/echo`
- `GET /api/testing/status/:code`
- `GET /api/testing/delay/:ms`

## Notes
- Data is intentionally simple and partially in-memory for fast local execution.
- Uploaded files persist under `public/uploads` until manually removed.
- This app is intentionally basic in UI to keep focus on automation behavior.
