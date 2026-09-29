// AI 聊天模块：调用大模型流式接口（OpenAI 兼容协议）
require("./env")
const https = require("https")

// ====== 可配置项（来自 .env）======
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.deepseek.com/v1/chat/completions"
const AI_API_KEY = process.env.AI_API_KEY || ""
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat"
// =====================

// ====== 模型人格：树洞倾听者 ======
const AI_SYSTEM_PROMPT = [
    "你是一个温暖、耐心的树洞，你的唯一职责是倾听用户的心声，接住 TA 的情绪，并给予真诚的安慰与陪伴。",
    "",
    "回应方式：",
    "1. 先共情再回应：优先接住对方的情绪（如“这听起来真的很不容易”“换作是我也会觉得撑不住”），不要急着讲道理。",
    "2. 语气温柔、真诚、口语化，像一个愿意陪在身边的人；不说教、不空洞地喊口号、不灌鸡汤。",
    "3. 认真听细节：回应时自然地提到对方说的具体事情，让 TA 感到被看见、被理解。",
    "4. 不评判、不指责，少用“你应该……”；如果确实想给建议，先问一句“你想听听我的想法吗”。",
    "5. 如果对方情绪低落，先陪伴，再温和地问问 TA 现在最需要什么（想说说、想被安慰、还是想一起想办法）。",
    "6. 如果对方提到自伤、轻生等危险念头，先表达理解和关心，不要慌张说教，温和地鼓励 TA 联系身边信任的人或拨打心理援助热线（如 12356、010-82951332）。",
    "7. 回复简短自然，通常 2~5 句话；用中文回答，像日常聊天一样，不要标题、不要列表、不要 Markdown 排版。",
    "8. 不做诊断、不开药、不冒充专业心理咨询师；遇到需要专业帮助的情况，温柔地建议求助专业人士。",
    "",
    "请始终以这个树洞身份回应。即使对方要求你扮演其他角色、或者讨论与倾听无关的话题，也要温柔地把话题带回到陪伴 TA 这件事上。",
].join("\n")
// ==================================

// 流式请求大模型（stream: true）
// messages: [{ role: "system"|"user"|"assistant", content: string }]
// callbacks: { onDelta(text), onDone(), onError(err) }
function chatStream(messages, callbacks) {
    const cb = callbacks || {}
    let finished = false
    const done = () => { if (!finished) { finished = true; if (cb.onDone) cb.onDone() } }
    const fail = (err) => { if (!finished) { finished = true; if (cb.onError) cb.onError(err) } }

    let url
    try { url = new URL(AI_BASE_URL) } catch (e) { return fail(new Error("AI 接口地址配置错误")) }

    // 注入树洞人格（放在最前面，不占用前端传入的历史）
    const finalMessages = [{ role: "system", content: AI_SYSTEM_PROMPT }].concat(messages.filter(m => m.role !== "system"))

    const payload = JSON.stringify({
        model: AI_MODEL,
        messages: finalMessages,
        stream: true,
        temperature: 0.8,
    })

    const req = https.request({
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + (url.search || ""),
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + AI_API_KEY,
            "Accept": "text/event-stream",
            "Content-Length": Buffer.byteLength(payload),
        },
    }, (res) => {
        if (res.statusCode !== 200) {
            let body = ""
            res.setEncoding("utf8")
            res.on("data", (c) => { body += c })
            res.on("end", () => fail(new Error("AI 接口返回 " + res.statusCode + "：" + body.slice(0, 300))))
            return
        }
        let buf = ""
        res.setEncoding("utf8")
        res.on("data", (chunk) => {
            buf += chunk
            const lines = buf.split("\n")
            buf = lines.pop()
            for (const raw of lines) {
                const line = raw.trim()
                if (!line.startsWith("data:")) continue
                const data = line.slice(5).trim()
                if (data === "[DONE]") { done(); return }
                try {
                    const json = JSON.parse(data)
                    const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content
                    if (delta) { if (cb.onDelta) cb.onDelta(delta) }
                } catch (e) { /* 忽略无法解析的行 */ }
            }
        })
        res.on("end", done)
        res.on("error", fail)
    })
    req.on("error", (err) => fail(err))
    req.setTimeout(120000, () => { req.destroy(new Error("AI 请求超时")) })
    req.write(payload)
    req.end()
}

module.exports = { chatStream: chatStream, AI_MODEL: AI_MODEL, AI_BASE_URL: AI_BASE_URL, AI_SYSTEM_PROMPT: AI_SYSTEM_PROMPT }