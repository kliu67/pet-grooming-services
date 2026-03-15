import { randomUUID } from "crypto";

export function generateRefreshToken() {
    return randomUUID();
}