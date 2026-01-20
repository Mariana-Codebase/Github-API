import express from "express";
import handler from "./github";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Basic body parsers so we can read JSON or form data.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Everything goes through the same handler for GET and POST.
app.all("/api/github", (req, res) => handler(req, res));

// A tiny health check so I know the server is up.
app.get("/", (_req, res) => {
  res.status(200).send("API lista. Usa /api/github");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
