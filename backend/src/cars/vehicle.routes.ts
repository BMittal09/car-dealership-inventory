import { Router } from "express";
import type { RequestHandler } from "express";
import * as z from "zod";
import { carQuerySchema } from "./car.query.schema.js";
import type { CarService } from "./car.service.js";
import { createCarSchema } from "./car.schema.js";

const vehicleIdSchema = z.uuid();

const restockSchema = z.strictObject({
  quantity: z.number().int().min(1).max(2147483647),
});

export function createVehicleRouter(
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

    response.status(200).json(await carService.findAll(validation.data));
  });

  router.get("/search", async (request, response) => {
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

    response.status(200).json(await carService.findAll(validation.data));
  });

  // Authenticated users can purchase one unit.
  router.post("/:id/purchase", requireAuth, async (request, response) => {
    const validation = vehicleIdSchema.safeParse(request.params.id);

    if (!validation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid vehicle ID.",
        },
      });
      return;
    }

    const result = await carService.purchase(validation.data);

    switch (result.outcome) {
      case "purchased":
        response.status(200).json({ car: result.car });
        return;

      case "not_found":
        response.status(404).json({
          error: {
            code: "VEHICLE_NOT_FOUND",
            message: "Vehicle not found.",
          },
        });
        return;

      case "unavailable":
        response.status(409).json({
          error: {
            code: "VEHICLE_UNAVAILABLE",
            message: "This vehicle is not available for purchase.",
          },
        });
        return;

      case "out_of_stock":
        response.status(409).json({
          error: {
            code: "OUT_OF_STOCK",
            message: "This vehicle is out of stock.",
          },
        });
        return;
    }
  });

  // Only administrators can increase stock.
  router.post(
    "/:id/restock",
    requireAuth,
    requireAdmin,
    async (request, response) => {
      const idValidation = vehicleIdSchema.safeParse(request.params.id);

      if (!idValidation.success) {
        response.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid vehicle ID.",
          },
        });
        return;
      }

      const bodyValidation = restockSchema.safeParse(request.body);

      if (!bodyValidation.success) {
        response.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid restock quantity.",
          },
        });
        return;
      }

      const result = await carService.restock(
        idValidation.data,
        bodyValidation.data.quantity,
      );

      switch (result.outcome) {
        case "restocked":
          response.status(200).json({ car: result.car });
          return;

        case "not_found":
          response.status(404).json({
            error: {
              code: "VEHICLE_NOT_FOUND",
              message: "Vehicle not found.",
            },
          });
          return;

        case "quantity_overflow":
          response.status(409).json({
            error: {
              code: "QUANTITY_OVERFLOW",
              message: "Restock would exceed the maximum inventory quantity.",
            },
          });
          return;
      }
    },
  );

  router.get("/:id", async (request, response) => {
    const validation = vehicleIdSchema.safeParse(request.params.id);

    if (!validation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid vehicle ID.",
        },
      });
      return;
    }

    const car = await carService.findById(validation.data);

    if (!car) {
      response.status(404).json({
        error: {
          code: "VEHICLE_NOT_FOUND",
          message: "Vehicle not found.",
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
          message: "Invalid vehicle data.",
        },
      });
      return;
    }

    const car = await carService.create(validation.data);

    response.status(201).json({ car });
  });

  router.put("/:id", requireAuth, requireAdmin, async (request, response) => {
    const idValidation = vehicleIdSchema.safeParse(request.params.id);

    if (!idValidation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid vehicle ID.",
        },
      });
      return;
    }

    const bodyValidation = createCarSchema.safeParse(request.body);

    if (!bodyValidation.success) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid vehicle data.",
        },
      });
      return;
    }

    const car = await carService.update(idValidation.data, bodyValidation.data);

    if (!car) {
      response.status(404).json({
        error: {
          code: "VEHICLE_NOT_FOUND",
          message: "Vehicle not found.",
        },
      });
      return;
    }

    response.status(200).json({ car });
  });

  router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    async (request, response) => {
      const validation = vehicleIdSchema.safeParse(request.params.id);

      if (!validation.success) {
        response.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid vehicle ID.",
          },
        });
        return;
      }

      const deleted = await carService.delete(validation.data);

      if (!deleted) {
        response.status(404).json({
          error: {
            code: "VEHICLE_NOT_FOUND",
            message: "Vehicle not found.",
          },
        });
        return;
      }

      response.status(204).send();
    },
  );

  return router;
}
