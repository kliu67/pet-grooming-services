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
} from "../stylistAvailability.model.js";

describe("stylistAvailability.model", () => {
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

  it("create validates day_of_week", async () => {
    await expect(
      create({ stylist_id: 1, day_of_week: 9, start_time: "09:00", end_time: "17:00" })
    ).rejects.toThrow("day_of_week");
  });

  it("create validates time range", async () => {
    await expect(
      create({ stylist_id: 1, day_of_week: 1, start_time: "17:00", end_time: "09:00" })
    ).rejects.toThrow("end_time must be after start_time");
  });

  it("create inserts row", async () => {
    const row = { id: 1, stylist_id: 1, day_of_week: 1, start_time: "09:00:00", end_time: "17:00:00" };
    pool.query.mockResolvedValue({ rows: [row] });
    const result = await create({ stylist_id: 1, day_of_week: 1, start_time: "09:00", end_time: "17:00" });
    expect(result).toEqual(row);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO stylist_availability"), [1, 1, "09:00", "17:00"]);
  });

  it("update throws if empty payload", async () => {
    await expect(update(1, {})).rejects.toThrow("no fields provided");
  });

  it("update returns updated row", async () => {
    const row = { id: 1, day_of_week: 2 };
    pool.query.mockResolvedValue({ rows: [row] });
    const result = await update(1, { day_of_week: 2 });
    expect(result).toEqual(row);
  });

  it("remove returns true", async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });
    await expect(remove(1)).resolves.toBe(true);
  });

  it("remove throws if not found", async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });
    await expect(remove(99)).rejects.toThrow("not found");
  });
});
