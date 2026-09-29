// 环境变量加载器：零依赖
// 优先使用 Node 原生 process.loadEnvFile（Node 20.12+），低版本回退到内置解析
const fs = require("fs")
const path = require("path")

const envPath = path.join(__dirname, ".env")

function fallbackLoad() {
    try {
        const content = fs.readFileSync(envPath, "utf8")
        for (const raw of content.split(/\r?\n/)) {
            const line = raw.trim()
            if (!line || line.startsWith("#")) continue
            const idx = line.indexOf("=")
            if (idx < 0) continue
            const key = line.slice(0, idx).trim()
            let value = line.slice(idx + 1).trim()
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
            }
            if (key && process.env[key] === undefined) process.env[key] = value
        }
    } catch (e) { /* 没有 .env 文件时，直接使用系统环境变量 */ }
}

function load() {
    if (!fs.existsSync(envPath)) return
    if (typeof process.loadEnvFile === "function") {
        try {
            process.loadEnvFile(envPath)
            return
        } catch (e) {
            fallbackLoad()
            return
        }
    }
    fallbackLoad()
}

load()

module.exports = { envPath }