const http = require("http");
const { evaluateRequest } = require("./evaluator");
const { investigateTransaction, reviewCase } = require("./amlAgent");

const port = Number(process.env.PORT || 8080);

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { status: "ok" });
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
