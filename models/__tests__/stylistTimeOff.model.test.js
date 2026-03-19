import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../../db.js";
import {
  findAll,
  findById,
  create,
  update,
  remove,
} from "../stylistTimeOff.model.js";

describe("stylistTimeOff.model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findAll returns rows", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await findAll();
    expect(result).toEqual([{ id: 1 }]);
  });

  it("findById validates id", async () => {
    await expect(findById("abc")).rejects.toThrow("ID must be a number");
  });

  it("create validates datetime order", async () => {
    await expect(
      create({
        stylist_id: 1,
        start_datetime: "2026-03-10T10:00:00Z",
        end_datetime: "2026-03-09T10:00:00Z",
      })
    ).rejects.toThrow("end_datetime must be after start_datetime");
  });

  it("create inserts row", async () => {
    const row = { id: 1, stylist_id: 1, reason: "Vacation" };
    pool.query.mockResolvedValue({ rows: [row] });
    const payload = {
      stylist_id: 1,
      start_datetime: "2026-03-10T10:00:00Z",
      end_datetime: "2026-03-10T18:00:00Z",
      reason: "Vacation",
    };
    const result = await create(payload);
    expect(result).toEqual(row);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO stylist_time_offs"),
      [
        1,
        new Date(payload.start_datetime).toISOString(),
        new Date(payload.end_datetime).toISOString(),
        "Vacation",
      ]
    );
  });

  it("update throws if no fields", async () => {
    await expect(update(1, {})).rejects.toThrow("no fields provided");
  });

  it("update returns updated row", async () => {
    const row = { id: 1, reason: "Sick leave" };
    pool.query.mockResolvedValue({ rows: [row] });
    const result = await update(1, { reason: "Sick leave" });
    expect(result).toEqual(row);
  });

  it("remove returns true", async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });
    await expect(remove(1)).resolves.toBe(true);
  });

  it("remove throws if not found", async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });
    await expect(remove(999)).rejects.toThrow("not found");
  });
});
