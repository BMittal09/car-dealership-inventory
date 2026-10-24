import type { Pool } from "pg";

interface HttpServer {
  close(callback: (error?: Error) => void): unknown;
}

type DatabasePool = Pick<Pool, "end">;

export function createShutdownHandler(
  server: HttpServer,
  pool: DatabasePool,
): () => Promise<void> {
  let shutdownPromise: Promise<void> | undefined;

  return function shutdown(): Promise<void> {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      let serverError: Error | undefined;

      try {
        await new Promise<void>((resolve, reject) => {
          server.close((error?: Error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      } catch (error) {
        serverError = error instanceof Error ? error : new Error(String(error));
      }

      try {
        await pool.end();
      } catch (databaseError) {
        if (serverError) {
          throw new AggregateError(
            [serverError, databaseError],
            "HTTP server and database shutdown both failed.",
          );
        }

        throw databaseError;
      }

      if (serverError) {
        throw serverError;
      }
    })();

    return shutdownPromise;
  };
}
