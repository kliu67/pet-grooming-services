import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import bcrypt from "bcrypt";
import { pool } from "../../db.js";
import { getSessionUser, login, signup } from "../auth.service.js";

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signup", () => {
    it("hashes the password and returns the created user", async () => {
      bcrypt.hash.mockResolvedValue("hashed-password");
      pool.query.mockResolvedValue({
        rows: [{ id: 1, email: "test@example.com" }],
      });

      const result = await signup("test@example.com", "Password1");

      expect(bcrypt.hash).toHaveBeenCalledWith("Password1", 10);
      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO users (email, password_hash)
     VALUES ($1,$2)
     RETURNING id,email`,
        ["test@example.com", "hashed-password"],
      );
      expect(result).toEqual({ id: 1, email: "test@example.com" });
    });
  });

  describe("login", () => {
    it("throws when the user does not exist", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(login("missing@example.com", "Password1")).rejects.toThrow(
        "Invalid credentials",
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("throws when the password is invalid", async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, email: "test@example.com", password_hash: "hash" }],
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(login("test@example.com", "wrong-password")).rejects.toThrow(
        "Invalid credentials",
      );

      expect(bcrypt.compare).toHaveBeenCalledWith("wrong-password", "hash");
    });

    it("returns the sanitized session user when credentials are valid", async () => {
      const lastLoginAt = "2026-03-16T12:00:00.000Z";
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 7,
              email: "test@example.com",
              password_hash: "hash",
              first_name: "Taylor",
              last_name: "Kim",
              phone: "5551234567",
              role: "admin",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ last_login_at: lastLoginAt }],
        });
      bcrypt.compare.mockResolvedValue(true);

      const result = await login("test@example.com", "Password1");

      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        `SELECT * FROM users WHERE email=$1`,
        ["test@example.com"],
      );
      expect(bcrypt.compare).toHaveBeenCalledWith("Password1", "hash");
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        `UPDATE users
      SET last_login_at = NOW()
      WHERE id = $1
      RETURNING last_login_at`,
        [7],
      );
      expect(result).toEqual({
        id: 7,
        first_name: "Taylor",
        last_name: "Kim",
        email: "test@example.com",
        phone: "5551234567",
        role: "admin",
        last_login_at: lastLoginAt,
      });
    });
  });

  describe("getSessionUser", () => {
    it("returns the user when found", async () => {
      const user = {
        id: 3,
        email: "test@example.com",
        phone: "5551234567",
        first_name: "Taylor",
        last_name: "Kim",
        role: "client",
        last_login_at: "2026-03-16T12:00:00.000Z",
      };
      pool.query.mockResolvedValue({ rows: [user] });

      const result = await getSessionUser(3);

      expect(pool.query).toHaveBeenCalledWith(
        `SELECT id, email, phone, first_name, last_name, role, last_login_at
     FROM users
     WHERE id = $1`,
        [3],
      );
      expect(result).toEqual(user);
    });

    it("returns null when the user is not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getSessionUser(99);

      expect(result).toBeNull();
    });
  });
});
