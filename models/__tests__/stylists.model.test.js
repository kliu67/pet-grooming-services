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
} from "../stylists.model.js";

describe("stylists.model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("returns all stylists", async () => {
      const mockRows = [{ id: 1, first_name: "A", last_name: "B" }];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await findAll();

      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("FROM stylists"));
    });
  });

  describe("findById", () => {
    it("throws for invalid id", async () => {
      await expect(findById("abc")).rejects.toThrow("ID must be a number");
    });

    it("returns null if missing", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await findById(99);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("validates required names", async () => {
      await expect(
        create({ first_name: "", last_name: "Doe", email: null, phone: null })
      ).rejects.toThrow("data validation error");
    });

    it("validates email format", async () => {
      await expect(
        create({
          first_name: "Jane",
          last_name: "Doe",
          email: "bad-email",
          phone: "1234567890",
        })
      ).rejects.toThrow("invalid email format");
    });

    it("inserts stylist with default active=true", async () => {
      const inserted = { id: 1, first_name: "Jane", last_name: "Doe", is_active: true };
      pool.query.mockResolvedValue({ rows: [inserted] });

      const result = await create({
        first_name: " Jane ",
        last_name: " Doe ",
        email: "JANE@EXAMPLE.COM",
        phone: "1234567890",
      });

      expect(result).toEqual(inserted);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO stylists"),
        ["Jane", "Doe", "jane@example.com", "1234567890", true]
      );
    });

    it("maps duplicate email to validation error", async () => {
      pool.query.mockRejectedValue({
        code: "23505",
        constraint: "stylists_email_key",
      });

      await expect(
        create({
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@example.com",
          phone: "1234567890",
          is_active: true,
        })
      ).rejects.toThrow("email already exists");
    });
  });

  describe("update", () => {
    it("throws for invalid id", async () => {
      await expect(update("abc", { first_name: "A" })).rejects.toThrow("invalid id");
    });

    it("throws when no fields are provided", async () => {
      await expect(update(1, {})).rejects.toThrow("no fields provided");
    });

    it("throws when is_active is not boolean", async () => {
      await expect(update(1, { is_active: "yes" })).rejects.toThrow("is_active must be boolean");
    });

    it("throws when stylist is not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(update(1, { first_name: "New" })).rejects.toThrow("stylist not found");
    });

    it("updates stylist", async () => {
      const updated = { id: 1, first_name: "New", last_name: "Name" };
      pool.query.mockResolvedValue({ rows: [updated] });

      const result = await update(1, { first_name: "New", last_name: "Name", is_active: false });

      expect(result).toEqual(updated);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE stylists"),
        expect.arrayContaining(["New", "Name", false, 1])
      );
    });
  });

  describe("remove", () => {
    it("throws for invalid id", async () => {
      await expect(remove("abc")).rejects.toThrow("invalid id");
    });

    it("throws when row not found", async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      await expect(remove(999)).rejects.toThrow("stylist not found");
    });

    it("returns true when deleted", async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await remove(1);

      expect(result).toBe(true);
    });
  });
});
