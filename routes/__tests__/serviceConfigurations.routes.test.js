import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import configRoutes from "../serviceConfigurations.routes.js";
import * as Config from "../../models/serviceConfigurations.model.js";

/* ---------------- Mock Model ---------------- */
vi.mock("../../models/serviceConfigurations.model.js");

/* ---------------- Setup App ---------------- */
const app = express();
app.use(express.json());
app.use("/service-configurations", configRoutes);

describe("Service Configuration Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =====================================================
     GET /service-configurations (composite key)
  ===================================================== */
  describe("GET /service-configurations", () => {
    it("returns configuration", async () => {
      const mockConfig = {
        service_id: 2,
        weight_class_id: 3,
        price: 50,
        duration_minutes: 60,
        is_active: true,
      };

      Config.findOne.mockResolvedValue(mockConfig);

      const res = await request(app).get(
        "/service-configurations?service_id=2&weight_class_id=3"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockConfig);
      expect(Config.findOne).toHaveBeenCalledWith("2", "3");
    });

    it("returns 404 if not found", async () => {
      Config.findOne.mockResolvedValue(null);

      const res = await request(app).get(
        "/service-configurations?service_id=2&weight_class_id=3"
      );

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid input", async () => {
      Config.findOne.mockRejectedValue(new Error("invalid service_id"));

      const res = await request(app).get(
        "/service-configurations?service_id=bad&weight_class_id=3"
      );

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     GET /service-configurations/service/:serviceId
  ===================================================== */
  describe("GET /service-configurations/service/:serviceId", () => {
    it("returns all configs for a service", async () => {
      const mockRows = [
        { service_id: 2, weight_class_id: 1 },
        { service_id: 2, weight_class_id: 2 },
      ];

      Config.findByService.mockResolvedValue(mockRows);

      const res = await request(app).get(
        "/service-configurations/service/2"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRows);
      expect(Config.findByService).toHaveBeenCalledWith("2");
    });

    it("returns 400 for invalid service id", async () => {
      Config.findByService.mockRejectedValue(new Error("invalid service_id"));

      const res = await request(app).get(
        "/service-configurations/service/bad"
      );

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     GET /service-configurations/service/:serviceId/grouped-by-weight-class
  ===================================================== */
  describe("GET /service-configurations/service/:serviceId/grouped-by-weight-class", () => {
    it("returns one config row per weight class for a service", async () => {
      const groupedRows = [
        { id: 1, service_id: 2, weight_class_id: 1 },
        { id: 3, service_id: 2, weight_class_id: 2 },
      ];

      Config.findByServiceGroupedByWeightClass.mockResolvedValue(groupedRows);

      const res = await request(app).get(
        "/service-configurations/service/2/grouped-by-weight-class"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(groupedRows);
      expect(Config.findByServiceGroupedByWeightClass).toHaveBeenCalledWith("2");
    });

    it("returns 400 for invalid service id", async () => {
      Config.findByServiceGroupedByWeightClass.mockRejectedValue(
        new Error("invalid service_id")
      );

      const res = await request(app).get(
        "/service-configurations/service/bad/grouped-by-weight-class"
      );

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     POST /service-configurations
  ===================================================== */
  describe("POST /service-configurations", () => {
    it("creates configuration", async () => {
      const created = {
        service_id: 2,
        weight_class_id: 3,
        price: 40,
        duration_minutes: 30,
        is_active: true,
      };

      Config.create.mockResolvedValue(created);

      const res = await request(app)
        .post("/service-configurations")
        .send(created);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(Config.create).toHaveBeenCalled();
    });

    it("returns 400 for validation error", async () => {
      Config.create.mockRejectedValue(new Error("invalid price"));

      const res = await request(app)
        .post("/service-configurations")
        .send({
          service_id: 2,
          weight_class_id: 3,
          price: -1,
          duration_minutes: 30,
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for duplicate config", async () => {
      Config.create.mockRejectedValue(
        new Error("configuration already exists")
      );

      const res = await request(app)
        .post("/service-configurations")
        .send({
          service_id: 2,
          weight_class_id: 3,
          price: 40,
          duration_minutes: 30,
        });

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     PATCH /service-configurations
  ===================================================== */
  describe("PATCH /service-configurations", () => {
    it("updates configuration", async () => {
      const updated = {
        service_id: 2,
        weight_class_id: 3,
        price: 45,
        duration_minutes: 30,
        is_active: true,
      };

      Config.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch(
          "/service-configurations?service_id=2&weight_class_id=3"
        )
        .send({ price: 45 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(Config.update).toHaveBeenCalledWith("2", "3", {
        price: 45,
      });
    });

    it("returns 404 if not found", async () => {
      Config.update.mockRejectedValue(
        new Error("configuration not found")
      );

      const res = await request(app)
        .patch(
          "/service-configurations?service_id=2&weight_class_id=3"
        )
        .send({ price: 45 });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid input", async () => {
      Config.update.mockRejectedValue(
        new Error("no fields provided for update")
      );

      const res = await request(app)
        .patch(
          "/service-configurations?service_id=2&weight_class_id=3"
        )
        .send({});

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     DELETE /service-configurations
  ===================================================== */
  describe("DELETE /service-configurations", () => {
    it("deletes configuration", async () => {
      Config.remove.mockResolvedValue(true);

      const res = await request(app).delete(
        "/service-configurations?service_id=2&weight_class_id=3"
      );

      expect(res.status).toBe(204);
      expect(Config.remove).toHaveBeenCalledWith("2", "3");
    });

    it("returns 404 if not found", async () => {
      Config.remove.mockRejectedValue(
        new Error("configuration not found")
      );

      const res = await request(app).delete(
        "/service-configurations?service_id=2&weight_class_id=3"
      );

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Config.remove.mockRejectedValue(new Error("invalid service_id"));

      const res = await request(app).delete(
        "/service-configurations?service_id=bad&weight_class_id=3"
      );

      expect(res.status).toBe(400);
    });
  });
});
