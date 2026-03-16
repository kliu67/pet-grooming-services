import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import breedRoutes from "../breeds.routes.js";
import * as Breeds from "../../models/breeds.model.js";

vi.mock("../../middleware/auth.middleware.js", () => ({
  authMiddleware: (_req, _res, next) => next(),
}));

/* ---------------- Mock Model ---------------- */
vi.mock("../../models/breeds.model.js");

/* ---------------- Setup Test App ---------------- */
const app = express();
app.use(express.json());
app.use("/breeds", breedRoutes);

describe("Breed Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =====================================================
     GET /breeds
  ===================================================== */
  describe("GET /breeds", () => {
    it("returns all breeds", async () => {
      const mockBreeds = [
        { id: 1, name: "Dog", created_at: "2026-01-01" },
        { id: 2, name: "Cat", created_at: "2026-01-01" },
      ];

      Breeds.findAll.mockResolvedValue(mockBreeds);

      const res = await request(app).get("/breeds");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBreeds);
      expect(Breeds.findAll).toHaveBeenCalled();
    });
  });

  /* =====================================================
     GET /breed/:id
  ===================================================== */
  describe("GET /breeds/:id", () => {
    it("returns breed by id", async () => {
      const mock = { id: 1, name: "Dog" };
      Breeds.findById.mockResolvedValue(mock);

      const res = await request(app).get("/breeds/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mock);
      expect(Breeds.findById).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Breeds.findById.mockResolvedValue(null);

      const res = await request(app).get("/breeds/999");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Breeds.findById.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).get("/breeds/abc");

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     POST /breed
  ===================================================== */
  describe("POST /breed", () => {
    it("creates breed", async () => {
      const created = { id: 3, name: "Rabbit" };
      Breeds.create.mockResolvedValue(created);

      const res = await request(app)
        .post("/breeds")
        .send({ name: "Rabbit" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(Breeds.create).toHaveBeenCalledWith("Rabbit");
    });

    it("returns 400 for invalid name", async () => {
      Breeds.create.mockRejectedValue(
        new Error("invalid breed name")
      );

      const res = await request(app)
        .post("/breeds")
        .send({ name: "" });

      expect(res.status).toBe(400);
    });

    it("returns 400 if breed already exists", async () => {
      Breeds.create.mockRejectedValue(
        new Error("breed already exists")
      );

      const res = await request(app)
        .post("/breeds")
        .send({ name: "Dog" });

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     DELETE /breed/:id
  ===================================================== */
  describe("DELETE /breed/:id", () => {
    it("deletes breed", async () => {
      Breeds.remove.mockResolvedValue(true);

      const res = await request(app).delete("/breeds/1");

      expect(res.status).toBe(204);
      expect(Breeds.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Breeds.remove.mockRejectedValue(
        new Error("breed not found")
      );

      const res = await request(app).delete("/breeds/1");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Breeds.remove.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).delete("/breeds/abc");

      expect(res.status).toBe(400);
    });

    it("returns 400 if breed is in use", async () => {
      Breeds.remove.mockRejectedValue(
        new Error("cannot delete breed in use")
      );

      const res = await request(app).delete("/breeds/1");

      expect(res.status).toBe(400);
    });
  });
});
