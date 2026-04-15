import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import stylistRoutes from "../stylists.routes.js";
import * as Stylist from "../../models/stylists.model.js";

vi.mock("../../models/stylists.model.js");

const app = express();
app.use(express.json());
app.use("/stylists", stylistRoutes);

describe("Stylist Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /stylists", () => {
    it("returns all stylists", async () => {
      const mockStylists = [{ id: 1, first_name: "Rachel", last_name: "Wang" }];
      Stylist.findAll.mockResolvedValue(mockStylists);

      const res = await request(app).get("/stylists");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStylists);
      expect(Stylist.findAll).toHaveBeenCalled();
    });
  });

  describe("GET /stylists/:id", () => {
    it("returns stylist by id", async () => {
      const mockStylist = { id: 1, first_name: "Rachel", last_name: "Wang" };
      Stylist.findById.mockResolvedValue(mockStylist);

      const res = await request(app).get("/stylists/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStylist);
      expect(Stylist.findById).toHaveBeenCalledWith("1");
    });

    it("returns 404 when stylist is not found", async () => {
      Stylist.findById.mockResolvedValue(null);

      const res = await request(app).get("/stylists/999");

      expect(res.status).toBe(404);
    });

    it("returns 400 on invalid id", async () => {
      Stylist.findById.mockRejectedValue(new Error("ID must be a number"));

      const res = await request(app).get("/stylists/abc");

      expect(res.status).toBe(400);
    });
  });

  describe("POST /stylists", () => {
    it("creates stylist", async () => {
      const created = { id: 2, first_name: "Jane", last_name: "Doe" };
      Stylist.create.mockResolvedValue(created);

      const body = { first_name: "Jane", last_name: "Doe", email: "jane@example.com" };
      const res = await request(app).post("/stylists").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(Stylist.create).toHaveBeenCalledWith({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        phone: undefined,
        is_active: undefined,
      });
    });

    it("returns 400 for validation errors", async () => {
      Stylist.create.mockRejectedValue(new Error("data validation error"));

      const res = await request(app).post("/stylists").send({ first_name: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /stylists/:id", () => {
    it("updates stylist", async () => {
      const updated = { id: 1, first_name: "New", last_name: "Name" };
      Stylist.update.mockResolvedValue(updated);

      const res = await request(app).put("/stylists/1").send({ first_name: "New", last_name: "Name" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(Stylist.update).toHaveBeenCalledWith("1", { first_name: "New", last_name: "Name" });
    });

    it("returns 404 when stylist does not exist", async () => {
      Stylist.update.mockRejectedValue(new Error("stylist not found"));

      const res = await request(app).put("/stylists/1").send({ first_name: "New" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /stylists/:id", () => {
    it("deletes stylist", async () => {
      Stylist.remove.mockResolvedValue(true);

      const res = await request(app).delete("/stylists/1");

      expect(res.status).toBe(204);
      expect(Stylist.remove).toHaveBeenCalledWith("1");
    });

    it("returns 404 when stylist is not found", async () => {
      Stylist.remove.mockRejectedValue(new Error("stylist not found"));

      const res = await request(app).delete("/stylists/1");

      expect(res.status).toBe(404);
    });
  });
});
