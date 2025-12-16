// server.js
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const SUPPORTED_STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

// In-memory storage
const users = new Map(); // email -> { subscriptions: [] }
const sessions = new Map(); // sessionId -> email
const eventSources = new Map(); // sessionId -> EventSource
const stockPrices = new Map([
  ["GOOG", 150.0],
  ["TSLA", 250.0],
  ["AMZN", 180.0],
  ["META", 320.0],
  ["NVDA", 500.0],
]);

// Generate session ID
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

// Update prices periodically
setInterval(() => {
  stockPrices.forEach((price, ticker) => {
    const change = (Math.random() - 0.5) * 10; // +/- 5%
    stockPrices.set(ticker, Math.max(1, price + change));
  });

  // Broadcast to relevant users
  const updates = Array.from(stockPrices.entries()).map(([ticker, price]) => ({
    ticker,
    price,
  }));
  users.forEach((user, email) => {
    const sessionId = Array.from(sessions.entries()).find(
      ([s, e]) => e === email
    )?.[0];
    if (sessionId && eventSources.has(sessionId)) {
      const es = eventSources.get(sessionId);
      user.subscriptions.forEach((ticker) => {
        const update = updates.find((u) => u.ticker === ticker);
        if (update) {
          es.write(`data: ${JSON.stringify(update)}\n\n`);
        }
      });
    }
  });
}, 5000); // Every 5 seconds

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API routes
  if (req.method === "POST" && pathname === "/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { email } = JSON.parse(body);
      if (!users.has(email)) {
        users.set(email, { subscriptions: [] });
      }
      const sessionId = generateSessionId();
      sessions.set(sessionId, email);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ session: sessionId }));
    });
    return;
  }

  if (req.method === "GET" && pathname === "/subscriptions") {
    const sessionId = parsedUrl.query.session;
    const email = sessions.get(sessionId);
    if (!email) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    const user = users.get(email);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(user.subscriptions));
    return;
  }

  if (req.method === "POST" && pathname === "/subscribe") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { session, ticker } = JSON.parse(body);
      if (!SUPPORTED_STOCKS.includes(ticker)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Unsupported stock" }));
        return;
      }
      const email = sessions.get(session);
      if (!email) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      const user = users.get(email);
      if (!user.subscriptions.includes(ticker)) {
        user.subscriptions.push(ticker);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ subscribed: true }));
    });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/price?")) {
    const ticker = parsedUrl.query.ticker;
    if (!stockPrices.has(ticker)) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Stock not found" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ price: stockPrices.get(ticker) }));
    return;
  }

  // SSE endpoint
  if (pathname === "/events") {
    const sessionId = parsedUrl.query.session;
    if (!sessions.has(sessionId)) {
      res.writeHead(401);
      res.end();
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const clientEs = res;
    eventSources.set(sessionId, clientEs);

    req.on("close", () => {
      eventSources.delete(sessionId);
    });

    // Send initial prices for subscriptions
    const email = sessions.get(sessionId);
    const user = users.get(email);
    user.subscriptions.forEach((ticker) => {
      const price = stockPrices.get(ticker);
      clientEs.write(`data: ${JSON.stringify({ ticker, price })}\n\n`);
    });

    return;
  }

  // Static files
  let filePath;
  if (pathname === "/") {
    filePath = path.join(__dirname, "public", "index.html");
  } else {
    filePath = path.join(__dirname, "public", pathname);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath);
    const contentType = ext === ".js" ? "application/javascript" : "text/html";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
