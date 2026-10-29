import "dotenv/config";
import { createApp } from "./app.js";
import { isMockMode } from "./meta/client.js";

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, "0.0.0.0", () => {
  console.log(`Mileto server on http://localhost:${port} (${isMockMode() ? "mock models" : "Meta Model API"})`);
});
