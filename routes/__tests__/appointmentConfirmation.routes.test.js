import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import appointmentConfirmationRoutes from "../appointmentConfirmation.routes.js";
import * as AppointmentConfirmation from "../../models/appointmentConfirmation.model.js";

vi.mock("../../models/appointmentConfirmation.model.js");

const app = express();
app.use(express.json());
app.use("/appointmentConfirmations", appointmentConfirmationRoutes);

describe("Appointment Confirmation Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /appointmentConfirmations/:appointmentId", () => {
    it("returns appointment confirmation details", async () => {
      const mockConfirmation = {
        appointment_id: 1,
        appointment_number: "APT-00000001",
        status: "booked",
        pet_species: "dog",
      };
      AppointmentConfirmation.findByAppointmentId.mockResolvedValue(
        mockConfirmation,
      );

      const res = await request(app).get("/appointmentConfirmations/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockConfirmation);
      expect(AppointmentConfirmation.findByAppointmentId).toHaveBeenCalledWith(
        "1",
      );
    });

    it("returns 404 when appointment confirmation is not found", async () => {
      AppointmentConfirmation.findByAppointmentId.mockResolvedValue(null);

      const res = await request(app).get("/appointmentConfirmations/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("appointment confirmation not found");
    });

    it("returns 400 for invalid appointment id", async () => {
      AppointmentConfirmation.findByAppointmentId.mockRejectedValue(
        new Error("invalid id"),
      );

      const res = await request(app).get("/appointmentConfirmations/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid id");
    });

    it("returns 500 for unexpected errors", async () => {
      AppointmentConfirmation.findByAppointmentId.mockRejectedValue(
        new Error("database unavailable"),
      );

      const res = await request(app).get("/appointmentConfirmations/1");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("database unavailable");
    });
  });
});
