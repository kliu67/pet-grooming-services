import * as User from "../models/users.model.js";
import { isValidEmail } from "../utils/helpers.js";
import { isValidPhone } from "../validators/user.validator.js";

/**
 * GET /users
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:id
 */
export async function getUserById(req, res, next) {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users
 */
export async function createUser(req, res, next) {
  const { first_name, last_name, phone, email } = req.body;

  if (!first_name || !last_name || !phone) {
    return res.status(400).json({
      error: "first_name, last_name and phone are required",
    });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid phone format" });
  }

  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.message?.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * PUT /users/:id
 */
export async function updateUser(req, res, next) {
  const { id } = req.params;
  const { first_name, last_name, phone, email, description } = req.body;

  if (!first_name && !last_name && !email && !phone && !description) {
    return res.status(400).json({
      error:
        "At least one field required: first_name, last_name, phone, email, description",
    });
  }

  if (email !== undefined && email !== null && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (phone !== undefined && phone !== null && !isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid phone format" });
  }

  try {
    const user = await User.update(id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    if (err.message === "invalid id") {
      return res.status(400).json({ error: "invalid id" });
    }
    if (err.message === "user not found") {
      return res.status(404).json({ error: "User not found" });
    }
    if (err.message?.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * DELETE /users/:id
 */
export async function deleteUser(req, res, next) {
  const { id } = req.params;

  try {
    const ok = await User.remove(id);
    if (!ok) return res.status(404).json({ error: "User not found" });

    res.sendStatus(204);
  } catch (err) {
    if (err.message === "invalid id") {
      return res.status(400).json({ error: "invalid id" });
    }
    if (err.message === "user not found") {
      return res.status(404).json({ error: "User not found" });
    }
    next(err);
  }
}
