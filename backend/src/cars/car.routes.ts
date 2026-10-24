import { Router } from "express";
import type { RequestHandler } from "express";
import * as z from "zod";
import { carQuerySchema } from "./car.query.schema.js";
import type { CarService } from "./car.service.js";
import { createCarSchema, updateCarSchema } from "./car.schema.js";

const carIdSchema = z.uuid();

export function createCarRouter(
  carService: CarService,
  requireAuth: RequestHandler,
  requireAdmin: RequestHandler,
) {
  const router = Router();

  router.get("/", async (request, response) => {
    const validation = carQuerySchema.safeParse(request.query);

    if (!validation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid inventory query parameters.",
        },
      });

      return;
    }

    const result = await carService.findAll(validation.data);

    response.status(200).json(result);
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

  router.patch("/:id", requireAuth, requireAdmin, async (request, response) => {
    const idValidation = carIdSchema.safeParse(request.params.id);

    if (!idValidation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid car ID.",
        },
      });

      return;
    }

    const bodyValidation = updateCarSchema.safeParse(request.body);

    if (!bodyValidation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid car data.",
        },
      });

      return;
    }

    const car = await carService.update(idValidation.data, bodyValidation.data);

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

  return router;
}
