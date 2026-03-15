import { verifyToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch {
    return res.sendStatus(401);
  }
}


export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password required"
    });
  }

  next();
}