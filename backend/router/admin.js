const express = require("express")
const functions = require("../handle_router/admin")
const expressjoi = require("../middleware/express-joi")
const rule = require("../schema/admin")

const router = express.Router()

// B 端后台登录（公开，无需鉴权）
router.post("/admin/login", expressjoi(rule.login), functions.login)

module.exports = router
