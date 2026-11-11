# Task 5.4: Dorm Room Booking — CSRF & DoS (Vulnerable)

This builds on the Dorm Room Booking app (JWT auth, React client) and adds a new
**Maintenance Requests** feature that is **deliberately vulnerable** to two attacks:

1. **CSRF (Cross-Site Request Forgery)** — state-changing requests are trusted on the
   strength of the auth cookie alone.
2. **DoS (Denial of Service)** — no rate limiting, so the endpoints can be flooded.

Your job is to fix both. The `Task-5.4-solution/` sibling project shows one correct answer.

## Running it

```
npm install           # installs server/ + client/ (npm workspaces) + test tooling
npm run dev           # API on :4000, client on :5175
```

Create `server/.env` yourself with:

```
PORT=4000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string>
JWT_EXPIRES_IN=7d
```

Generate a secret with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Authentication: a JWT in an httpOnly cookie

Unlike the earlier variants (which sent the JWT in an `Authorization: Bearer` header and
kept it in `localStorage`), this app stores the JWT in an **httpOnly cookie**:

- `POST /api/auth/register` and `POST /api/auth/login` set a `token` cookie and return
  `{ user }` (no token in the body); `POST /api/auth/logout` clears it; `GET /api/auth/me`
  reads the session from the cookie.
- `middleware/auth.js` reads the JWT from `req.cookies.token`.
- The client's `api.js` uses `withCredentials: true`; there is no token in `localStorage`.

An httpOnly cookie is good against XSS token theft — but the browser attaches it
**automatically** to every request to the API, including requests triggered by another
website. That is the precondition for CSRF.

## Maintenance Requests (the new feature)

- Model `MaintenanceRequest` — `roomNumber`, `category` (`plumbing|electrical|furniture|other`),
  `description`, `status`, `author` (→ `User`).
- `GET /api/maintenance`, `GET /api/maintenance/:id` — public.
- `POST /api/maintenance` — logged-in users file a request (`author` taken from the cookie).
- `PATCH`/`DELETE /api/maintenance/:id` — own requests only (`403` otherwise).
- Client page at `/maintenance` (list + submit form).

## Simulating the attack

See **[Flow.md](./Flow.md)** for a full walkthrough: become the victim, run the `attacker/`
site, and watch a forged maintenance request get filed in your name (CSRF) and the API get
flooded (DoS).

## Your task

Make the Maintenance feature secure **without breaking legitimate use**:

- **CSRF:** require a secret, per-session anti-CSRF token on every state-changing request —
  a value an attacker's site can neither read nor guess. Use the **`csrf-csrf`** package
  (double-submit-cookie pattern). Remember: `SameSite` and CORS are *not* substitutes for a
  real token (see Flow.md for why).
- **DoS:** throttle the feature so one client cannot flood it. Use the **`express-rate-limit`**
  package to return `429 Too Many Requests` past a sensible limit.

> A jest test suite ships with this task. From the project root, run `npm install` then
> `npm test`. The tests encode the secure behavior, so they **fail now and pass once your fix
> is applied** — use them to verify your work. (CI runs the same suite on every push.)
