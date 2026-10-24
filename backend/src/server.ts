import { app } from "./app.js";

const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", (error) => {
  if (error) {
    throw error;
  }

  console.log(`API running at http://localhost:${port}`);
});
