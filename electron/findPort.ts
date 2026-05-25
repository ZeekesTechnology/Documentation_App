import net from "net";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.unref();
    server.listen({ port, host: "127.0.0.1" });
  });
}

export async function findAvailablePort(candidates: number[]): Promise<number> {
  for (const port of candidates) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port in: ${candidates.join(", ")}`);
}
