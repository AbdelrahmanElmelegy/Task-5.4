# Task 5 (Variant): Dorm Room Booking — With Maintenance Requests

We are building on top of the Dorm Room Booking variant from Task 3. Previously we
implemented `JWT` authentication; now the session is stored in a cookie and a new
**maintenance requests** feature has been added. Let us first start with some context.

## Context

### Cross-Site Request Forgery (CSRF)

A `CSRF` attack is a security vulnerability where a malicious website causes a victim's browser
to send a **state-changing request to an application the victim is already logged into** —
without the victim's knowledge or consent. The attacker never sees the victim's password or
session token; they simply abuse the fact that the browser **automatically attaches the victim's
credentials** (most commonly a session cookie) to every request bound for that application,
whoever triggered it.

Unlike injection or `XSS`, the attacker runs **no code inside the target's origin**. They do not
read any of the victim's data either — a CSRF attack is "blind." It only needs the victim's
request to *succeed*, riding on their ambient, authenticated session. That is why any sensitive,
state-changing endpoint authenticated only by a cookie is a target.

#### How it works:

1. **An authenticated session in a cookie**: The victim logs into the application. The server
   hands the browser a session cookie, which the browser stores and then sends on **every**
   subsequent request to that site — automatically.
2. **A forged cross-site request**: The victim visits a page the attacker controls (a phishing
   link, a forum post, a malicious ad). That page quietly issues a state-changing request to the
   target application — classically a hidden, **auto-submitting HTML form**.
3. **The browser attaches the cookie**: Because the request is bound for the target site, the
   browser attaches the victim's session cookie. The server sees a valid session and executes the
   request **as if the victim intended it** — changing data on their behalf.

### Denial of Service (DoS)

A `DoS` attack is a security vulnerability where an attacker makes an application slow or
unavailable to its legitimate users by overwhelming it with more work than it can handle. There
is no session to hijack and nothing is changed on anyone's behalf; the goal is simply to exhaust
a finite resource — CPU, memory, database connections, network bandwidth — by sending far more
requests, or far more expensive requests, than the server was provisioned for.

The attacker needs **no credentials and reads no data**; they only need the requests to keep
arriving. Any endpoint that does real work on every call — a database query, a file read, a hash
computation — and places **no limit on how often one client may call it** is a target. The
simplest form is a flood: a single client (or a crowd of them) hammers the endpoint as fast as it
can.

#### How it works:

1. **An endpoint that does work and has no limit**: The server exposes a route that runs a query
   (or other real work) on every call, and never caps how many calls one client may make in a
   given window.
2. **A flood of requests**: The attacker fires hundreds or thousands of requests in a short burst
   — from a script, or even from JavaScript on a webpage running in the browsers of many lured
   visitors.
3. **The server tries to serve them all**: With nothing to refuse the excess, every request
   competes for the same CPU, memory and database connections. Legitimate users' requests queue
   behind the flood and time out — the service is effectively down.

## Running it

```bash
npm install           # Install concurrently and the dependencies of the projects
npm run install:all   # For safety
npm run dev           # API on :4000, client on :5175
```

Create the `server/.env` file.

```ini
PORT=4000
MONGO_URI=mongodb://tasks:pass1234@ac-j3acrgb-shard-00-00.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-01.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-02.lueesfz.mongodb.net:27017/?ssl=true&replicaSet=atlas-6to6iy-shard-0&authSource=admin&appName=Cluster0
JWT_SECRET=4a498d90a0f923ae4b3f1f65571ff25985d17e2f3286e8e90383e449f68a40a8
JWT_EXPIRES_IN=7d
```

## What was added on top of Task 3

<details>
<summary> View details </summary>

### Server

- **Auth moved from the `Authorization` header to a cookie.** Instead of returning the `JWT` in
  the response body for the client to keep in `localStorage`, `login`/`register` now set it in an
  **httpOnly cookie** (`authController.js`), and `middleware/auth.js` reads the token from
  `req.cookies.token`. A `POST /api/auth/logout` route clears the cookie. The browser now sends
  the session automatically on every request — which is exactly the precondition for `CSRF`.
- `app.js` now mounts `cookie-parser`, `express.urlencoded` (so plain HTML-form bodies are
  parsed), and CORS with `credentials: true` locked to the client origin.
- Added a new model called **`MaintenanceRequest`** with the attributes: `roomNumber`, `category`,
  `description`, `status`, `author`.
- Added the **Maintenance controller** with the following routes:
    - `GET /api/maintenance`: returns all maintenance requests (public).
    - `GET /api/maintenance/:id`: returns a single maintenance request (public).
    - `POST /api/maintenance`: files a new maintenance request for the logged-in user. Filing a
      request is a sensitive, state-changing action done in the user's name.
    - `PATCH /api/maintenance/:id`, `DELETE /api/maintenance/:id`: update or delete your own
      request (others' requests return `403`).

### Client

- `api.js` now sends requests with `withCredentials: true` (so the auth cookie rides along) and no
  longer stores a token in `localStorage`. `AuthContext` restores the session via
  `GET /api/auth/me`.
- Added the **`Maintenance.jsx`** page (and a **Maintenance** nav link) for viewing and filing
  maintenance requests.

</details>

## Simulating the Attack

For this you will **not** need Postman — a `CSRF` attack is carried out by a webpage, not a crafted
API client. The `attacker/` folder is a small, separate Express server that plays the role of a
malicious site the victim visits. Look through the `Flow.md` Markdown file for the detailed steps
to simulate both attacks (register a victim, run the attacker server, open its link, and watch a
maintenance request get silently filed in the victim's name — then click through and watch the same
page flood the API with requests).

Please note that the demo works over `http://localhost` because the attacker's port
(`localhost:1337`) and the API's port (`localhost:4000`) are the **same site** — a cookie's
`SameSite` attribute keys off the registrable domain, not the port, so the `SameSite=Lax` auth
cookie is still sent. This is a deliberate lesson: `SameSite` is a useful layer but **not** a
complete defense, which is why a real anti-`CSRF` token is required (details in the `Flow.md`
file). After reading the file, read the next section.

## Task

<details>

<summary>View Task</summary>

The attack in the `Flow.md` file works for two independent reasons.

First, the write endpoint `POST /api/maintenance` (`maintenanceController.js` +
`routes/maintenance.js`) trusts the session cookie **alone**: there is no proof the request
actually originated from our own app — no anti-`CSRF` token, no check of intent. Since the browser
attaches that cookie to any cross-site request, any page the victim visits can forge a request in
their name.

Second, none of the maintenance endpoints place **any limit on how often one client may call
them**, so the attacker's page can flood `GET /api/maintenance` with unlimited requests and
exhaust the server — a `DoS`.

**Fix both.** Make the maintenance feature safe while keeping its legitimate behavior, then re-run
the attacks in `Flow.md` and confirm they now fail (the forged request should return `403` and
leave the data unchanged, and the flood should be refused with `429`).

- **CSRF:** issue a secret, per-session **CSRF token** that the attacker's site cannot read or
  guess; require that token on every state-changing request; leave "safe" `GET` requests and the
  pre-auth routes (login/register, which run before a session exists) exempt; and echo the token
  from the client on each write. Use the **`csrf-csrf`** package (the double-submit-cookie pattern;
  the old `csurf` is deprecated). You are expected to understand **why** `CORS` and `SameSite`
  cookies do not by themselves close this hole, and to think carefully about which requests need
  protection and which must stay exempt.
- **DoS:** throttle the feature so one client cannot flood it. Use the **`express-rate-limit`**
  package to return `429 Too Many Requests` once a client exceeds a sensible limit in a time
  window.

A test suite ships with the project. Run it from the project root:

```bash
npm install     # first time only
npm test
```

The `CSRF` and `DoS` tests describe the **secure** behavior and are **expected to FAIL** in this
project (the suite is red). Your job is to make them green by applying the fix.

### Custom Configurations

Sometimes when working in teams, the team may have custom configurations (like automatic tasks) that run immediately after booting up VSCode. The reason these automatic tasks run on startup is because of a folder called `.vscode`; this folder store custom configurations for VSCode and it is normally present on the C-Drive, assuming a Windows user. However, that folder can also be present in project directories, like the one you are currently using. Before cloning any GitHub Repository that has automatic takes or custom configurations in general you should always verify these configurations before cloning, since they might contain malicious code that targets your machine. For example, I could have a backdoor open that periodically queries my server, attacker server, and I could, at any point, send a command that shuts down your PC, among other options. The second part of this task for you is to find the piece of code that is creating the dialog box issue and inform your TA afterwards.

</details>
