import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import speciesRoutes from "../species.routes.js";
import * as Species from "../../models/species.model.js";

/* ---------------- Mock Model ---------------- */
vi.mock("../../models/species.model.js");

/* ---------------- Setup Test App ---------------- */
const app = express();
app.use(express.json());
app.use("/species", speciesRoutes);

describe("Species Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =====================================================
     GET /species
  ===================================================== */
  describe("GET /species", () => {
    it("returns all species", async () => {
      const mockSpecies = [
        { id: 1, name: "Dog", created_at: "2026-01-01" },
        { id: 2, name: "Cat", created_at: "2026-01-01" },
      ];

      Species.findAll.mockResolvedValue(mockSpecies);

      const res = await request(app).get("/species");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSpecies);
      expect(Species.findAll).toHaveBeenCalled();
    });
  });

  /* =====================================================
     GET /species/:id
  ===================================================== */
  describe("GET /species/:id", () => {
    it("returns species by id", async () => {
      const mock = { id: 1, name: "Dog" };
      Species.findById.mockResolvedValue(mock);

      const res = await request(app).get("/species/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mock);
      expect(Species.findById).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Species.findById.mockResolvedValue(null);

      const res = await request(app).get("/species/999");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Species.findById.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).get("/species/abc");

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     POST /species
  ===================================================== */
  describe("POST /species", () => {
    it("creates species", async () => {
      const created = { id: 3, name: "Rabbit" };
      Species.create.mockResolvedValue(created);

      const res = await request(app)
        .post("/species")
        .send({ name: "Rabbit" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(Species.create).toHaveBeenCalledWith("Rabbit");
    });

    it("returns 400 for invalid name", async () => {
      Species.create.mockRejectedValue(
        new Error("invalid species name")
      );

      const res = await request(app)
        .post("/species")
        .send({ name: "" });

      expect(res.status).toBe(400);
    });

    it("returns 400 if species already exists", async () => {
      Species.create.mockRejectedValue(
        new Error("species already exists")
      );

      const res = await request(app)
        .post("/species")
        .send({ name: "Dog" });

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     DELETE /species/:id
  ===================================================== */
  describe("DELETE /species/:id", () => {
    it("deletes species", async () => {
      Species.remove.mockResolvedValue(true);

      const res = await request(app).delete("/species/1");

      expect(res.status).toBe(204);
      expect(Species.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Species.remove.mockRejectedValue(
        new Error("species not found")
      );

      const res = await request(app).delete("/species/1");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Species.remove.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).delete("/species/abc");

      expect(res.status).toBe(400);
    });

    it("returns 400 if species is in use", async () => {
      Species.remove.mockRejectedValue(
        new Error("cannot delete species in use")
      );

      const res = await request(app).delete("/species/1");

      expect(res.status).toBe(400);
    });
  });
});
