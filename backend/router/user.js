const express = require("express")
const functions = require("../handle_router/user")
const expressjoi = require("../middleware/express-joi")
const auth = require("../auth_jwt")
const rule = require("../schema/user")

const router = express.Router()

router.post("/login", expressjoi(rule.login), functions.login)
router.post("/register", expressjoi(rule.register), functions.register)
router.post("/forget", expressjoi(rule.forget), functions.forget)

// Authenticated routes
router.post("/avatar", auth, functions.avatar)
router.get("/userinfo", auth, functions.userinfo)
router.post("/changepwd", auth, expressjoi(rule.changepwd), functions.changepwd)
router.post("/changeusername", auth, expressjoi(rule.changeusername), functions.changeusername)
router.post("/changeemail", auth, expressjoi(rule.changeemail), functions.changeemail)
router.post("/changeprofile", auth, expressjoi(rule.changeprofile), functions.changeprofile)

module.exports = router
