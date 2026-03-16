import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllStylists,
  getStylistById,
  createStylist,
  updateStylist,
  deleteStylist,
} from "../stylists.controller.js";
import * as Stylist from "../../models/stylists.model.js";

vi.mock("../../models/stylists.model.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

describe("stylists.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllStylists returns rows", async () => {
    const req = {};
    const res = mockRes();
    Stylist.findAll.mockResolvedValue([{ id: 1 }]);

    await getAllStylists(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it("getStylistById returns 404 if missing", async () => {
    const req = { params: { id: "9" } };
    const res = mockRes();
    Stylist.findById.mockResolvedValue(null);

    await getStylistById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("getStylistById returns 400 on invalid id error", async () => {
    const req = { params: { id: "abc" } };
    const res = mockRes();
    Stylist.findById.mockRejectedValue(new Error("ID must be a number"));

    await getStylistById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("createStylist returns 201", async () => {
    const req = {
      body: { first_name: "A", last_name: "B", email: "a@b.com", phone: "1234567890" },
    };
    const res = mockRes();
    Stylist.create.mockResolvedValue({ id: 1 });

    await createStylist(req, res);

    expect(Stylist.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("createStylist returns 400 for validation", async () => {
    const req = { body: { first_name: "" } };
    const res = mockRes();
    Stylist.create.mockRejectedValue(new Error("data validation error"));

    await createStylist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updateStylist returns 404 when missing", async () => {
    const req = { params: { id: "1" }, body: { first_name: "x" } };
    const res = mockRes();
    Stylist.update.mockRejectedValue(new Error("stylist not found"));

    await updateStylist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("updateStylist returns 400 for validation", async () => {
    const req = { params: { id: "1" }, body: { is_active: "yes" } };
    const res = mockRes();
    Stylist.update.mockRejectedValue(new Error("data validation error"));

    await updateStylist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("deleteStylist returns 204 on success", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    Stylist.remove.mockResolvedValue(true);

    await deleteStylist(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("deleteStylist returns 404 when missing", async () => {
    const req = { params: { id: "1" } };
    const res = mockRes();
    Stylist.remove.mockRejectedValue(new Error("stylist not found"));

    await deleteStylist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
