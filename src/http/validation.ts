import { ApiError } from "./errors.js";

export function positiveInteger(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${field} doit être un entier strictement positif.`);
  }
  return parsed;
}

export function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 100) {
    throw new ApiError(400, `${field} doit être une chaîne non vide de 100 caractères maximum.`);
  }
  return value.trim();
}
