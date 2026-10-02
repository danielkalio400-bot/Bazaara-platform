import type { FastifyInstance } from "fastify";
import { bazaaraGoHome } from "./go-home.js";

export async function bazaaraGoRoutes(app: FastifyInstance) {
  app.get("/v1/go/home", async () => bazaaraGoHome());
}
