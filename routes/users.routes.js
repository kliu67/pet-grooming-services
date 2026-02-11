import express from "express";
import * as User from "../models/user.model.js";
// import * from "../utils/helpers.js"
const router = express.Router();

router.get("/", async (req, res) => {
  const Users = await User.findAll();
  res.json(Users);
});

router.get("/:id", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "id required" });
  }
  const User = await User.findById(req.params.id);
  if (!User) return res.status(404).json({ error: "Not found" });
  res.json(User);
});

router.post("/", async (req, res) => {
  const { full_name, phone, email } = req.body;
  if (!full_name || !email || !phone) {
    return res.status(400).json({ error: "full_name, phone, and email required" });
  }
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const User = await User.update(req.params.id, req.body);
  const { full_name, phone, email, description } = req.body;
  if (!full_name && !email && !phone && !description){
    return res.status(400).json({ error: "at least one of the fields is required: full_name, phone, email, description" });
  }
  if (!User) return res.status(404).json({ error: "Not found" });
  res.json(User);
});

router.delete("/:id", async (req, res) => {
  const ok = await User.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
