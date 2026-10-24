import type { Car, CarListResult, CarRepository } from "./car.repository.js";
import type { CarQueryInput } from "./car.query.schema.js";
import type { CreateCarInput, UpdateCarInput } from "./car.schema.js";

export interface CarService {
  create(input: CreateCarInput): Promise<Car>;
  findAll(query: CarQueryInput): Promise<CarListResult>;
  findById(id: string): Promise<Car | null>;
  update(id: string, input: UpdateCarInput): Promise<Car | null>;
  delete(id: string): Promise<boolean>;
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

    async update(id: string, input: UpdateCarInput) {
      return carRepository.update(id, input);
    },

    async delete(id: string) {
      return carRepository.delete(id);
    },
  };
}
