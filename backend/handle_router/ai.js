// AI 聊天控制器：SSE 流式返回
const ai = require("../ai")

const MAX_MESSAGES = 50          // 最多接收的历史条数（取最近的）
const MAX_CONTENT_LENGTH = 8000  // 单条消息最大长度
const HEARTBEAT_INTERVAL = 15000 // 心跳间隔：SSE 注释行保活，防止代理把空闲连接掐断

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

    // 心跳保活：冒号开头是 SSE 注释行，前端解析时会自动忽略，
    // 作用是让 nginx / 云负载均衡看到连接上一直有数据，不会因空闲把流掐断
    let closed = false
    const heartbeat = setInterval(() => {
        if (closed) return
        try { res.write(": ping\n\n") } catch (e) { /* 客户端已断开 */ }
    }, HEARTBEAT_INTERVAL)
    // 心跳不应该拖住进程退出
    if (typeof heartbeat.unref === "function") heartbeat.unref()

    // 统一清理：正常结束、上游报错、客户端点停止，三条路都必须停掉心跳
    const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
    }

    const send = (obj) => {
        if (closed) return
        try { res.write("data: " + JSON.stringify(obj) + "\n\n") } catch (e) { /* 客户端已断开 */ }
    }

    const stream = ai.chatStream(messages, {
        onDelta: (text) => send({ type: "delta", content: text }),
        onDone: () => { send({ type: "done" }); cleanup(); res.end() },
        onError: (err) => {
            console.error("AI 聊天失败:", err.message)
            send({ type: "error", msg: "AI 服务异常：" + err.message })
            cleanup()
            res.end()
        },
    })

    // 客户端断开（用户点「停止」或关掉页面）时 res 触发 close：
    // 先停掉心跳，再中止上游模型请求，避免白跑继续扣额度。
    // 正常结束时 finished 已置位，stream.abort() 是空操作
    res.on("close", () => {
        cleanup()
        stream.abort()
    })
}