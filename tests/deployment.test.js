const assert = require("node:assert/strict");
const { once } = require("node:events");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const express = require("express");
const session = require("express-session");

const appPath = path.join(__dirname, "..", "app.js");
const appRequire = createRequire(appPath);
const source = fs.readFileSync(appPath, "utf8");

function loadApp(t, { production = true, port = "10000", connect = async () => {} } = {}) {
  const app = express();
  const store = new session.MemoryStore();
  const database = { connect, connection: { readyState: 1 } };
  const listen = t.mock.method(app, "listen", () => {});
  const exit = t.mock.fn();
  const error = t.mock.fn();

  // Exercise the real app and middleware without connecting to external services.
  vm.runInNewContext(source, {
    __dirname: path.dirname(appPath),
    require(name) {
      if (name === "express") return Object.assign(() => app, express);
      if (name === "mongoose") return database;
      if (name === "connect-mongo") return { default: { create: () => store } };
      if (name === "dotenv") return { config() {} };
      return appRequire(name);
    },
    process: {
      env: { NODE_ENV: production ? "production" : "development", PORT: port,
        ATLASDB_URL: "mongodb://example.invalid/wanderlust", SECRET: "deployment-test-secret" },
      exit,
    },
    console: { log() {}, error },
  }, { filename: appPath });

  return { app, database, listen, exit, error };
}

async function serve(t, app) {
  const server = http.createServer(app).listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

test("startup waits for MongoDB and binds to Render's port on all interfaces", async (t) => {
  let connected;
  const { listen, exit } = loadApp(t, {
    connect: () => new Promise((resolve) => { connected = resolve; }),
  });
  assert.equal(listen.mock.callCount(), 0);
  connected();
  await new Promise(setImmediate);
  assert.equal(listen.mock.callCount(), 1);
  assert.equal(listen.mock.calls[0].arguments[0], "10000");
  assert.equal(listen.mock.calls[0].arguments[1], "0.0.0.0");
  assert.equal(exit.mock.callCount(), 0);
});

test("failed database startup exits without accepting requests", async (t) => {
  const { listen, exit, error } = loadApp(t, {
    connect: async () => { throw new Error("Database unavailable"); },
  });
  await new Promise(setImmediate);
  assert.equal(listen.mock.callCount(), 0);
  assert.equal(exit.mock.calls[0].arguments[0], 1);
  assert.equal(error.mock.calls[0].arguments[1], "Database unavailable");
});

test("production serves the homepage, database health, and HTTPS login cookies", async (t) => {
  const { app, database } = loadApp(t);
  const baseUrl = await serve(t, app);
  const home = await fetch(baseUrl, { redirect: "manual" });
  await home.text();
  assert.equal(home.status, 302);
  assert.equal(home.headers.get("location"), "/listings");

  for (const [readyState, status, body] of [[1, 200, "ok"], [0, 503, "unavailable"]]) {
    database.connection.readyState = readyState;
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, status);
    assert.deepEqual(await health.json(), { status: body });
    assert.equal(health.headers.get("set-cookie"), null);
  }

  const login = await fetch(`${baseUrl}/login`, { headers: { "X-Forwarded-Proto": "https" } });
  assert.equal(login.status, 200, await login.text());
  assert.match(login.headers.get("set-cookie"), /; Secure/);
  assert.match(login.headers.get("set-cookie"), /; HttpOnly/);
  assert.match(login.headers.get("set-cookie"), /; SameSite=Lax/);

  const demo = await fetch(`${baseUrl}/demouser`);
  assert.equal(demo.status, 404, await demo.text());
});

test("local development keeps HTTP cookies and the default port working", async (t) => {
  const { app, listen } = loadApp(t, { production: false, port: "" });
  const baseUrl = await serve(t, app);
  assert.equal(listen.mock.calls[0].arguments[0], 8080);
  const login = await fetch(`${baseUrl}/login`);
  assert.equal(login.status, 200, await login.text());
  assert.ok(login.headers.get("set-cookie"));
  assert.doesNotMatch(login.headers.get("set-cookie"), /; Secure/);
});
