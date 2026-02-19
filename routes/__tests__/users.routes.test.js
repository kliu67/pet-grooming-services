import request from "supertest";
import express from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import userRoutes from "../users.routes.js";
import * as User from "../../models/users.model.js";

//
// Mock the model (NO DB)
//
vi.mock("../../models/users.model.js");

//
// Build test app
//
const app = express();
app.use(express.json());
app.use("/users", userRoutes);

//
// Optional: error middleware for tests
//
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

beforeEach(() => {
  vi.clearAllMocks();
});

//
// GET /users
//
describe("GET /users", () => {
  it("returns all users", async () => {
    User.findAll.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get("/users");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });

  it("handles server error", async () => {
    User.findAll.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/users");

    expect(res.status).toBe(500);
  });
});

//
// GET /users/:id
//
describe("GET /users/:id", () => {
  it("returns user", async () => {
    User.findById.mockResolvedValue({ id: 1 });

    const res = await request(app).get("/users/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1 });
  });

  it("returns 404 if not found", async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app).get("/users/1");

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app).get("/users/abc");

    expect(res.status).toBe(400);
  });
});

//
// POST /users
//
describe("POST /users", () => {
  it("creates user", async () => {
    User.create.mockResolvedValue({ id: 1 });

    const res = await request(app).post("/users").send({
      first_name: "John", last_name: "Doe",
      phone: "1234567890",
      email: "john@test.com",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1 });
  });

  it("returns 400 for missing fields", async () => {
    const res = await request(app).post("/users").send({});

    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate", async () => {
    User.create.mockRejectedValue(new Error("email already exists"));

    const res = await request(app).post("/users").send({
      first_name: "John",
      last_name: "Doe",
      phone: "1234567890",
      email: "john@test.com",
    });

    expect(res.status).toBe(409);
  });

  it("handles server error", async () => {
    User.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/users").send({
      first_name: "John", last_name: "Doe",
      phone: "1234567890",
    });

    expect(res.status).toBe(500);
  });
});

//
// PUT /users/:id
//
describe("PUT /users/:id", () => {
  it("updates user", async () => {
    User.update.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .put("/users/1")
      .send({ first_name: "New", last_name: "Name" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1 });
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app).put("/users/1").send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 if user not found", async () => {
    User.update.mockResolvedValue(null);

    const res = await request(app)
      .put("/users/1")
      .send({ first_name: "New", last_name: "Name" });

    expect(res.status).toBe(404);
  });

  it("returns 409 for duplicate", async () => {
    User.update.mockRejectedValue(new Error("email already exists"));

    const res = await request(app)
      .put("/users/1")
      .send({ email: "dup@test.com" });

    expect(res.status).toBe(409);
  });

  it("handles server error", async () => {
    User.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/users/1")
      .send({ first_name: "New", last_name: "Name" });

    expect(res.status).toBe(500);
  });
});

//
// DELETE /users/:id
//
describe("DELETE /users/:id", () => {
  it("deletes user", async () => {
    User.remove.mockResolvedValue(true);

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(204);
  });

  it("returns 404 if not found", async () => {
    User.remove.mockResolvedValue(false);

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(404);
  });

  it("handles server error", async () => {
    User.remove.mockRejectedValue(new Error("DB error"));

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(500);
  });
});