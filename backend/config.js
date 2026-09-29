require("./env")

const secretkey = process.env.JWT_SECRET
if (!secretkey) {
    throw new Error("缺少环境变量 JWT_SECRET：请在项目根目录创建 .env 文件（可参考 .env.example）")
}

module.exports = {
    secretkey: secretkey,
    adminKey: process.env.ADMIN_KEY || "",
}