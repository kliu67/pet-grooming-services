import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import appointmentRoutes from "../appointments.routes.js";
import * as Appointment from "../../models/appointments.model.js";
import { sendAppointmentCreatedEmail } from "../../services/appointmentEmail.service.js";

vi.mock("../../models/appointments.model.js");
vi.mock("../../services/appointmentEmail.service.js", () => ({
  sendAppointmentCreatedEmail: vi.fn(),
}));

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

  describe("POST /appointments/from-scratch", () => {
    it("books appointment from scratch successfully", async () => {
      const mockAppt = {
        id: 101,
        client_id: 1,
        pet_id: 10,
        service_id: 3,
        service_name: "Full Groom",
        breed_name: "Poodle",
        stylist_id: 2,
        status: "booked",
      };

      Appointment.bookFromScratch.mockResolvedValue(mockAppt);

      const res = await request(app).post("/appointments/from-scratch").send({
        first_name: "Kai",
        last_name: "Li",
        phone: "1234567890",
        email: "kai@example.com",
        pet_name: "Mochi",
        breed_id: 2,
        weight_class_id: 1,
        service_id: 3,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z",
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockAppt);
      expect(Appointment.bookFromScratch).toHaveBeenCalledTimes(1);
      expect(sendAppointmentCreatedEmail).toHaveBeenCalledTimes(1);
      expect(sendAppointmentCreatedEmail).toHaveBeenCalledWith({
        to: "kai@example.com",
        customerName: "Kai Li",
        petName: "Mochi",
        serviceName: "Full Groom",
        breedName: "Poodle",
        startTime: undefined,
        appointmentNumber: undefined,
      });
    });

    it("still books from scratch when email sending fails", async () => {
      const mockAppt = {
        id: 102,
        client_id: 1,
        pet_id: 11,
        service_id: 3,
        stylist_id: 2,
        status: "booked",
      };

      Appointment.bookFromScratch.mockResolvedValue(mockAppt);
      sendAppointmentCreatedEmail.mockRejectedValue(
        new Error("email send failed"),
      );

      const res = await request(app).post("/appointments/from-scratch").send({
        first_name: "Kai",
        last_name: "Li",
        phone: "1234567890",
        email: "kai@example.com",
        pet_name: "Mochi",
        breed_id: 2,
        weight_class_id: 1,
        service_id: 3,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z",
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockAppt);
      expect(sendAppointmentCreatedEmail).toHaveBeenCalledTimes(1);
    });

    it("returns 409 when appointment overlaps", async () => {
      Appointment.bookFromScratch.mockRejectedValue(
        new Error("appointment overlaps existing booking"),
      );

      const res = await request(app).post("/appointments/from-scratch").send({
        first_name: "Kai",
        last_name: "Li",
        phone: "1234567890",
        pet_name: "Mochi",
        breed_id: 2,
        weight_class_id: 1,
        service_id: 3,
        stylist_id: 2,
        start_time: "2026-01-01T10:00:00Z",
      });

      expect(res.status).toBe(409);
    });

    it("returns 400 for validation error", async () => {
      Appointment.bookFromScratch.mockRejectedValue(new Error("invalid first_name"));

      const res = await request(app).post("/appointments/from-scratch").send({
        first_name: "",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid first_name");
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

    it("adds appointment_number when missing on DB-like row", async () => {
      const mockAppt = { id: 12, uuid: "ea5b7f30-8ed7-4d9f-8df0-5998b356d8d1", status: "booked" };
      Appointment.findById.mockResolvedValue(mockAppt);

      const res = await request(app).get("/appointments/12");

      expect(res.status).toBe(200);
      expect(res.body.appointment_number).toBe("APT-00000012");
    });
  });

  describe("GET /appointments/stylist/:stylistId", () => {
    it("returns appointments for stylist", async () => {
      const mockAppointments = [
        { id: 1, stylist_id: 2, status: "booked" },
        { id: 2, stylist_id: 2, status: "confirmed" },
      ];
      Appointment.findByStylistId.mockResolvedValue(mockAppointments);

      const res = await request(app).get("/appointments/stylist/2");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockAppointments);
    });

    it("returns 400 for invalid stylist id", async () => {
      Appointment.findByStylistId.mockRejectedValue(new Error("invalid stylist id"));

      const res = await request(app).get("/appointments/stylist/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid stylist id");
    });
  });

  describe("GET /appointments/stylist/:stylistId/upcoming", () => {
    it("returns upcoming appointments for stylist", async () => {
      const upcoming = [
        { id: 11, stylist_id: 2, effective_end_time: "2099-01-01T10:30:00.000Z" },
        { id: 12, stylist_id: 2, effective_end_time: "2099-01-01T11:00:00.000Z" },
      ];
      Appointment.findUpcomingByStylistId.mockResolvedValue(upcoming);

      const res = await request(app).get("/appointments/stylist/2/upcoming");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(upcoming);
    });

    it("returns 400 for invalid stylist id", async () => {
      Appointment.findUpcomingByStylistId.mockRejectedValue(new Error("invalid stylist id"));

      const res = await request(app).get("/appointments/stylist/abc/upcoming");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid stylist id");
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
