import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import appointmentRoutes from "../appointments.routes.js";
import * as Appointment from "../../models/appointments.model.js";

/* ---------------- Mock Model ---------------- */
vi.mock("../../models/appointments.model.js");

/* ---------------- Setup App ---------------- */
const app = express();
app.use(express.json());
app.use("/appointments", appointmentRoutes);

describe("Appointment Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =====================================================
     POST /appointments (BOOK)
  ===================================================== */
  describe("POST /appointments", () => {
    it("books appointment successfully", async () => {
      const mockAppt = {
        id: 1,
        user_id: 1,
        pet_id: 1,
        service_id: 2,
        start_time: "2026-01-01T10:00:00Z",
        end_time: "2026-01-01T11:00:00Z",
        status: "booked",
      };

      Appointment.book.mockResolvedValue(mockAppt);

      const res = await request(app).post("/appointments").send({
        user_id: 1,
        pet_id: 1,
        service_id: 2,
        start_time: "2026-01-01T10:00:00Z",
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockAppt);
      expect(Appointment.book).toHaveBeenCalled();
    });

    it("returns 409 when appointment overlaps", async () => {
      Appointment.book.mockRejectedValue(
        new Error("appointment overlaps existing booking")
      );

      const res = await request(app).post("/appointments").send({
        user_id: 1,
        pet_id: 1,
        service_id: 2,
        start_time: "2026-01-01T10:00:00Z",
      });

      expect(res.status).toBe(409);
    });

    it("returns 400 for validation error", async () => {
      Appointment.book.mockRejectedValue(new Error("invalid user_id"));

      const res = await request(app).post("/appointments").send({
        user_id: "abc",
        pet_id: 1,
        service_id: 2,
        start_time: "bad",
      });

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     GET /appointments/:id
  ===================================================== */
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

  /* =====================================================
     PATCH /appointments/:id/cancel
  ===================================================== */
  describe("PATCH /appointments/:id/cancel", () => {
    it("cancels appointment", async () => {
      const cancelled = { id: 1, status: "cancelled" };
      Appointment.cancel.mockResolvedValue(cancelled);

      const res = await request(app).patch("/appointments/1/cancel");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cancelled);
    });

    it("returns 404 if not found", async () => {
      Appointment.cancel.mockRejectedValue(
        new Error("appointment not found")
      );

      const res = await request(app).patch("/appointments/1/cancel");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Appointment.cancel.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).patch("/appointments/abc/cancel");

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     PATCH /appointments/:id/reschedule
  ===================================================== */
  describe("PATCH /appointments/:id/reschedule", () => {
    it("reschedules appointment", async () => {
      const updated = {
        id: 1,
        start_time: "2026-01-01T12:00:00Z",
        status: "booked",
      };

      Appointment.reschedule.mockResolvedValue(updated);

      const res = await request(app)
        .patch("/appointments/1/reschedule")
        .send({ start_time: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
    });

    it("returns 409 if overlap occurs", async () => {
      Appointment.reschedule.mockRejectedValue(
        new Error("new time overlaps existing booking")
      );

      const res = await request(app)
        .patch("/appointments/1/reschedule")
        .send({ start_time: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(409);
    });

    it("returns 404 if not found", async () => {
      Appointment.reschedule.mockRejectedValue(
        new Error("appointment not found")
      );

      const res = await request(app)
        .patch("/appointments/1/reschedule")
        .send({ start_time: "2026-01-01T12:00:00Z" });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid input", async () => {
      Appointment.reschedule.mockRejectedValue(
        new Error("invalid start_time")
      );

      const res = await request(app)
        .patch("/appointments/1/reschedule")
        .send({ start_time: "bad" });

      expect(res.status).toBe(400);
    });
  });
});
