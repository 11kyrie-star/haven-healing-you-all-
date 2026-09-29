// AI 聊天控制器：SSE 流式返回
const ai = require("../ai")

const MAX_MESSAGES = 50          // 最多接收的历史条数（取最近的）
const MAX_CONTENT_LENGTH = 8000  // 单条消息最大长度

module.exports.aiChat = function (req, res) {
    const raw = Array.isArray(req.body && req.body.messages) ? req.body.messages : null
    if (!raw || raw.length === 0) return req.cc("请传入聊天记录 messages")

    const messages = []
    const list = raw.slice(-MAX_MESSAGES)
    for (const m of list) {
        if (!m) continue
        // 前端格式：{ id, from: "ai" | "user", content, time }（同时兼容 role 写法）
        let from = m.from
        if (from !== "ai" && from !== "user") {
            if (m.role === "assistant" || m.role === "ai") from = "ai"
            else if (m.role === "user") from = "user"
            else if (m.role === "system") from = "system"
        }
        const content = typeof m.content === "string" ? m.content : ""
        if (from !== "system" && from !== "user" && from !== "ai") continue
        if (!content.trim()) continue
        messages.push({ role: from === "ai" ? "assistant" : from, content: content.slice(0, MAX_CONTENT_LENGTH) })
    }
    if (messages.length === 0) return req.cc("聊天记录格式不正确")
    if (messages[messages.length - 1].role !== "user") return req.cc("最后一条消息必须是用户发送的内容")

    res.status(200)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    if (typeof res.flushHeaders === "function") res.flushHeaders()

    const send = (obj) => { try { res.write("data: " + JSON.stringify(obj) + "\n\n") } catch (e) { /* 客户端已断开 */ } }

    ai.chatStream(messages, {
        onDelta: (text) => send({ type: "delta", content: text }),
        onDone: () => { send({ type: "done" }); res.end() },
        onError: (err) => {
            console.error("AI 聊天失败:", err.message)
            send({ type: "error", msg: "AI 服务异常：" + err.message })
            res.end()
        },
    })
}