import type {
  Car,
  CarListResult,
  CarRepository,
  PurchaseResult,
  RestockResult,
} from "./car.repository.js";
import type { CarQueryInput } from "./car.query.schema.js";
import type { CreateCarInput, UpdateCarInput } from "./car.schema.js";

export interface CarService {
  create(input: CreateCarInput): Promise<Car>;
  findAll(query: CarQueryInput): Promise<CarListResult>;
  findById(id: string): Promise<Car | null>;
  update(id: string, input: UpdateCarInput): Promise<Car | null>;
  delete(id: string): Promise<boolean>;
  purchase(id: string): Promise<PurchaseResult>;
  restock(id: string, quantity: number): Promise<RestockResult>;
}

export function createCarService(carRepository: CarRepository): CarService {
  return {
    async create(input) {
      return carRepository.create(input);
    },

    async findAll(query) {
      return carRepository.findAll(query);
    },

    async findById(id) {
      return carRepository.findById(id);
    },

    async update(id, input) {
      return carRepository.update(id, input);
    },

    async delete(id) {
      return carRepository.delete(id);
    },

    async purchase(id) {
      return carRepository.purchase(id);
    },

    async restock(id, quantity) {
      return carRepository.restock(id, quantity);
    },
  };
}
