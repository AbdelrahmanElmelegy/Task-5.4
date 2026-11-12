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

describe("Maintenance requests — DoS / rate limiting", () => {
  test("a normal request to the public list succeeds", async () => {
    const res = await request(app).get("/api/maintenance");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests)).toBe(true);
  });

  test("a flood of requests from one client is rate-limited", async () => {
    const statuses = [];

    for (let i = 0; i < 40; i++) {
      const res = await request(app).get("/api/maintenance");
      statuses.push(res.status);
    }

    expect(statuses).toContain(200);
    expect(statuses).toContain(429);
  });
});
