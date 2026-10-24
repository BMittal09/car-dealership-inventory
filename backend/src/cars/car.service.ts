import type { Car, CarRepository } from "./car.repository.js";
import type { CreateCarInput } from "./car.schema.js";

export interface CarService {
  create(input: CreateCarInput): Promise<Car>;
  findAll(): Promise<Car[]>;
  findById(id: string): Promise<Car | null>;
}

export function createCarService(carRepository: CarRepository): CarService {
  return {
    async create(input: CreateCarInput) {
      return carRepository.create(input);
    },

    async findAll() {
      return carRepository.findAll();
    },

    async findById(id: string) {
      return carRepository.findById(id);
    },
  };
}
