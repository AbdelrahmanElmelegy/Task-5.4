import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server/src/app.js";

let mongo;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.CSRF_SECRET = "test-csrf-secret";

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

function cookiePairs(setCookie) {
  return (setCookie || []).map((c) => c.split(";")[0]);
}

let counter = 0;

async function registerUser() {
  counter++;

  const email = `victim${Date.now()}_${counter}@test.dev`;

  const res = await request(app).post("/api/auth/register").send({
    name: "Victim",
    email,
    password: "secret123",
  });

  expect(res.status).toBe(201);

  return cookiePairs(res.headers["set-cookie"]);
}

describe("Maintenance requests — CSRF protection", () => {
  test("a logged-in user can file a maintenance request", async () => {
    const authCookies = await registerUser();

    let cookies = [...authCookies];
    const headers = {};

    const tokenRes = await request(app)
      .get("/api/csrf-token")
      .set("Cookie", cookies.join("; "));

    if (tokenRes.status === 200) {
      headers["x-csrf-token"] = tokenRes.body.csrfToken;
      cookies = [...cookies, ...cookiePairs(tokenRes.headers["set-cookie"])];
    }

    const res = await request(app)
      .post("/api/maintenance")
      .set("Cookie", cookies.join("; "))
      .set(headers)
      .send({
        roomNumber: "B2-104",
        category: "plumbing",
        description: "Leaking tap",
      });

    expect(res.status).toBe(201);
    expect(res.body.request.description).toBe("Leaking tap");
  });

  test("a forged cross-site request without a CSRF token is rejected", async () => {
    const authCookies = await registerUser();

    const forged = await request(app)
      .post("/api/maintenance")
      .set("Cookie", authCookies.join("; "))
      .set("Origin", "http://attacker.evil")
      .send({
        roomNumber: "Z9-666",
        category: "other",
        description: "Forged by attacker via CSRF",
      });

    expect(forged.status).toBe(403);

    const list = await request(app).get("/api/maintenance");

    const forgedItem = list.body.requests.find(
      (r) => r.description === "Forged by attacker via CSRF",
    );

    expect(forgedItem).toBeUndefined();
  });
});
