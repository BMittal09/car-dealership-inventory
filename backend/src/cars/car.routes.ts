import { Router } from "express";
import type { CarService } from "./car.service.js";
import { createCarSchema } from "./car.schema.js";

export function createCarRouter(carService: CarService) {
  const router = Router();

  router.post("/", async (request, response) => {
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
