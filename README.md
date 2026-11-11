# Task 3 (Variant): Dorm Room Booking — with Authentication

Task 1's Dorm Room Booking API with JWT login/register on the server and a
React client with a login flow.

## Running it

```
npm run install:all   # installs server/ and client/ (npm workspaces)
npm run dev           # API on :4000, client on :5175
```

Create `server/.env` yourself with:

```
PORT=4000
MONGO_URI=mongodb://tasks:pass1234@ac-j3acrgb-shard-00-00.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-01.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-02.lueesfz.mongodb.net:27017/?ssl=true&replicaSet=atlas-6to6iy-shard-0&authSource=admin&appName=Cluster0
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` is the key the server signs and verifies login tokens with —
anyone who knows it can forge a token for any user, so replace `change-me`
with a long random value. Generate one with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output after `JWT_SECRET=` and restart the server. Changing the
secret logs everyone out, because tokens signed with the old one stop being
valid.

## What was added on top of Task 1

### Server
- `POST /api/auth/register`, `POST /api/auth/login` → `{ token, user }`;
  `GET /api/auth/me` (requires token).
- `middleware/auth.js` — `requireAuth` reads `Authorization: Bearer <token>`,
  verifies it with `JWT_SECRET` and sets `req.user = { id, name }`.
- `User.comparePassword()`; the `password` field stores the bcrypt hash.
- Bookings: reading (`GET /`, `GET /:id`) stays public. Creating, editing and
  cancelling require a token. `bookedBy` is set from `req.user.id` (sending
  it in the body is rejected), and only the person who made a booking can
  edit or cancel it (`403` otherwise). The room-conflict check from Task 1
  still applies (`409`). Bookings are populated with the booker's
  `name`/`email`.
- Users: `POST /api/users` was removed (use `/api/auth/register`);
  `PATCH`/`DELETE /api/users/:id` require a token and only work on your own
  account.

### Client (`client/`, Vite + React + Tailwind)
- `AuthContext` stores the token in `localStorage`, restores the session via
  `/auth/me`, and `api.js` attaches the token to every request.
- Pages: Login, Register, Bookings (list, edit/cancel on your own bookings).
  BookingForm is left for you — see below.

## Your task — the Book a Room page

Everything above is already working. Your job is the frontend of booking a
room: `client/src/pages/BookingForm.jsx`. It is already routed at
`/bookings/new` and `/bookings/:id`, both behind `ProtectedRoute`, and the
"Book a Room" nav link and the "Edit" buttons already point to it.

This is roughly what the finished page should look like (filled in with example values):

![Finished page](docs/book-a-room.png)

### TODO 1 — the form
Render inputs bound to the `form` state:
- `roomNumber` — text input (e.g. `B2-104`)
- `startDate` — date input (`type="date"`)
- `endDate` — date input (`type="date"`)
- `purpose` — textarea (optional)

Implement `onChange` so every input updates `form`.

### TODO 2 — booking a room
In `onSubmit`, send `POST /api/bookings` with
`{ roomNumber, startDate, endDate, purpose }` using the `api` instance from
`client/src/api.js` (it already attaches your token). On success, navigate
back to `/bookings`. On failure, show the server's `message` in the `error`
box — try it: an end date before the start date returns `400`, and booking a
room that is already taken for an overlapping range returns `409`.

Do **not** send `bookedBy` — the server takes the booker from your token and
rejects the request if you send it.

### TODO 3 — editing a booking
When the URL has an `id`, load the booking with `GET /api/bookings/:id` and
fill the form with its `roomNumber`, `startDate`, `endDate` and `purpose`.
Watch out: the server sends dates as full ISO strings
(`2026-10-10T00:00:00.000Z`), but a date input only accepts `YYYY-MM-DD`.
On submit, send `PATCH /api/bookings/:id` instead of `POST`. Editing someone
else's booking returns `403` — show that message too.

You're expected to use AI tools while building this. But you should be able
to explain, for any line in your component, *why* it's there and what
happens if you delete it. We will ask.
