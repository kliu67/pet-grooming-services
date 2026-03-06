import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockRelease = vi.fn();

vi.mock("../../db.js", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(() => ({
      query: mockQuery,
      release: mockRelease
    }))
  }
}));

import { pool } from "../../db.js";
import { book, findById, cancel, reschedule } from "../appointments.model.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("book()", () => {
  it("creates appointment successfully", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] }) // pet lock
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // stylist exists
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "Kai", last_name: "Li" }] }) // client snapshot
      .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] }) // config
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [{ id: 99, status: "booked" }] }) // insert
      .mockResolvedValueOnce(); // COMMIT

    const result = await book({
      client_id: 1,
      pet_id: 1,
      service_configuration_id: 10,
      stylist_id: 2,
      start_time: new Date().toISOString()
    });

    expect(result).toEqual({ id: 99, status: "booked" });
    expect(mockRelease).toHaveBeenCalled();
  });

  it("throws when stylist is not available", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "Kai", last_name: "Li" }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // overlap exists
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date().toISOString()
      })
    ).rejects.toThrow("stylist is not available at that time");
  });

  it("throws mapped FK error (23503)", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "Kai", last_name: "Li" }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({ code: "23503" }) // insert
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date().toISOString()
      })
    ).rejects.toThrow("invalid client, pet, stylist, or service configuration");
  });

  it("maps Rachel buffer trigger error when scheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "Kai", last_name: "Li" }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "Rachel Wang requires a 20 minute buffer between appointments"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date().toISOString()
      })
    ).rejects.toThrow("stylist is not available at that time");
  });

  it("maps stylist time off trigger error when scheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, owner: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: "Kai", last_name: "Li" }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, price: 50, duration_minutes: 60, service_name: "Bath" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(
      book({
        client_id: 1,
        pet_id: 1,
        service_configuration_id: 10,
        stylist_id: 2,
        start_time: new Date().toISOString()
      })
    ).rejects.toThrow("stylist is not available at that time");
  });
});

describe("findById()", () => {
  it("returns appointment", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await findById(1);
    expect(result).toBeNull();
  });
});

describe("cancel()", () => {
  it("cancels appointment", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, status: "cancelled" }] });
    const result = await cancel(1);
    expect(result.status).toBe("cancelled");
  });

  it("throws if not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await expect(cancel(1)).rejects.toThrow("appointment not found");
  });
});

describe("reschedule()", () => {
  it("reschedules successfully", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }] }) // lock
      .mockResolvedValueOnce({ rows: [] }) // overlap check
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "booked" }] }) // update
      .mockResolvedValueOnce(); // COMMIT

    const result = await reschedule(1, new Date().toISOString());
    expect(result).toEqual({ id: 1, status: "booked" });
  });

  it("throws when stylist overlap exists", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // overlap
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, new Date().toISOString())).rejects.toThrow(
      "stylist is not available at that time"
    );
  });

  it("maps Rachel buffer trigger error when rescheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "Rachel Wang requires a 10 minute buffer between appointments"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, new Date().toISOString())).rejects.toThrow(
      "stylist is not available at that time"
    );
  });

  it("maps stylist time off trigger error when rescheduling", async () => {
    mockQuery
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, duration_snapshot: 60, stylist_id: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce({
        code: "P0001",
        message: "appointment overlaps stylist time off"
      })
      .mockResolvedValueOnce(); // ROLLBACK

    await expect(reschedule(1, new Date().toISOString())).rejects.toThrow(
      "stylist is not available at that time"
    );
  });
});
