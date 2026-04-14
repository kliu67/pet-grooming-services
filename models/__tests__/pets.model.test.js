import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mock DB ----
vi.mock("../../db.js", () => ({
  pool: {
    query: vi.fn()
  }
}));

import { pool } from "../../db.js";

import {
  findByOwner,
  findById,
  create,
  update,
  remove
} from "../pets.model.js";

beforeEach(() => {
  vi.clearAllMocks();
});

//
// FIND BY OWNER
//
describe("findByOwner", () => {
  it("returns pets for owner", async () => {
    const mockRows = [{ id: 1, name: "Buddy" }];
    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await findByOwner(1);

    expect(result).toEqual(mockRows);
    expect(pool.query).toHaveBeenCalled();
  });

  it("throws if owner id invalid", async () => {
    await expect(findByOwner(0)).rejects.toThrow("invalid id");
  });
});

//
// FIND BY ID
//
describe("findById", () => {
  it("returns pet when found", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await findById(1);

    expect(result).toEqual({ id: 1 });
  });

  it("returns null when not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await findById(1);

    expect(result).toBeNull();
  });

  it("throws if id invalid", async () => {
    await expect(findById(0)).rejects.toThrow("invalid id");
  });
});

//
// CREATE
//
describe("create", () => {
  it("throws if name invalid", async () => {
    await expect(create({ name: "", breed: 1, owner: 1, weightClassId: 1 })).rejects.toThrow(
      "pet name cannot be empty"
    );
  });

  it("throws if breed invalid", async () => {
    await expect(
      create({ name: "Buddy", breed: 0, owner: 1, weightClassId: 1 })
    ).rejects.toThrow("invalid id");
  });

  it("throws if owner invalid", async () => {
    await expect(
      create({ name: "Buddy", breed: 1, owner: 0, weightClassId: 1 })
    ).rejects.toThrow("invalid id");
  });

  it("throws if weight class is missing", async () => {
    await expect(
      create({ name: "Buddy", breed: 1, owner: 1 })
    ).rejects.toThrow("invalid id");
  });

  it("creates and returns row", async () => {
    const mockRow = { id: 1, name: "Buddy" };
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // weight class lookup
      .mockResolvedValueOnce({ rows: [mockRow] }); // insert

    const result = await create({
      name: "Buddy",
      breed: 1,
      owner: 1,
      weightClassId: 1,
    });

    expect(result).toEqual(mockRow);
    expect(pool.query).toHaveBeenCalled();
  });

  it("creates pet with optional pet_species", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // weight class lookup
      .mockResolvedValueOnce({ rows: [{ id: 2, pet_species: "dog" }] }); // insert

    await create({
      name: "Buddy",
      breed: 1,
      owner: 1,
      weightClassId: 1,
      pet_species: "dog",
    });

    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO pets (name, species, breed, owner, weight_class_id)"),
      ["Buddy", "dog", 1, 1, 1],
    );
  });

  it("throws if pet species exceeds 60 characters", async () => {
    await expect(
      create({
        name: "Buddy",
        breed: 1,
        owner: 1,
        weightClassId: 1,
        pet_species: "a".repeat(61),
      }),
    ).rejects.toThrow("pet species cannot exceed 60 characters");
  });

  it("handles FK violation", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // weight class lookup
      .mockRejectedValueOnce({ code: "23503" }); // insert FK failure

    await expect(
      create({
        name: "Buddy",
        breed: 999,
        owner: 1,
        weightClassId: 1,
      })
    ).rejects.toThrow("invalid breed or owner");
  });
});

it("handles invalid weight class FK", async () => {
  pool.query.mockResolvedValueOnce({ rows: [] }); // weight class lookup returns nothing

  await expect(
    create({
      name: "Buddy",
      breed: 1,
      owner: 1,
      weightClassId: 999,
    })
  ).rejects.toThrow("Invalid weight class");
});

//
// UPDATE
//
describe("update", () => {
  it("throws if id invalid", async () => {
    await expect(update(0, { name: "Buddy" })).rejects.toThrow("invalid id");
  });

  it("throws if empty update", async () => {
    await expect(update(1, {})).rejects.toThrow(
      "no fields provided for update"
    );
  });

  it("updates and returns row", async () => {
    const mockRow = { id: 1 };
    pool.query.mockResolvedValue({ rows: [mockRow] });

    const result = await update(1, { name: "Buddy" });

    expect(result).toEqual(mockRow);
  });

  it("updates pet_species when provided", async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, pet_species: "cat" }] });

    const result = await update(1, { pet_species: "cat" });

    expect(result).toEqual({ id: 1, pet_species: "cat" });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("species = $1"),
      ["cat", 1],
    );
  });

  it("throws if pet not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(update(1, { name: "Buddy" })).rejects.toThrow("pet not found");
  });

  it("handles invalid breed FK", async () => {
    pool.query.mockRejectedValue({ code: "23503" });

    await expect(update(1, { breed: 999 })).rejects.toThrow(
      "invalid breed"
    );
  });

  it("handles invalid weight class FK", async () => {
    pool.query.mockRejectedValue({ code: "23503" });

    await expect(update(1, { weightClassId: 999 })).rejects.toThrow(
      "Invalid weight class"
    );
  });
});

//
// REMOVE
//
describe("remove", () => {
  it("throws if id invalid", async () => {
    await expect(remove(0)).rejects.toThrow("invalid id");
  });

  it("throws if pet not found", async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    await expect(remove(1)).rejects.toThrow("pet not found");
  });

  it("returns true when deleted", async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const result = await remove(1);

    expect(result).toBe(true);
  });
});
