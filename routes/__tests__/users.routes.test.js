import request from "supertest";
import express from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import clientRoutes from "../clients.routes.js";
import * as Client from "../../models/clients.model.js";

//
// Mock the model (NO DB)
//
vi.mock("../../models/clients.model.js");

//
// Build test app
//
const app = express();
app.use(express.json());
app.use("/clients", clientRoutes);

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
// GET /clients
//
describe("GET /clients", () => {
  it("returns all clients", async () => {
    Client.findAll.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get("/clients");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });

  it("handles server error", async () => {
    Client.findAll.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/clients");

    expect(res.status).toBe(500);
  });
});

//
// GET /clients/:id
//
describe("GET /clients/:id", () => {
  it("returns client", async () => {
    Client.findById.mockResolvedValue({ id: 1 });

    const res = await request(app).get("/clients/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1 });
  });

  it("returns 404 if not found", async () => {
    Client.findById.mockResolvedValue(null);

    const res = await request(app).get("/clients/1");

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app).get("/clients/abc");

    expect(res.status).toBe(400);
  });
});

//
// POST /clients
//
describe("POST /clients", () => {
  it("creates client", async () => {
    Client.create.mockResolvedValue({ id: 1 });

    const res = await request(app).post("/clients").send({
      first_name: "John", last_name: "Doe",
      phone: "1234567890",
      email: "john@test.com",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1 });
  });

  it("returns 400 for missing fields", async () => {
    const res = await request(app).post("/clients").send({});

    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate", async () => {
    Client.create.mockRejectedValue(new Error("email already exists"));

    const res = await request(app).post("/clients").send({
      first_name: "John",
      last_name: "Doe",
      phone: "1234567890",
      email: "john@test.com",
    });

    expect(res.status).toBe(409);
  });

  it("handles server error", async () => {
    Client.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/clients").send({
      first_name: "John", last_name: "Doe",
      phone: "1234567890",
    });

    expect(res.status).toBe(500);
  });
});

//
// PUT /clients/:id
//
describe("PUT /clients/:id", () => {
  it("updates client", async () => {
    Client.update.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .put("/clients/1")
      .send({ first_name: "New", last_name: "Name" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1 });
  });

  it("returns 400 when no fields provided", async () => {
    const res = await request(app).put("/clients/1").send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 if client not found", async () => {
    Client.update.mockResolvedValue(null);

    const res = await request(app)
      .put("/clients/1")
      .send({ first_name: "New", last_name: "Name" });

    expect(res.status).toBe(404);
  });

  it("returns 409 for duplicate", async () => {
    Client.update.mockRejectedValue(new Error("email already exists"));

    const res = await request(app)
      .put("/clients/1")
      .send({ email: "dup@test.com" });

    expect(res.status).toBe(409);
  });

  it("handles server error", async () => {
    Client.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/clients/1")
      .send({ first_name: "New", last_name: "Name" });

    expect(res.status).toBe(500);
  });
});

//
// DELETE /clients/:id
//
describe("DELETE /clients/:id", () => {
  it("deletes client", async () => {
    Client.remove.mockResolvedValue(true);

    const res = await request(app).delete("/clients/1");

    expect(res.status).toBe(204);
  });

  it("returns 404 if not found", async () => {
    Client.remove.mockResolvedValue(false);

    const res = await request(app).delete("/clients/1");

    expect(res.status).toBe(404);
  });

  it("handles server error", async () => {
    Client.remove.mockRejectedValue(new Error("DB error"));

    const res = await request(app).delete("/clients/1");

    expect(res.status).toBe(500);
  });
});