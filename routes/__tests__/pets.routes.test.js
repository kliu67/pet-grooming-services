import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import petRoutes from "../pets.routes.js";
import * as Pet from "../../models/pets.model.js";

/* -------------------- Mock Model -------------------- */
vi.mock("../../models/pets.model.js");

/* -------------------- Setup App -------------------- */
const app = express();
app.use(express.json());
app.use("/pets", petRoutes);

describe("Pet Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* =====================================================
     GET /pets/owner/:ownerId
  ===================================================== */
  describe("GET /pets/owner/:ownerId", () => {
    it("returns pets for owner", async () => {
      const mockPets = [
        { id: 1, name: "Buddy", species: "Dog" },
        { id: 2, name: "Kitty", species: "Cat" },
      ];

      Pet.findByOwner.mockResolvedValue(mockPets);

      const res = await request(app).get("/pets/owner/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPets);
      expect(Pet.findByOwner).toHaveBeenCalledWith("1");
    });

    it("returns 400 for invalid owner id", async () => {
      Pet.findByOwner.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).get("/pets/owner/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("invalid id");
    });
  });

  /* =====================================================
     GET /pets/:id
  ===================================================== */
  describe("GET /pets/:id", () => {
    it("returns pet by id", async () => {
      const mockPet = { id: 1, name: "Buddy" };
      Pet.findById.mockResolvedValue(mockPet);

      const res = await request(app).get("/pets/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPet);
      expect(Pet.findById).toHaveBeenCalledWith("1");
    });

    it("returns 404 if pet not found", async () => {
      Pet.findById.mockResolvedValue(null);

      const res = await request(app).get("/pets/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it("returns 400 for invalid id", async () => {
      Pet.findById.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).get("/pets/abc");

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     POST /pets
  ===================================================== */
  describe("POST /pets", () => {
    it("creates a pet", async () => {
      const newPet = {
        id: 1,
        name: "Buddy",
        species: 1,
        owner: 1,
      };

      Pet.create.mockResolvedValue(newPet);

      const res = await request(app)
        .post("/pets")
        .send({ name: "Buddy", species: 1, owner: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(newPet);
      expect(Pet.create).toHaveBeenCalledWith({
        name: "Buddy",
        species: 1,
        owner: 1,
      });
    });

    it("returns 400 for validation error", async () => {
      Pet.create.mockRejectedValue(new Error("pet name cannot be empty"));

      const res = await request(app)
        .post("/pets")
        .send({ name: "", species: 1, owner: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  /* =====================================================
     PATCH /pets/:id
  ===================================================== */
  describe("PATCH /pets/:id", () => {
    it("updates a pet", async () => {
      const updatedPet = {
        id: 1,
        name: "Buddy Updated",
        species: 1,
        owner: 1,
      };

      Pet.update.mockResolvedValue(updatedPet);

      const res = await request(app)
        .patch("/pets/1")
        .send({ name: "Buddy Updated" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedPet);
      expect(Pet.update).toHaveBeenCalledWith("1", {
        name: "Buddy Updated",
      });
    });

    it("returns 404 if pet not found", async () => {
      Pet.update.mockRejectedValue(new Error("pet not found"));

      const res = await request(app)
        .patch("/pets/1")
        .send({ name: "New" });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid update", async () => {
      Pet.update.mockRejectedValue(
        new Error("no fields provided for update")
      );

      const res = await request(app)
        .patch("/pets/1")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  /* =====================================================
     DELETE /pets/:id
  ===================================================== */
  describe("DELETE /pets/:id", () => {
    it("deletes a pet", async () => {
      Pet.remove.mockResolvedValue(true);

      const res = await request(app).delete("/pets/1");

      expect(res.status).toBe(204);
      expect(Pet.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 if pet not found", async () => {
      Pet.remove.mockRejectedValue(new Error("pet not found"));

      const res = await request(app).delete("/pets/1");

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      Pet.remove.mockRejectedValue(new Error("invalid id"));

      const res = await request(app).delete("/pets/abc");

      expect(res.status).toBe(400);
    });
  });
});
