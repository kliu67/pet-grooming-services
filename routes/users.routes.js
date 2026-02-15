import express from "express";
import * as User from "../models/user.model.js";
import { isValidEmail } from "../utils/helpers.js";
import { isValidPhone } from "../validators/user.validator.js";

const CONFLICT_ERRORS = new Set([
  "email already exists",
  "phone already exists",
  "duplicate user data",
]);

const BAD_REQUEST_ERRORS = new Set([
  "invalid id",
  "invalid email format",
  "invalid phone format",
  "first name and last name cannot be null or empty",
  "phone cannot be null or empty",
  "first name cannot be empty",
  "last name cannot be empty",
  "phone cannot be empty",
  "description must be a string",
  "no fields provided for update",
  "no valid fields provided",
]);

const NOT_FOUND_ERRORS = new Set(["user not found"]);

function handleUserError(res, err) {
  const msg = err?.message ?? "Internal server error";
  if (CONFLICT_ERRORS.has(msg)) return res.status(409).json({ error: msg });
  if (NOT_FOUND_ERRORS.has(msg)) return res.status(404).json({ error: "Not found" });
  if (BAD_REQUEST_ERRORS.has(msg)) return res.status(400).json({ error: msg });
  return res.status(500).json({ error: "Internal server error" });
}


const router = express.Router();

router.get("/", async (req, res) => {

  try {
    const users = await User.findAll();
    return res.json(users);
  }
  catch (err) {
    console.error(err);
    return handleUserError(res, err);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id required" });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);

  }
  catch (err) {
    console.error(err);
    return handleUserError(res, err);
  }
});

router.post("/", async (req, res) => {
  const { first_name, last_name, phone, email } = req.body;
  if (!first_name || !last_name || !phone) {
    return res.status(400).json({ error: "first_name, last_name and phone required" });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'invalid phone format' })
  }

  try {
    const user = await User.create(req.body);
    return res.status(201).json(user);
  }
  catch (err) {
    console.error(err);
    return handleUserError(res, err);
  }
});

router.put("/:id", async (req, res) => {

  const { first_name, last_name, phone, email, description } = req.body;
  const allowed = ["first_name", "last_name", "email", "phone", "description"];
  const hasAnyAllowedField = allowed.some((k) => Object.hasOwn(req.body, k));
  if (!hasAnyAllowedField) {
    return res.status(400).json({ error: "at least one updatable field is required" });
  }

  
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'invalid phone format' })
  }

  try {
    const user = await User.update(req.params.id, req.body);
    res.status(200).json(user);
  }
  catch (err) {
    console.error(err);
    return handleUserError(res, err);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await User.remove(id);
    res.status(200).json({ message: "User deleted successfully" });
  }

  catch (err) {
    console.error(err);
    return handleUserError(res, err);
  }

});

export default router;
