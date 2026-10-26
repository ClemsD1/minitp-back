import type { ErrorRequestHandler } from "express";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({ error: "Le corps de la requête contient un JSON invalide." });
    return;
  }
  if (error instanceof Error && "code" in error && error.code === "23505") {
    response.status(409).json({ error: "Une entrée portant ce nom existe déjà pour ce Pokémon." });
    return;
  }
  if (error instanceof Error && "code" in error && error.code === "23503") {
    response.status(400).json({ error: "La ressource associée n'existe pas." });
    return;
  }
  console.error("Erreur API inattendue :", error);
  response.status(500).json({ error: "Une erreur interne est survenue." });
};
