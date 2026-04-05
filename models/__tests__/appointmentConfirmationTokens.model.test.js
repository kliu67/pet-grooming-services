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
  findByAppointmentId,
  create,
  update,
  remove,
} from "../appointmentConfirmationTokens.model.js";

describe("appointmentConfirmationTokens.model", () => {
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

  it("findByAppointmentId validates id", async () => {
    await expect(findByAppointmentId("abc")).rejects.toThrow(
      "ID must be a number",
    );
  });

  it("create inserts row", async () => {
    const row = { id: 1, appointment_id: 1, token_hash: "hash" };
    pool.query.mockResolvedValue({ rows: [row] });
    const payload = {
      appointment_id: 1,
      token_hash: "hash",
      expires_at: "2026-03-25T10:00:00Z",
      revoked_at: null,
    };

    const result = await create(payload);
    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        appointment_id: 1,
        token_hash: "hash",
      }),
    );
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
  });

  it("create maps duplicate hash to friendly error", async () => {
    pool.query.mockRejectedValue({ code: "23505" });
    await expect(
      create({
        appointment_id: 1,
        token_hash: "hash",
        expires_at: "2026-03-25T10:00:00Z",
      }),
    ).rejects.toThrow("token hash already exists");
  });

  it("update throws if no fields", async () => {
    await expect(update(1, {})).rejects.toThrow("no fields provided");
  });

  it("update returns updated row", async () => {
    const row = { id: 1, appointment_id: 1, token_hash: "new-hash" };
    pool.query.mockResolvedValue({ rows: [row] });
    const result = await update(1, { token_hash: "new-hash" });
    expect(result).toEqual(row);
  });

  it("remove returns true", async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });
    await expect(remove(1)).resolves.toBe(true);
  });

  it("remove throws if not found", async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });
    await expect(remove(999)).rejects.toThrow(
      "appointment confirmation token not found",
    );
  });
});
