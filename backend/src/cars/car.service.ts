import type { Car, CarListResult, CarRepository } from "./car.repository.js";
import type { CarQueryInput } from "./car.query.schema.js";
import type { CreateCarInput } from "./car.schema.js";

export interface CarService {
  create(input: CreateCarInput): Promise<Car>;
  findAll(query: CarQueryInput): Promise<CarListResult>;
  findById(id: string): Promise<Car | null>;
}

export function createCarService(carRepository: CarRepository): CarService {
  return {
    async create(input: CreateCarInput) {
      return carRepository.create(input);
    },

    async findAll(query: CarQueryInput) {
      return carRepository.findAll(query);
    },

    async findById(id: string) {
      return carRepository.findById(id);
    },
  };
}
