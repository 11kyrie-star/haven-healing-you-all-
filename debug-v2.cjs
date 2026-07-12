const path = require("path");
process.env.NODE_PATH = "F:\\Desktop\\HavenDB\\node_modules";
require("module").Module._initPaths();

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

app.use(function(req, res, next) {
    req.cc = (err, status = 1) => {
        res.send({ status, msg: err instanceof Error ? err.message : err });
    };
    next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[PRE] ${req.method} ${req.url} body=${JSON.stringify(req.body)}`);
    next();
});

// Manually replicate router with catch
const expressjoi = require("@escook/express-joi");
const rule = require("F:/Desktop/HavenDB/schema/user");
const functions = require("F:/Desktop/HavenDB/handle_router/user");

const router = require("express").Router();
router.post("/login", (req, res, next) => {
    try {
        console.log("[LOGIN] hit");
        const mw = expressjoi(rule.login_register);
        console.log("[LOGIN] mw created");
        mw(req, res, (err) => {
            if (err) { console.log("[LOGIN] mw error:", err.name, err.message, err.stack); return next(err); }
            console.log("[LOGIN] validation passed, calling handler");
            functions.login(req, res);
        });
    } catch(e) {
        console.log("[LOGIN] CATCH:", e.name, e.message, e.stack);
        next(e);
    }
});
router.post("/register", (req, res, next) => {
    try {
        console.log("[REGISTER] hit, body:", JSON.stringify(req.body));
        const mw = expressjoi(rule.login_register);
        mw(req, res, (err) => {
            if (err) { console.log("[REGISTER] mw error:", err.name, err.message); return next(err); }
            console.log("[REGISTER] validation passed");
            functions.register(req, res);
        });
    } catch(e) {
        console.log("[REGISTER] CATCH:", e.name, e.message, e.stack);
        next(e);
    }
});

app.use("/haven", router);

const joi = require("joi");
app.use(function(err, req, res, next) {
    console.log(`[ERR] name=${err.name} msg=${err.message} isJoi=${err instanceof joi.ValidationError} stack=${err.stack ? err.stack.substring(0,300) : 'none'}`);
    if (err.name == "UnauthorizedError") { return req.cc("身份认证失败"); }
    if (err instanceof joi.ValidationError) { return req.cc(err); }
    next();
});

app.listen(3021, () => console.log("Server on 3021"));
