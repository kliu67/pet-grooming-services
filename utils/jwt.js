import jwt from "jsonwebtoken";
export function createAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIb: "15m" });
}
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
