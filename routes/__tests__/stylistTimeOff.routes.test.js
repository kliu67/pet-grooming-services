import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import routes from "../stylistTimeOff.routes.js";
import * as Model from "../../models/stylistTimeOff.model.js";

vi.mock("../../models/stylistTimeOff.model.js");

const app = express();
app.use(express.json());
app.use("/timeOffs", routes);

describe("stylistTimeOff.routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET / returns rows", async () => {
    Model.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await request(app).get("/timeOffs");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });

  it("GET /stylist/:stylistId/upcoming returns future rows", async () => {
    Model.findUpcomingByStylistId.mockResolvedValue([{ id: 2, stylist_id: 1 }]);
    const res = await request(app).get("/timeOffs/stylist/1/upcoming");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 2, stylist_id: 1 }]);
  });

  it("GET /stylist/:stylistId/upcoming returns 400 for invalid stylist id", async () => {
    Model.findUpcomingByStylistId.mockRejectedValue(new Error("ID must be a number"));
    const res = await request(app).get("/timeOffs/stylist/abc/upcoming");
    expect(res.status).toBe(400);
  });

  it("GET /:id returns 404 if missing", async () => {
    Model.findById.mockResolvedValue(null);
    const res = await request(app).get("/timeOffs/99");
    expect(res.status).toBe(404);
  });

  it("POST / creates row", async () => {
    Model.create.mockResolvedValue({ id: 1 });
    const payload = {
      stylist_id: 1,
      start_datetime: "2026-03-10T10:00:00Z",
      end_datetime: "2026-03-10T18:00:00Z",
      reason: "Vacation",
    };
    const res = await request(app).post("/timeOffs").send(payload);
    expect(res.status).toBe(201);
    expect(Model.create).toHaveBeenCalledWith(payload);
  });

  it("PUT /:id updates row", async () => {
    Model.update.mockResolvedValue({ id: 1, reason: "Updated" });
    const res = await request(app).put("/timeOffs/1").send({ reason: "Updated" });
    expect(res.status).toBe(200);
    expect(Model.update).toHaveBeenCalledWith("1", { reason: "Updated" });
  });

  it("DELETE /:id deletes row", async () => {
    Model.remove.mockResolvedValue(true);
    const res = await request(app).delete("/timeOffs/1");
    expect(res.status).toBe(204);
    expect(Model.remove).toHaveBeenCalledWith("1");
  });
});
