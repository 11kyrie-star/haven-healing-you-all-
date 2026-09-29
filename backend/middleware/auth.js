const jwt = require("jsonwebtoken")
const secretkey = require("../config").secretkey

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return req.cc("请先登录")
    }
    const token = authHeader.split(" ")[1]
    try {
        const decoded = jwt.verify(token, secretkey)
        req.user = decoded
        next()
    } catch (err) {
        return req.cc("身份认证失败")
    }
}
