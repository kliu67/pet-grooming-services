import { beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import {
  sendAppointmentCreatedEmail,
  verifyEmailTransport,
} from "../appointmentEmail.service.js";

const { sendMailMock, verifyMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: sendMailMock,
      verify: verifyMock,
    })),
  },
}));

const ORIGINAL_ENV = { ...process.env };

describe("appointmentEmail.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.APPOINTMENT_EMAIL_FROM = "Salon <yourgmail@gmail.com>";
    process.env.GMAIL_USER = "yourgmail@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "app-password";
    delete process.env.BOOKING_NOTIFICATION_EMAIL;
    delete process.env.BOOKING_NOTIFICATION_DOMAIN;
  });

  it("sends customer and internal booking notification with different messages", async () => {
    process.env.BOOKING_NOTIFICATION_EMAIL = "bookings@yourdomain.com";
    process.env.BOOKING_NOTIFICATION_DOMAIN = "yourdomain.com";
    sendMailMock.mockResolvedValue({});

    await sendAppointmentCreatedEmail({
      to: "kai@example.com",
      customerName: "Kai Li",
      customerPhone: "1234567890",
      petName: "Mochi",
      serviceName: "Full Groom",
      breedName: "Poodle",
      startTime: "2099-01-01T15:00:00.000Z",
      appointmentNumber: "APT-00000500",
    });

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    const customerMail = sendMailMock.mock.calls[0][0];
    const internalMail = sendMailMock.mock.calls[1][0];

    expect(customerMail.to).toBe("kai@example.com");
    expect(customerMail.subject).toBe("Appointment booked (APT-00000500)");
    expect(customerMail.text).toContain("Breed: Poodle");
    expect(customerMail.text).toContain("Service: Full Groom");

    expect(internalMail.to).toBe("bookings@yourdomain.com");
    expect(internalMail.subject).toBe("New booking alert (APT-00000500)");
    expect(internalMail.text).toContain("New appointment booked.");
    expect(internalMail.text).toContain("Customer Phone: 1234567890");
    expect(internalMail.text).toContain("Customer Email: kai@example.com");
    expect(internalMail.text).toContain("Breed: Poodle");
    expect(internalMail.text).toContain("Service: Full Groom");
  });

  it("returns not-configured when smtp env vars are missing", async () => {
    delete process.env.GMAIL_APP_PASSWORD;

    const result = await sendAppointmentCreatedEmail({
      to: "kai@example.com",
      customerName: "Kai Li",
      petName: "Mochi",
      startTime: "2099-01-01T15:00:00.000Z",
      appointmentNumber: "APT-00000500",
    });

    expect(result).toEqual({ sent: false, reason: "not-configured" });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("verifyEmailTransport returns ok when transport verification succeeds", async () => {
    verifyMock.mockResolvedValue(true);

    const result = await verifyEmailTransport();

    expect(result).toEqual({ ok: true });
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(verifyMock).toHaveBeenCalledTimes(1);
  });
});
