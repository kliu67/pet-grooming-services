import * as User from "../models/users.model.js";
import { isValidEmail, isValidPhone } from "../validators/client.validator.js";

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
  const { email, password, phone, first_name, last_name } = req.body;

  if (!email || !password || !phone || !first_name || !last_name) {
    return res.status(400).json({
      error: "email, password, phone, first_name, last_name are required",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid phone format" });
  }

  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: "user created", user });
  } catch (err) {
    if (err.message?.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    if (
      err.message?.includes("invalid") ||
      err.message?.includes("cannot be null") ||
      err.message?.includes("cannot be empty") ||
      err.message?.includes("password")
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
