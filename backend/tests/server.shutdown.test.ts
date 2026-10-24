import { describe, expect, it, vi } from "vitest";
import { createShutdownHandler } from "../src/shutdown.js";

describe("Graceful server shutdown", () => {
  it("closes the HTTP server before the database pool", async () => {
    const order: string[] = [];

    const server = {
      close: vi.fn((callback: (error?: Error) => void) => {
        order.push("server");
        callback();
      }),
    };

    const pool = {
      end: vi.fn(async () => {
        order.push("database");
      }),
    };

    const shutdown = createShutdownHandler(server, pool);

    await shutdown();

    expect(order).toEqual(["server", "database"]);
    expect(server.close).toHaveBeenCalledTimes(1);
    expect(pool.end).toHaveBeenCalledTimes(1);
  });

  it("performs cleanup only once when shutdown is requested repeatedly", async () => {
    const server = {
      close: vi.fn((callback: (error?: Error) => void) => {
        callback();
      }),
    };

    const pool = {
      end: vi.fn(async () => {}),
    };

    const shutdown = createShutdownHandler(server, pool);

    await Promise.all([shutdown(), shutdown(), shutdown()]);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(pool.end).toHaveBeenCalledTimes(1);
  });

  it("closes the database pool even when the HTTP server fails to close", async () => {
    const server = {
      close: vi.fn((callback: (error?: Error) => void) => {
        callback(new Error("HTTP close failed"));
      }),
    };

    const pool = {
      end: vi.fn(async () => {}),
    };

    const shutdown = createShutdownHandler(server, pool);

    await expect(shutdown()).rejects.toThrow("HTTP close failed");

    expect(pool.end).toHaveBeenCalledTimes(1);
  });

  it("reports database pool shutdown failures", async () => {
    const server = {
      close: vi.fn((callback: (error?: Error) => void) => {
        callback();
      }),
    };

    const pool = {
      end: vi.fn(async () => {
        throw new Error("Database shutdown failed");
      }),
    };

    const shutdown = createShutdownHandler(server, pool);

    await expect(shutdown()).rejects.toThrow("Database shutdown failed");

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(pool.end).toHaveBeenCalledTimes(1);
  });
});
