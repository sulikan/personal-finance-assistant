import { nanoid } from "nanoid";

export function generateCsrfToken(): string {
  return nanoid(32);
}

export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return token === storedToken;
}
