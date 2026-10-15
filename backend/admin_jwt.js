const jwt = require("jsonwebtoken")
const secretkey = require("./config").secretkey

// B 端管理员鉴权中间件
// 与 C 端 auth_jwt 区分：额外校验 token 里的 scope，避免 C 端用户 token 越权访问管理端
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return req.cc("请先登录")
    }
    const token = authHeader.split(" ")[1]
    try {
        const decoded = jwt.verify(token, secretkey)
        if (decoded.scope !== "admin") {
            return req.cc("身份认证失败")
        }
        req.admin = decoded
        next()
    } catch (err) {
        return req.cc("身份认证失败")
    }
}
