import type { Car, CarRepository } from "./car.repository.js";
import type { CreateCarInput } from "./car.schema.js";

export interface CarService {
  create(input: CreateCarInput): Promise<Car>;
}

export function createCarService(carRepository: CarRepository): CarService {
  return {
    async create(input: CreateCarInput) {
      return carRepository.create(input);
    },
  };
}
