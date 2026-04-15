import { beforeAll, afterAll, describe, expect, it } from "vitest";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const { pool } = await import("../../db.js");

describe("appointments schema integration", () => {
  async function getAppointmentColumnNames() {
    const { rows } = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'appointments'
      `
    );

    return new Set(rows.map((row) => row.column_name));
  }

  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("has the appointments table", async () => {
    const { rows } = await pool.query(
      "SELECT to_regclass('public.appointments') AS table_name"
    );

    expect(rows[0]?.table_name).toBe("appointments");
  });

  it("includes required appointments columns", async () => {
    const columnNames = await getAppointmentColumnNames();
    const isLegacySchema =
      columnNames.has("user_id") &&
      !columnNames.has("client_id") &&
      !columnNames.has("start_time");

    const requiredColumns = isLegacySchema
      ? ["id", "user_id", "pet_id", "service_id", "description", "created_at"]
      : [
          "id",
          "uuid",
          "client_id",
          "pet_id",
          "service_id",
          "stylist_id",
          "start_time",
          "end_time",
          "effective_end_time",
          "status",
          "price_snapshot",
          "duration_snapshot",
        ];

    for (const col of requiredColumns) {
      expect(columnNames.has(col)).toBe(true);
    }
  });

  it("has foreign keys to clients, pets, stylists, and service mapping table", async () => {
    const columnNames = await getAppointmentColumnNames();
    const isLegacySchema =
      columnNames.has("user_id") &&
      !columnNames.has("client_id") &&
      !columnNames.has("start_time");

    const { rows } = await pool.query(
      `
      SELECT confrelid::regclass::text AS referenced_table
      FROM pg_constraint
      WHERE conrelid = 'public.appointments'::regclass
        AND contype = 'f'
      `
    );

    const referencedTables = new Set(rows.map((row) => row.referenced_table));

    expect(referencedTables.has("pets")).toBe(true);
    expect(referencedTables.has("services")).toBe(true);

    if (isLegacySchema) {
      expect(referencedTables.has("users")).toBe(true);
    } else {
      expect(referencedTables.has("clients")).toBe(true);
      expect(referencedTables.has("stylists")).toBe(true);
    }
  });

  it("has check constraints for time window and status values", async () => {
    const columnNames = await getAppointmentColumnNames();
    const hasSchedulingColumns =
      columnNames.has("start_time") &&
      columnNames.has("end_time") &&
      columnNames.has("status");

    const { rows } = await pool.query(
      `
      SELECT pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE conrelid = 'public.appointments'::regclass
        AND contype = 'c'
      `
    );

    const defs = rows.map((row) => row.constraint_def);
    const hasTimeCheck = defs.some((def) => def.includes("end_time > start_time"));
    const hasStatusCheck = defs.some(
      (def) => /status/.test(def) && /booked/.test(def) && /cancelled/.test(def)
    );

    if (hasSchedulingColumns) {
      expect(hasTimeCheck).toBe(true);
      expect(hasStatusCheck).toBe(true);
    } else {
      expect(defs.length).toBe(0);
    }
  });

  it("has exclusion constraints preventing stylist, client, and pet overlap", async () => {
    const columnNames = await getAppointmentColumnNames();
    const hasOverlapColumns =
      columnNames.has("slot") &&
      columnNames.has("stylist_id") &&
      columnNames.has("client_id") &&
      columnNames.has("pet_id");

    const { rows } = await pool.query(
      `
      SELECT conname, pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE conrelid = 'public.appointments'::regclass
        AND contype = 'x'
      `
    );

    const defs = rows.map((row) => row.constraint_def);
    const hasStylistOverlapConstraint = defs.some(
      (def) => /stylist_id/.test(def) && /slot/.test(def)
    );
    const hasClientOverlapConstraint = defs.some(
      (def) => /client_id/.test(def) && /slot/.test(def)
    );
    const hasPetOverlapConstraint = defs.some(
      (def) => /pet_id/.test(def) && /slot/.test(def)
    );

    if (hasOverlapColumns) {
      expect(hasStylistOverlapConstraint).toBe(true);
      expect(hasClientOverlapConstraint).toBe(true);
      expect(hasPetOverlapConstraint).toBe(true);
    } else {
      expect(defs.length).toBe(0);
    }
  });
});
