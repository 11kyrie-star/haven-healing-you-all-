// 通知模块：写入通知记录 + WebSocket 实时推送
require("./env")
const db = require("./db/index")
const jwt = require("jsonwebtoken")
const secretkey = require("./config").secretkey
const { createWebSocketServer, OPEN } = require("./ws_server")

const userSockets = new Map() // userId -> Set<ws>
const BASE_URL = process.env.SERVER_URL || ("http://127.0.0.1:" + (process.env.PORT || 3007))

// app.js 启动时调用，复用同一个 HTTP 服务（地址和端口与后端一致）
function init(server) {
    createWebSocketServer(server, { path: "/ws" }, (ws, req) => {
        ws.userId = null

        // 方式一（推荐）：URL 携带 token，如 ws://127.0.0.1:3007/ws?token=<token>
        let urlToken = null
        try {
            const query = new URL(req.url, BASE_URL).searchParams
            urlToken = query.get("token")
        } catch (e) { /* 忽略解析失败 */ }
        if (urlToken) {
            try {
                const decoded = jwt.verify(urlToken, secretkey)
                register(ws, decoded.id)
                return
            } catch (e) {
                try { ws.send(JSON.stringify({ type: "error", msg: "认证失败，请重新连接" })) } catch (e2) { /* 忽略 */ }
                ws.close(1008)
                return
            }
        }

        // 方式二（兼容）：连接后发送 {"type":"auth","token":"<token>"}
        ws.onMessage = (raw) => {
            try {
                const msg = JSON.parse(raw)
                if (msg.type === "auth" && msg.token) {
                    const decoded = jwt.verify(msg.token, secretkey)
                    register(ws, decoded.id)
                }
            } catch (e) {
                try { ws.send(JSON.stringify({ type: "error", msg: "认证失败，请重新连接" })) } catch (e2) { /* 忽略 */ }
            }
        }
        ws.onClose = () => {
            if (ws.userId && userSockets.has(ws.userId)) {
                userSockets.get(ws.userId).delete(ws)
                if (userSockets.get(ws.userId).size === 0) userSockets.delete(ws.userId)
            }
        }
        ws.onError = () => { /* 连接错误，由 close 清理 */ }
    })
}

function register(ws, userId) {
    ws.userId = userId
    if (!userSockets.has(userId)) userSockets.set(userId, new Set())
    userSockets.get(userId).add(ws)
    try { ws.send(JSON.stringify({ type: "auth_ok", user_id: userId })) } catch (e) { /* 忽略 */ }
}

// 向在线用户实时推送
function pushToUser(userId, data) {
    if (!userSockets.has(userId)) return
    const payload = JSON.stringify(data)
    for (const ws of userSockets.get(userId)) {
        if (ws.readyState === OPEN) ws.send(payload)
    }
}

// 举报理由：统一成数组
function parseReasons(v) {
    if (!v) return []
    if (Array.isArray(v)) return v
    try {
        const arr = JSON.parse(v)
        return Array.isArray(arr) ? arr : []
    } catch (e) { return [] }
}

// 构造与未读通知列表完全一致的结构（含 post 对象、举报原因、处理结果）
function buildNotificationData({ id, type, actor_name, actor_avatar, content, target_id, post_id, reasons, handle_result, is_success, role }, cb) {
    const sql = "SELECT p.id, p.content, p.images, u.username, u.avatar FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.id = ?"
    db.query(sql, [post_id], (err, rows) => {
        let post = null
        if (!err && rows.length > 0) {
            const p = rows[0]
            post = {
                id: p.id,
                username: p.username || "",
                avatar: p.avatar ? (p.avatar.startsWith("http") ? p.avatar : BASE_URL + p.avatar) : null,
                content: p.content || "",
                images: typeof p.images === "string" ? JSON.parse(p.images) : (p.images || []),
            }
        }
        cb({
            id,
            type,
            is_read: false,
            create_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
            actor_name,
            actor_avatar: actor_avatar || null,
            content: content || "",
            target_id,
            post,
            reasons: parseReasons(reasons),
            handle_result: handle_result || "",
            is_success: (is_success === undefined || is_success === null) ? null : !!is_success,
            role: role || null,
        })
    })
}

// 创建一条通知：先落库，再实时推送；不通知自己
// type: like | comment | reply | message | post_offline | report_result
function createNotification({ user_id, type, actor_id, actor_name, actor_avatar, content, target_id, post_id, reasons, handle_result, is_success, role }, cb) {
    if (!user_id || !type || actor_id === undefined || actor_id === null || !actor_name || !target_id || !post_id) {
        if (cb) cb(new Error("通知参数不完整"))
        return
    }
    if (user_id === actor_id) {
        if (cb) cb(null, null)
        return
    }
    const reasonsJson = Array.isArray(reasons) ? (reasons.length > 0 ? JSON.stringify(reasons) : null) : (reasons || null)
    const successValue = (is_success === undefined || is_success === null) ? null : (is_success ? 1 : 0)

    const sql = "INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_avatar, content, target_id, post_id, reasons, handle_result, is_success, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    db.query(sql, [user_id, type, actor_id, actor_name, actor_avatar || null, content || "", target_id, post_id, reasonsJson, handle_result || null, successValue, role || null], (err, result) => {
        if (err) {
            console.error("创建通知失败:", err)
            if (cb) cb(err)
            return
        }
        buildNotificationData({ id: result.insertId, type, actor_name, actor_avatar, content, target_id, post_id, reasons: reasonsJson, handle_result, is_success: successValue, role }, (data) => {
            pushToUser(user_id, { type: "notification", data })
        })
        if (cb) cb(null, result.insertId)
    })
}

module.exports = { init, pushToUser, createNotification, parseReasons }