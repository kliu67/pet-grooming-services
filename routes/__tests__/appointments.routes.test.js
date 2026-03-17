import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import appointmentRoutes from "../appointments.routes.js";
import * as Appointment from "../../models/appointments.model.js";

vi.mock("../../models/appointments.model.js");

const app = express();
app.use(express.json());
app.use("/appointments", appointmentRoutes);

describe("Appointment Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /appointments", () => {
    it("books appointment successfully", async () => {
      const mockAppt = {
        id: 1,
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        service_name_snapshot: "Bath",
        status: "booked"
      };

      Appointment.book.mockResolvedValue(mockAppt);

      const res = await request(app).post("/appointments").send({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z"
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockAppt);
    });

    it("returns 409 when appointment overlaps", async () => {
      Appointment.book.mockRejectedValue(
        new Error("appointment overlaps existing booking")
      );

      const res = await request(app).post("/appointments").send({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z"
      });

      expect(res.status).toBe(409);
    });

    it("returns 400 for validation error", async () => {
      Appointment.book.mockRejectedValue(new Error("invalid client_id"));

      const res = await request(app).post("/appointments").send({
        client_id: "bad",
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "bad"
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 when booking violates stylist buffer", async () => {
      Appointment.book.mockRejectedValue(
        new Error("stylist is not available at that time")
      );

      const res = await request(app).post("/appointments").send({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z"
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("stylist is not available");
    });

    it("returns 400 when booking overlaps stylist time off", async () => {
      Appointment.book.mockRejectedValue(
        new Error("stylist is not available at that time")
      );

      const res = await request(app).post("/appointments").send({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z"
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("stylist is not available");
    });
  });

  describe("GET /appointments/:id", () => {
    it("returns appointment", async () => {
      const mockAppt = { id: 1, status: "booked" };
      Appointment.findById.mockResolvedValue(mockAppt);

      const res = await request(app).get("/appointments/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockAppt);
    });

    it("returns 404 if not found", async () => {
      Appointment.findById.mockResolvedValue(null);

      const res = await request(app).get("/appointments/999");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Appointment.findById.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).get("/appointments/abc");

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /appointments/:id/cancel", () => {
    it("cancels appointment", async () => {
      const cancelled = { id: 1, status: "cancelled" };
      Appointment.cancel.mockResolvedValue(cancelled);

      const res = await request(app).patch("/appointments/1/cancel");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cancelled);
    });

    it("returns 404 if not found", async () => {
      Appointment.cancel.mockRejectedValue(new Error("appointment not found"));

      const res = await request(app).patch("/appointments/1/cancel");

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /appointments/:id/update", () => {
    it("updates appointment", async () => {
      const updated = {
        id: 1,
        startTime: "2026-01-01T12:00:00Z",
        status: "booked"
      };

      Appointment.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch("/appointments/1/update")
        .send({ startTime: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
    });

    it("returns 409 if stylist is not available", async () => {
      Appointment.update.mockRejectedValue(
        new Error("stylist is not available at that time")
      );

      const res = await request(app)
        .patch("/appointments/1/update")
        .send({ start_time: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(409);
    });

    it("returns 409 when update violates stylist buffer", async () => {
      Appointment.update.mockRejectedValue(
        new Error("stylist is not available at that time")
      );

      const res = await request(app)
        .patch("/appointments/1/update")
        .send({ start_time: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("stylist is not available");
    });

    it("returns 409 when update overlaps stylist time off", async () => {
      Appointment.update.mockRejectedValue(
        new Error("stylist is not available at that time")
      );

      const res = await request(app)
        .patch("/appointments/1/update")
        .send({ start_time: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("stylist is not available");
    });

    it("returns 400 for invalid input", async () => {
      Appointment.update.mockRejectedValue(new Error("invalid start_time"));

      const res = await request(app)
        .patch("/appointments/1/update")
        .send({ start_time: "bad" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /appointments/:id", () => {
    it("deletes appointment", async () => {
      Appointment.remove.mockResolvedValue(true);

      const res = await request(app).delete("/appointments/1");

      expect(res.status).toBe(204);
      expect(Appointment.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 if not found", async () => {
      Appointment.remove.mockRejectedValue(new Error("appointment not found"));

      const res = await request(app).delete("/appointments/1");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("appointment not found");
    });

    it("returns 400 for invalid id", async () => {
      Appointment.remove.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).delete("/appointments/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid id");
    });
  });
});
