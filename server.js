const express = require("express");
const path = require("path");
const { appApiRouter } = require("./app-api");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

app.use(express.json());
app.use(express.static(ROOT_DIR));
app.use("/api/app", appApiRouter);

app.get("/", (_req, res) => {
  res.redirect("/app");
});

app.get("/app", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "rei-app.html"));
});

app.get("/mercado", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "rei-mercado-v2.html"));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`REI Node.js running on http://localhost:${port}`);
    console.log("Rutas disponibles:");
    console.log(" - /app");
    console.log(" - /mercado");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < 3010) {
      const nextPort = port + 1;
      console.warn(`Puerto ${port} ocupado, intentando ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);
