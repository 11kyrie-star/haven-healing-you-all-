const jwt = require("jsonwebtoken")
const db = require("./db/index")
const secretkey = require("./config").secretkey

// 先校验 token，再查一次账号状态：封禁后立即失效，不必等 token 过期
// 临时封禁到期后自动解封，永久封禁（ban_until 为空）继续拦截
function checkStatus(userId, cb) {
    const sql = "select status, ban_until from userinfo where id=?"
    db.query(sql, [userId], (err, results) => {
        if (err) return cb(err)
        if (results.length !== 1) return cb(null, "用户不存在")
        const user = results[0]
        if (Number(user.status) !== 1) {
            const banUntil = user.ban_until ? new Date(user.ban_until).getTime() : null
            if (banUntil !== null && banUntil <= Date.now()) {
                db.query(
                    "UPDATE userinfo SET status = 1, ban_reason = NULL, ban_by = NULL, ban_at = NULL, ban_until = NULL WHERE id = ?",
                    [userId],
                    (e) => { if (e) console.error("自动解封失败:", e) }
                )
            } else {
                return cb(null, "该账号已被封禁，请联系管理员")
            }
        }
        cb(null, null)
    })
}

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({ status: 1, msg: "请先登录" })
    }
    const token = authHeader.split(" ")[1]
    let decoded
    try {
        decoded = jwt.verify(token, secretkey)
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).send({ status: 1, msg: "token已过期，请重新登录" })
        }
        return res.status(401).send({ status: 1, msg: "身份认证失败" })
    }
    // C 端登录 token 不带 scope；带 scope 的是管理端 token 或封禁申诉凭证，不能当登录态用
    if (decoded.scope) {
        return res.status(401).send({ status: 1, msg: "身份认证失败" })
    }
    checkStatus(decoded.id, (err, blockedMsg) => {
        if (err) {
            console.error("账号状态校验失败:", err)
            return res.status(500).send({ status: 1, msg: "服务器异常" })
        }
        if (blockedMsg) {
            return res.status(401).send({ status: 1, msg: blockedMsg })
        }
        req.user = decoded
        next()
    })
}
