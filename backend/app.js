require("./env")   // 必须最先加载：其余模块都依赖环境变量
const http = require("http")
const express = require("express")
const path = require("path")
const cors = require("cors")
const joi = require("joi")
const userRouter = require("./router/user")
const postRouter = require("./router/post")
const adminRouter = require("./router/admin")
const notify = require("./notify")

const app = express()

// 部署在 Nginx 等反向代理后面时，让 req.protocol / req.ip 取到真实值
// 否则拼接出的图片地址会是 http，前端在 https 页面下会被浏览器拦截（混合内容）
app.set("trust proxy", 1)

// CORS：默认只允许本地开发地址（C 端 5173、B 端 8848）；线上用环境变量 CORS_ORIGINS 指定（逗号分隔多个来源）
app.use(
    cors({
        origin: (
            process.env.CORS_ORIGINS ||
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8848,http://127.0.0.1:8848"
        )
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    })
)

// Body parsing
app.use(express.urlencoded({ extended: false, limit: "50mb" }))
app.use(express.json({ limit: "50mb" }))

// Catch body-parser errors early
app.use(function (err, req, res, next) {
    if (err.type === "entity.too.large" || err.status === 413) {
        return res.status(413).send({ status: 1, msg: "请求体过大，请压缩后重试" })
    }
    next(err)
})

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.get("/default_avatar.jpeg", (req, res) => { res.sendFile(path.join(__dirname, "default_avatar.jpeg")) })

// Unified response helper
app.use(function (req, res, next) {
    req.cc = (err, bodyStatus = 1, httpStatus = 200) => {
        res.status(httpStatus).send({
            status: bodyStatus,
            msg: err instanceof Error ? err.message : err,
        })
    }
    next()
})

// Routes
app.use("/haven", userRouter)
app.use("/haven", postRouter)
app.use("/haven", adminRouter)

// Global error handler
app.use(function (err, req, res, next) {
    if (err.type === "entity.too.large" || err.status === 413) {
        return res.status(413).send({ status: 1, msg: "请求体过大，请压缩图片后重试" })
    }
    if (err instanceof joi.ValidationError) {
        console.error("校验错误:", err.message)
        return req.cc("校验错误", 1, 400)
    }
    if (err.name === "UnauthorizedError") {
        return res.status(401).send({ status: 1, msg: "身份认证失败" })
    }
    console.error(err)
    return req.cc("服务器异常", 1, 500)
})

const autoMigrate = require("./migrate_auto")

autoMigrate((err) => {
    if (err) {
        console.error("数据库迁移失败:", err)
        process.exit(1)
    }
    const server = http.createServer(app)
    notify.init(server)
    const PORT = Number(process.env.PORT) || 3007
    server.listen(PORT, () => {
        console.log("Your serve runs at http://127.0.0.1:" + PORT)
    })
})
