import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import routes from "../stylistAvailability.routes.js";
import * as Model from "../../models/stylistAvailability.model.js";

vi.mock("../../models/stylistAvailability.model.js");

const app = express();
app.use(express.json());
app.use("/availability", routes);

describe("stylistAvailability.routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET / returns rows", async () => {
    Model.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await request(app).get("/availability");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });

  it("GET /:id returns 404 if missing", async () => {
    Model.findById.mockResolvedValue(null);
    const res = await request(app).get("/availability/99");
    expect(res.status).toBe(404);
  });

  it("POST / creates row", async () => {
    Model.create.mockResolvedValue({ id: 1 });
    const payload = { stylist_id: 1, day_of_week: 1, start_time: "09:00", end_time: "17:00" };
    const res = await request(app).post("/availability").send(payload);
    expect(res.status).toBe(201);
    expect(Model.create).toHaveBeenCalledWith(payload);
  });

  it("PUT /:id updates row", async () => {
    Model.update.mockResolvedValue({ id: 1, day_of_week: 2 });
    const res = await request(app).put("/availability/1").send({ day_of_week: 2 });
    expect(res.status).toBe(200);
    expect(Model.update).toHaveBeenCalledWith("1", { day_of_week: 2 });
  });

  it("DELETE /:id deletes row", async () => {
    Model.remove.mockResolvedValue(true);
    const res = await request(app).delete("/availability/1");
    expect(res.status).toBe(204);
    expect(Model.remove).toHaveBeenCalledWith("1");
  });
});
