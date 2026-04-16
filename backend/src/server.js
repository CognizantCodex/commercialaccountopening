const http = require("http");
const fs = require("node:fs");
const path = require("node:path");
const { evaluateRequest } = require("./evaluator");
const { investigateTransaction, reviewCase } = require("./amlAgent");

const port = Number(process.env.PORT || 8080);
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const frontendRoutes = new Set([
  "/",
  "/executive",
  "/onboarding",
  "/aml",
  "/agents",
  "/cases",
  "/monitoring",
  "/governance",
]);

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

function sendRedirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && frontendRoutes.has(requestUrl.pathname)) {
    sendRedirect(response, `${frontendOrigin}${requestUrl.pathname}`);
    return;
  }

  if (request.method === "GET" && request.url === "/api/docs/openapi-aml.json") {
    const docsPath = path.join(__dirname, "..", "openapi-aml.json");
    try {
      const body = fs.readFileSync(docsPath, "utf8");
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
      });
      response.end(body);
    } catch (error) {
      sendJson(response, 404, { error: "OpenAPI document not found." });
    }
    return;
  }

  if (request.method === "POST" && request.url === "/api/evaluate") {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1_000_000) {
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        if (!rawBody.trim()) {
          throw new Error("Request body cannot be empty.");
        }

        const payload = JSON.parse(rawBody);
        const result = evaluateRequest(payload);
        sendJson(response, 200, result);
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }
    });

    request.on("error", () => {
      sendJson(response, 400, { error: "Failed to read request body." });
    });
    return;
  }

  if (request.method === "POST" && request.url === "/api/aml/check_transaction") {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1_000_000) {
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        if (!rawBody.trim()) {
          throw new Error("Request body cannot be empty.");
        }

        const payload = JSON.parse(rawBody);
        const result = investigateTransaction(payload);
        sendJson(response, 200, result);
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }
    });

    request.on("error", () => {
      sendJson(response, 400, { error: "Failed to read request body." });
    });
    return;
  }

  if (request.method === "POST" && request.url === "/api/aml/review_case") {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1_000_000) {
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        if (!rawBody.trim()) {
          throw new Error("Request body cannot be empty.");
        }

        const payload = JSON.parse(rawBody);
        const result = reviewCase(payload);
        sendJson(response, 200, result);
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }
    });

    request.on("error", () => {
      sendJson(response, 400, { error: "Failed to read request body." });
    });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`Commercial onboarding backend listening on http://localhost:${port}`);
});
