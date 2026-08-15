import { createServer } from "node:http";
import app from "../api/index";

const server = createServer(app);

await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

try {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("The Vercel smoke-test server did not expose a TCP port.");
  }

  const response = await fetch(`http://127.0.0.1:${address.port}/`);
  const page = await response.text();

  if (!response.ok || !page.includes("PondBasket")) {
    throw new Error(
      `Expected the Vercel handler to return the PondBasket client shell; received ${response.status}.`
    );
  }

  console.log("Vercel function smoke test passed.");
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
  });
}
