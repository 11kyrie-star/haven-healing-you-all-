require("./env")

const secretkey = process.env.JWT_SECRET
if (!secretkey) {
    throw new Error("缺少环境变量 JWT_SECRET：请在 backend 目录创建 .env 文件（可参考同目录的 .env.example）")
}

module.exports = {
    secretkey: secretkey,
    adminKey: process.env.ADMIN_KEY || "",
}