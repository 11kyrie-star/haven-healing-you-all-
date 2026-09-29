const jwt = require("jsonwebtoken")
const secretkey = require("./config").secretkey

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({ status: 1, msg: "请先登录" })
    }
    const token = authHeader.split(" ")[1]
    try {
        const decoded = jwt.verify(token, secretkey)
        req.user = decoded
        next()
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).send({ status: 1, msg: "token已过期，请重新登录" })
        }
        return res.status(401).send({ status: 1, msg: "身份认证失败" })
    }
}
