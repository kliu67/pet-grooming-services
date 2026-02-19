import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import serviceRoutes from "../services.routes.js";
import * as Service from "../../models/services.model.js";

// Mock the entire service model
vi.mock("../../models/services.model.js");

const app = express();
app.use(express.json());
app.use("/services", serviceRoutes);

describe("Service Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ===============================
     GET /services
  =============================== */
  describe("GET /services", () => {
    it("returns all services", async () => {
      const mockServices = [
        { id: 1, name: "Bath", base_price: 20 },
        { id: 2, name: "Haircut", base_price: 40 },
      ];

      Service.findAll.mockResolvedValue(mockServices);

      const res = await request(app).get("/services");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockServices);
      expect(Service.findAll).toHaveBeenCalled();
    });
  });

  /* ===============================
     GET /services/:id
  =============================== */
  describe("GET /services/:id", () => {
    it("returns service by id", async () => {
      const mockService = { id: 1, name: "Bath", base_price: 20 };
      Service.findById.mockResolvedValue(mockService);

      const res = await request(app).get("/services/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockService);
      expect(Service.findById).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Service.findById.mockResolvedValue(null);

      const res = await request(app).get("/services/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  /* ===============================
     POST /services
  =============================== */
  describe("POST /services", () => {
    it("creates a service", async () => {
      const newService = { id: 1, name: "Bath", base_price: 20 };
      Service.create.mockResolvedValue(newService);

      const res = await request(app)
        .post("/services")
        .send({ name: "Bath", base_price: 20 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(newService);
      expect(Service.create).toHaveBeenCalledWith({
        name: "Bath",
        base_price: 20,
      });
    });

    it("returns 400 for validation error", async () => {
      Service.create.mockRejectedValue(
        new Error("data validation error: name cannot be empty")
      );

      const res = await request(app)
        .post("/services")
        .send({ name: "", base_price: 20 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("validation");
    });
  });

  /* ===============================
     PUT /services/:id
  =============================== */
  describe("PUT /services/:id", () => {
    it("updates a service", async () => {
      const updatedService = { id: 1, name: "Bath+", base_price: 25 };

      Service.update.mockResolvedValue(updatedService);

      const res = await request(app)
        .put("/services/1")
        .send({ name: "Bath+", base_price: 25 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedService);
      expect(Service.update).toHaveBeenCalledWith("1", {
        name: "Bath+",
        base_price: 25,
      });
    });

    it("returns 404 if service not found", async () => {
      Service.update.mockRejectedValue(
        new Error("Service with id 1 not found")
      );

      const res = await request(app)
        .put("/services/1")
        .send({ name: "Bath+", base_price: 25 });

      expect(res.status).toBe(404);
    });
  });

  /* ===============================
     DELETE /services/:id
  =============================== */
  describe("DELETE /services/:id", () => {
    it("deletes a service", async () => {
      Service.remove.mockResolvedValue(true);

      const res = await request(app).delete("/services/1");

      expect(res.status).toBe(204);
      expect(Service.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Service.remove.mockRejectedValue(
        new Error("Service with id 1 not found")
      );

      const res = await request(app).delete("/services/1");

      expect(res.status).toBe(404);
    });
  });
});
