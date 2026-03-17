import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import weightClassRoutes from "../weightClasses.routes.js";
import * as WeightClass from "../../models/weightClasses.model.js";

/* ---------------- Mock Model ---------------- */
vi.mock("../../models/weightClasses.model.js");

/* ---------------- Setup Test App ---------------- */
const app = express();
app.use(express.json());
app.use("/weight-classes", weightClassRoutes);

describe("Weight Class Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =====================================================
     GET /weight-classes
  ===================================================== */
  describe("GET /weight-classes", () => {
    it("returns all weight classes", async () => {
      const mockData = [
        { id: 1, label: "Small" },
        { id: 2, label: "Medium" },
        { id: 3, label: "Large" },
      ];

      WeightClass.findAll.mockResolvedValue(mockData);

      const res = await request(app).get("/weight-classes");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
      expect(WeightClass.findAll).toHaveBeenCalled();
    });
  });

  /* =====================================================
     GET /weight-classes/:id
  ===================================================== */
  describe("GET /weight-classes/:id", () => {
    it("returns weight class by id", async () => {
      const mockRow = { id: 1, label: "Small" };
      WeightClass.findById.mockResolvedValue(mockRow);

      const res = await request(app).get("/weight-classes/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRow);
      expect(WeightClass.findById).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      WeightClass.findById.mockResolvedValue(null);

      const res = await request(app).get("/weight-classes/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it("returns 400 for invalid id", async () => {
      WeightClass.findById.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).get("/weight-classes/abc");

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     POST /weight-classes
  ===================================================== */
  describe("POST /weight-classes", () => {
    it("creates a weight class", async () => {
      const created = { id: 4, label: "Extra Large" };
      WeightClass.create.mockResolvedValue(created);

      const res = await request(app)
        .post("/weight-classes")
        .send({ label: "Extra Large" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(WeightClass.create).toHaveBeenCalledWith("Extra Large");
    });

    it("returns 400 for invalid label", async () => {
      WeightClass.create.mockRejectedValue(
        new Error("invalid weight class label")
      );

      const res = await request(app)
        .post("/weight-classes")
        .send({ label: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("returns 400 if already exists", async () => {
      WeightClass.create.mockRejectedValue(
        new Error("weight class already exists")
      );

      const res = await request(app)
        .post("/weight-classes")
        .send({ label: "Small" });

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     DELETE /weight-classes/:id
  ===================================================== */
  describe("DELETE /weight-classes/:id", () => {
    it("deletes a weight class", async () => {
      WeightClass.remove.mockResolvedValue(true);

      const res = await request(app).delete("/weight-classes/1");

      expect(res.status).toBe(204);
      expect(WeightClass.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      WeightClass.remove.mockRejectedValue(
        new Error("weight class not found")
      );

      const res = await request(app).delete("/weight-classes/1");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      WeightClass.remove.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).delete("/weight-classes/abc");

      expect(res.status).toBe(400);
    });

    it("returns 400 if weight class is in use", async () => {
      WeightClass.remove.mockRejectedValue(
        new Error("cannot delete weight class in use")
      );

      const res = await request(app).delete("/weight-classes/1");

      expect(res.status).toBe(400);
    });
  });
});
