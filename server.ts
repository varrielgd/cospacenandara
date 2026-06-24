import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Proxy all /api requests to the backend server on port 4000
  // This ensures frontend calls to /api reach the real backend
  app.use(createProxyMiddleware({
    pathFilter: "/api",
    target: "http://127.0.0.1:4000",
    changeOrigin: true,
    ws: true,
    logger: console,
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      // @ts-ignore
      res.status(502).send("Bad Gateway: Backend server might be down.");
    }
  } as any));

  app.use(express.json());

  // Start backend server in development mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend server on port 4000...");
    const backendProcess = spawn("npm", ["run", "dev"], {
      cwd: path.join(process.cwd(), "backend"),
      stdio: "inherit",
      shell: true,
      env: { ...process.env, PORT: "4000" }
    });

    backendProcess.on("error", (err) => {
      console.error("Failed to start backend process:", err);
    });
  }

  // Setup Vite in development mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await vite.transformIndexHtml(url, `<!DOCTYPE html><html><head></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.listen(PORT, () => {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Coffee Importer Intelligence System (CIIS) running on http://localhost:${PORT}`);
    console.log(`Backend API Proxied to http://localhost:4000`);
    console.log(`------------------------------------------------------------\n`);
  });
}

startServer();
