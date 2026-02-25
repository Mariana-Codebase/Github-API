import express from "express";
import githubHandler from "./github";
import contributionsHandler from "./contributions";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Basic body parsers so we can read JSON or form data.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Everything goes through the same handler for GET and POST.
app.all("/api/github", (req, res) => githubHandler(req, res));
app.all("/api/contributions", (req, res) => contributionsHandler(req, res));

// A tiny health check so I know the server is up.
app.get("/", (_req, res) => {
  res.status(200).send("API lista. Usa /api/github");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
