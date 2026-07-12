// Test script that mirrors app.js but with full logging
const path = require("path");

// Point to HavenDB's node_modules
process.env.NODE_PATH = "F:\\Desktop\\HavenDB\\node_modules";
require("module").Module._initPaths();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Middleware identical to app.js
app.use(function(req, res, next) {
    req.cc = (err, status = 1) => {
        res.send({ status, msg: err instanceof Error ? err.message : err });
    };
    next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Log EVERY request before router
app.use((req, res, next) => {
    console.log(`[PRE-ROUTER] ${req.method} ${req.url} body=${JSON.stringify(req.body)}`);
    next();
});

// Load and mount the ACTUAL router from HavenDB
const router = require("F:/Desktop/HavenDB/router/user");
console.log("Router mounted. Stack:");
router.stack.forEach((s, i) => {
    if (s.route) console.log(`  ${i}: ${Object.keys(s.route.methods)[0].toUpperCase()} ${s.route.path}, handlers: ${s.route.stack.length}`);
    else console.log(`  ${i}: middleware ${s.name}`);
});

app.use("/haven", router);

// Log after router (404s)
app.use((req, res, next) => {
    console.log(`[404] ${req.method} ${req.url} - NO ROUTE MATCHED`);
    next();
});

// Error handler IDENTICAL to app.js
const joi = require("joi");
app.use(function(err, req, res, next) {
    console.log(`[ERR-HANDLER] name=${err.name} joi=${err instanceof joi.ValidationError}`);
    if (err.name == "UnauthorizedError") {
        return req.cc("身份认证失败");
    }
    if (err instanceof joi.ValidationError) {
        return req.cc(err);
    }
    next();
});

app.listen(3020, () => {
    console.log("DEBUG server on http://127.0.0.1:3020");
});
