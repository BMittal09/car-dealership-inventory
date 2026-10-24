import { Router } from "express";
import type { RequestHandler } from "express";
import * as z from "zod";
import type { CarService } from "./car.service.js";
import { createCarSchema } from "./car.schema.js";

const carIdSchema = z.uuid();

export function createCarRouter(
  carService: CarService,
  requireAuth: RequestHandler,
  requireAdmin: RequestHandler,
) {
  const router = Router();

  router.get("/", async (_request, response) => {
    const cars = await carService.findAll();

    response.status(200).json({ cars });
  });

  router.get("/:id", async (request, response) => {
    const validation = carIdSchema.safeParse(request.params.id);

    if (!validation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid car ID.",
        },
      });

      return;
    }

    const car = await carService.findById(validation.data);

    if (!car) {
      response.status(404).json({
        error: {
          code: "CAR_NOT_FOUND",
          message: "Car not found.",
        },
      });

      return;
    }

    response.status(200).json({ car });
  });

  router.post("/", requireAuth, requireAdmin, async (request, response) => {
    const validation = createCarSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid car data.",
        },
      });

      return;
    }

    const car = await carService.create(validation.data);

    response.status(201).json({ car });
  });

  return router;
}
