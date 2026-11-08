const db = require("../db/index")
const fs = require("fs")
const path = require("path")
const multer = require("multer")
const xss = require("xss")
const notify = require("../notify")

// ============ XSS ============
const xssOptions = {
    whiteList: {
        p: ["style", "class"], br: [], strong: [], em: [], u: [], s: [],
        h1: [], h2: [], h3: [], blockquote: [], pre: [], code: [],
        ul: [], ol: [], li: [],
        a: ["href", "target", "rel"],
        img: ["src", "alt", "width", "height", "style"],
        span: ["style", "class"], div: ["style", "class"],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "iframe", "style"],
    css: false,
}
function filterXSS(html) { return xss(html, xssOptions) }

// ============ Hot ============
function calcHot(viewCount, likeCount, commentCount, createdAt) {
    const hours = Math.max((Date.now() - new Date(createdAt).getTime()) / 3600000, 0)
    const score = Number(viewCount) * 1 + Number(likeCount) * 3 + Number(commentCount) * 5
    return Math.floor(score / Math.pow(Number(hours) + 2, 1.5))
}

// ============ Multer ============
const uploadDir = path.join(__dirname, "..", "uploads", "posts")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir) },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, "post_img_" + Date.now() + "_" + Math.round(Math.random() * 1e9) + ext)
    },
})
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp"]
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowed.includes(ext)) cb(null, true)
        else cb(new Error("只允许上传 png/jpg/jpeg/gif/webp 格式的图片"))
    },
}).single("image")

// ============ Upload Image ============
module.exports.uploadImage = function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") return req.cc("图片大小不能超过10MB")
            return req.cc("文件上传失败")
        }
        if (err) return req.cc(err.message)
        if (!req.file) return req.cc("请选择要上传的图片")
        const url = req.protocol + "://" + req.get("host") + "/uploads/posts/" + req.file.filename
        res.send({ status: 0, msg: "上传成功", data: { url } })
    })
}

// 从 HTML 中提取带样式的 #标签
// 匹配 <span class="...hashtag...">#xxx</span> 或 <a href="...">#xxx</a> 等
function extractTagsFromHTML(html) {
    const tags = new Set()

    // 方式1：前端两个 span 分别包 # 和标签名
    //   <span ...>#</span><span ...>标签</span>
    const splitRegex = /<span\b[^>]*>#<\/span>\s*<span\b[^>]*>([\u4e00-\u9fa5a-zA-Z0-9]+)<\/span>/gi
    let match
    while ((match = splitRegex.exec(html)) !== null) {
        tags.add(match[1])
    }

    // 方式2：单个 span/a 包完整的 #标签
    if (tags.size === 0) {
        const singleRegex = /<(?:span|a)\b[^>]*>#([\u4e00-\u9fa5a-zA-Z0-9]+)<\/(?:span|a)>/gi
        while ((match = singleRegex.exec(html)) !== null) {
            tags.add(match[1])
        }
    }

    // 方式3（兜底）：纯文本 #xxx
    if (tags.size === 0) {
        const plain = html.replace(/<[^>]+>/g, "")
        const plainRe = /#([\u4e00-\u9fa5a-zA-Z0-9]{1,10})/g
        while ((match = plainRe.exec(plain)) !== null) {
            tags.add(match[1])
        }
    }

    return [...tags].slice(0, 5)
}

// 根据标签归类
function getCategory(tagList) {
    const helpTags = ["求助", "提问"]
    const textTags = ["文案", "短句"]
    if (tagList.some(t => helpTags.includes(t))) return "求助"
    if (tagList.some(t => textTags.includes(t))) return "文案"
    return "日常"
}

// ============ Create Post ============
module.exports.createPost = function (req, res) {
    const content = filterXSS(req.body.content)
    const images = req.body.images ? JSON.stringify(req.body.images) : null

    // 从 HTML 内容中提取标签
    const tagList = extractTagsFromHTML(content)
    const tags = tagList.length > 0 ? JSON.stringify(tagList) : null
    const category = getCategory(tagList)

    const sql = `INSERT INTO posts (user_id, content, images, tags, category, is_public, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?)`
    db.query(sql, [req.user.id, content, images, tags, category, req.body.is_public ?? 1, req.body.is_anonymous ?? 0], (err, result) => {
        if (err) { console.error("创建帖子失败:", err); return req.cc("服务器异常", 1, 500) }

        const selectSql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.id = ? AND p.status = 1 AND p.report_status <> 3`
        db.query(selectSql, [req.user.id, result.insertId], (err2, rows) => {
            if (err2) { console.error("查询新帖子失败:", err2); return req.cc("服务器异常", 1, 500) }
            if (rows.length === 0) return req.cc("服务器异常", 1, 500)
            const row = rows[0]
            const post = {
                ...row,
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                category: row.category || "日常",
            }
            res.send({ status: 0, msg: "发帖成功", data: post })
        })
    })
}

// ============ Post List ============
module.exports.postList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const updateHot = `UPDATE posts SET hot_value = FLOOR((view_count * 1 + like_count * 3 + comment_count * 5) / POWER(TIMESTAMPDIFF(HOUR, created_at, NOW()) + 2, 1.5)) WHERE status = 1`
    db.query(updateHot, (err) => {
        if (err) console.error("更新热力值失败:", err)

        const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 ORDER BY p.hot_value DESC LIMIT ? OFFSET ?`
        const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1`
        db.query(countSql, (errC, counts) => {
            if (errC) { console.error("查询帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
            const total = counts[0] ? counts[0].total : 0


        db.query(sql, [req.user.id, size, offset], (err2, results) => {
            if (err2) { console.error("查询帖子列表失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => ({
                ...row,
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                category: row.category || "日常",
            }))
                res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
            })
        })
    })
}

// ============ Hot Post List (今日热榜 Top10) ============
module.exports.hotPostList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const updateHot = `UPDATE posts SET hot_value = FLOOR((view_count * 1 + like_count * 3 + comment_count * 5) / POWER(TIMESTAMPDIFF(HOUR, created_at, NOW()) + 2, 1.5)) WHERE status = 1`
    db.query(updateHot, (err) => {
        if (err) console.error("更新热力值失败:", err)

        const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 ORDER BY (p.like_count * 3 + p.comment_count * 5 + p.view_count * 1) DESC, p.hot_value DESC LIMIT ? OFFSET ?`
        const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1`
        db.query(countSql, (errC, counts) => {
            if (errC) { console.error("查询帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
            const total = counts[0] ? counts[0].total : 0

        db.query(sql, [req.user.id, size, offset], (err2, results) => {
            if (err2) { console.error("查询今日热榜失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => {
                const heat = row.like_count * 3 + row.comment_count * 5 + row.view_count * 1
                return {
                    ...row,
                    hot_value: heat >= 10000 ? (heat / 10000).toFixed(1).replace(/\.0$/, "") + "w" : String(heat),
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                    category: row.category || "日常",
                }
            })
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
        })
    })
}

// ============ Post Detail ============
module.exports.postDetail = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")

    db.query("UPDATE posts SET view_count = view_count + 1 WHERE id = ?", [postId], (err) => {
        if (err) console.error("更新浏览数失败:", err)

        const sql = `SELECT p.*, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.id = ? AND p.status = 1 AND p.report_status <> 3`
        db.query(sql, [req.user.id, postId], (err2, results) => {
            if (err2) { console.error("查询帖子详情失败:", err2); return req.cc("服务器异常", 1, 500) }
            if (results.length === 0) return req.cc("帖子不存在")
            const row = results[0]
            if (row.is_public === 0 && row.user_id !== req.user.id) return req.cc("该帖子为私密状态，无法查看")
            res.send({
                status: 0, msg: "查询成功",
                data: {
                    ...row,
                    avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                    username: row.is_anonymous ? "匿名用户" : row.username,
                    images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                    category: row.category || "日常",
                },
            })
        })
    })
}
// ============ Increment Post View ============
module.exports.incrementView = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")

    db.query("SELECT id FROM posts WHERE id = ? AND status = 1", [postId], (err, results) => {
        if (err) { console.error("查询帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (results.length === 0) return req.cc("帖子不存在")
        db.query("UPDATE posts SET view_count = view_count + 1 WHERE id = ?", [postId], (err2) => {
            if (err2) { console.error("更新浏览数失败:", err2); return req.cc("服务器异常", 1, 500) }
            res.send({ status: 0, msg: "浏览成功" })
        })
    })
}
// ============ Help Post List ============
module.exports.helpPostList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const updateHot = `UPDATE posts SET hot_value = FLOOR((view_count * 1 + like_count * 3 + comment_count * 5) / POWER(TIMESTAMPDIFF(HOUR, created_at, NOW()) + 2, 1.5)) WHERE status = 1`
    db.query(updateHot, (err) => {
        if (err) console.error("更新热力值失败:", err)

        const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category = '求助' ORDER BY p.hot_value DESC LIMIT ? OFFSET ?`
        const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category = '求助'`
        db.query(countSql, (errC, counts) => {
            if (errC) { console.error("查询求助帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
            const total = counts[0] ? counts[0].total : 0 
        db.query(sql, [req.user.id, size, offset], (err2, results) => {
            if (err2) { console.error("查询求助帖子列表失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => ({
                ...row,
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                category: row.category || "日常",
            }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
    })
}
// ============ Text Post List ============
module.exports.textPostList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const updateHot = `UPDATE posts SET hot_value = FLOOR((view_count * 1 + like_count * 3 + comment_count * 5) / POWER(TIMESTAMPDIFF(HOUR, created_at, NOW()) + 2, 1.5)) WHERE status = 1`
    db.query(updateHot, (err) => {
        if (err) console.error("更新热力值失败:", err)

        const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category = '文案' ORDER BY p.hot_value DESC LIMIT ? OFFSET ?`
        const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category = '文案'`
        db.query(countSql, (errC, counts) => {
            if (errC) { console.error("查询文案帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
            const total = counts[0] ? counts[0].total : 0


        db.query(sql, [req.user.id, size, offset], (err2, results) => {
            if (err2) { console.error("查询文案帖子列表失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => ({
                ...row,
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                category: row.category || "日常",
            }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
    })
}
// ============ Daily Post List ============
module.exports.dailyPostList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const updateHot = `UPDATE posts SET hot_value = FLOOR((view_count * 1 + like_count * 3 + comment_count * 5) / POWER(TIMESTAMPDIFF(HOUR, created_at, NOW()) + 2, 1.5)) WHERE status = 1`
    db.query(updateHot, (err) => {
        if (err) console.error("更新热力值失败:", err)

        const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category = '日常' ORDER BY p.hot_value DESC LIMIT ? OFFSET ?`
        const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category = '日常'`
        db.query(countSql, (errC, counts) => {
            if (errC) { console.error("查询日常帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
            const total = counts[0] ? counts[0].total : 0


        db.query(sql, [req.user.id, size, offset], (err2, results) => {
            if (err2) { console.error("查询日常帖子列表失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => ({
                ...row,
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                category: row.category || "日常",
            }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
    })
}// ============ My Post List ============
module.exports.myPostList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.user_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.user_id = ?`
    db.query(countSql, [req.user.id], (errC, counts) => {
        if (errC) { console.error("查询我的帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, req.user.id, size, offset], (err, results) => {
        if (err) { console.error("查询我的帖子列表失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            ...row,
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
            username: row.is_anonymous ? "匿名用户" : row.username,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
            category: row.category || "日常",
            report_status: row.report_status || 0,
            report_status_text: ["正常", "待受理", "已受理", "已下架"][row.report_status] || "正常",
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}// ============ Liked Post List ============
module.exports.likedPostList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = ?) AS is_liked FROM post_likes pl JOIN posts p ON pl.post_id = p.id LEFT JOIN userinfo u ON p.user_id = u.id WHERE pl.user_id = ? AND p.status = 1 AND p.report_status <> 3 AND (p.is_public = 1 OR p.user_id = ?) ORDER BY pl.created_at DESC, pl.id DESC LIMIT ? OFFSET ?`
    const countSql = `SELECT COUNT(*) AS total FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE pl.user_id = ? AND p.status = 1 AND p.report_status <> 3 AND (p.is_public = 1 OR p.user_id = ?)`
    db.query(countSql, [req.user.id, req.user.id], (errC, counts) => {
        if (errC) { console.error("查询点赞帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, req.user.id, req.user.id, size, offset], (err, results) => {
        if (err) { console.error("查询点赞帖子列表失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            ...row,
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
            username: row.is_anonymous ? "匿名用户" : row.username,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
            category: row.category || "日常",
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}
// ============ Delete Post ============
module.exports.deletePost = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")
    db.query("UPDATE posts SET status = 0 WHERE id = ? AND user_id = ?", [postId, req.user.id], (err, result) => {
        if (err) { console.error("删除帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (result.affectedRows === 0) return req.cc("帖子不存在或无权操作")
        res.send({ status: 0, msg: "删除成功" })
    })
}

// ============ Update Post ============
module.exports.updatePost = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")

    const fields = []
    const values = []
    if (req.body.content !== undefined) { fields.push("content = ?"); values.push(filterXSS(req.body.content)) }
    if (req.body.images !== undefined) { fields.push("images = ?"); values.push(JSON.stringify(req.body.images)) }
    if (req.body.is_public !== undefined) { fields.push("is_public = ?"); values.push(req.body.is_public) }
    if (req.body.is_anonymous !== undefined) { fields.push("is_anonymous = ?"); values.push(req.body.is_anonymous) }
    if (fields.length === 0) return req.cc("没有需要更新的内容")

    values.push(postId, req.user.id)
    const sql = `UPDATE posts SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`
    db.query(sql, values, (err, result) => {
        if (err) { console.error("更新帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (result.affectedRows === 0) return req.cc("帖子不存在或无权操作")
        res.send({ status: 0, msg: "更新成功" })
    })
}
// ============ Set Post Visibility ============
module.exports.setPostVisibility = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")
    const isPublic = Number(req.body.is_public)
    if (isPublic !== 0 && isPublic !== 1) return req.cc("is_public 参数错误")

    db.query("SELECT id FROM posts WHERE id = ? AND status = 1 AND user_id = ?", [postId, req.user.id], (err, results) => {
        if (err) { console.error("查询帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (results.length === 0) return req.cc("帖子不存在或无权操作")
        db.query("UPDATE posts SET is_public = ? WHERE id = ?", [isPublic, postId], (err2) => {
            if (err2) { console.error("更新帖子可见状态失败:", err2); return req.cc("服务器异常", 1, 500) }
            res.send({ status: 0, msg: "设置成功", data: { is_public: isPublic } })
        })
    })
}
// ============ Like Post ============
module.exports.likePost = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")
    db.getConnection((connErr, conn) => {
        if (connErr) { console.error("获取数据库连接失败:", connErr); return req.cc("服务器异常", 1, 500) }
        conn.beginTransaction((beginErr) => {
            if (beginErr) { conn.release(); return req.cc("服务器异常", 1, 500) }

            const fail = (err) => {
                console.error("点赞失败:", err)
                conn.rollback(() => conn.release())
                return req.cc("服务器异常", 1, 500)
            }

            conn.query("UPDATE posts SET like_count = like_count + 1 WHERE id = ? AND status = 1", [postId], (err, result) => {
                if (err) return fail(err)
                if (result.affectedRows === 0) { conn.rollback(() => conn.release()); return req.cc("帖子不存在") }
                conn.query("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, req.user.id], (err2) => {
                    if (err2) {
                        if (err2.code === "ER_DUP_ENTRY") { conn.rollback(() => conn.release()); return req.cc("请勿重复点赞") }
                        return fail(err2)
                    }
                    conn.commit((commitErr) => {
                        conn.release()
                        if (commitErr) { console.error("点赞提交失败:", commitErr); return req.cc("服务器异常", 1, 500) }
                        res.send({ status: 0, msg: "点赞成功", data: { is_liked: 1 } })
                        // 通知帖子作者（点赞）
                        db.query("SELECT user_id FROM posts WHERE id = ?", [postId], (nerr, posts) => {
                            if (nerr || posts.length === 0) return
                            notify.createNotification({
                                user_id: posts[0].user_id,
                                type: "like",
                                actor_id: req.user.id,
                                actor_name: req.user.username,
                                actor_avatar: req.user.avatar,
                                content: "",
                                target_id: postId,
                                post_id: postId,
                            })
                        })
                    })
                })
            })
        })
    })
}

// ============ Unlike Post ============
module.exports.unlikePost = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")

    db.getConnection((connErr, conn) => {
        if (connErr) { console.error("获取数据库连接失败:", connErr); return req.cc("服务器异常", 1, 500) }
        conn.beginTransaction((beginErr) => {
            if (beginErr) { conn.release(); return req.cc("服务器异常", 1, 500) }

            const fail = (err) => {
                console.error("取消点赞失败:", err)
                conn.rollback(() => conn.release())
                return req.cc("服务器异常", 1, 500)
            }

            conn.query("SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, req.user.id], (err, likes) => {
                if (err) return fail(err)
                if (likes.length === 0) { conn.rollback(() => conn.release()); return req.cc("还未点赞该帖子") }
                conn.query("DELETE FROM post_likes WHERE id = ?", [likes[0].id], (err2) => {
                    if (err2) return fail(err2)
                    conn.query("UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?", [postId], (err3) => {
                        if (err3) return fail(err3)
                        conn.commit((commitErr) => {
                            conn.release()
                            if (commitErr) { console.error("取消点赞提交失败:", commitErr); return req.cc("服务器异常", 1, 500) }
                            res.send({ status: 0, msg: "已取消点赞", data: { is_liked: 0 } })
                        })
                    })
                })
            })
        })
    })
}
// ============ Create Comment ============
module.exports.createComment = function (req, res) {
    const postId = parseInt(req.body.post_id)
    const parentId = req.body.parent_id ? parseInt(req.body.parent_id) : null
    const content = filterXSS(req.body.content)
    if (!postId || !content) return req.cc("参数不完整")

    const images = req.body.images && req.body.images.length > 0 ? JSON.stringify(req.body.images) : null

    db.query("SELECT id FROM posts WHERE id = ? AND status = 1 AND is_public = 1", [postId], (err, posts) => {
        if (err) { console.error("查询帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (posts.length === 0) return req.cc("帖子不存在或无法评论")

        const checkParent = (done) => {
            if (!parentId) return done()
            db.query("SELECT id FROM comments WHERE id = ? AND post_id = ? AND status = 1", [parentId, postId], (perr, parents) => {
                if (perr) { console.error("查询父评论失败:", perr); return req.cc("服务器异常", 1, 500) }
                if (parents.length === 0) return req.cc("被回复的评论不存在")
                done()
            })
        }

        checkParent(() => {
            db.query("INSERT INTO comments (post_id, parent_id, user_id, content, images) VALUES (?, ?, ?, ?, ?)", [postId, parentId, req.user.id, content, images], (err2, result) => {
                if (err2) { console.error("创建评论失败:", err2); return req.cc("服务器异常", 1, 500) }
                db.query("UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?", [postId])
                if (parentId) {
                    db.query("UPDATE comments SET reply_count = reply_count + 1 WHERE id = ?", [parentId])
                }

                // 查出完整评论信息返回
                const detailSql = `SELECT c.*, u.username, u.avatar FROM comments c LEFT JOIN userinfo u ON c.user_id = u.id WHERE c.id = ?`
                db.query(detailSql, [result.insertId], (err3, rows) => {
                    if (err3) { console.error("查询新评论失败:", err3); return req.cc("服务器异常", 1, 500) }
                    if (rows.length === 0) return req.cc("评论失败")
                    const row = rows[0]
                    res.send({
                        status: 0,
                        msg: "评论成功",
                        data: {
                            id: row.id,
                            post_id: row.post_id,
                            parent_id: row.parent_id,
                            user_id: row.user_id,
                            username: row.username,
                            avatar: row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null,
                            content: row.content,
                            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                            star_count: row.star_count,
                            reply_count: row.reply_count,
                            status: row.status,
                            create_at: row.create_at,
                        },
                    })
                    // 通知帖子作者（评论）
                    db.query("SELECT user_id FROM posts WHERE id = ?", [postId], (nerr, posts) => {
                        if (nerr || posts.length === 0) return
                        notify.createNotification({
                            user_id: posts[0].user_id,
                            type: "comment",
                            actor_id: req.user.id,
                            actor_name: row.username,
                            actor_avatar: row.avatar,
                            content,
                            target_id: result.insertId,
                            post_id: postId,
                        })
                    })
                })
            })
        })
    })
}

// ============ Comment List ============
module.exports.commentList = function (req, res) {
    const postId = parseInt(req.params.postId)
    if (!postId) return req.cc("参数错误")
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT c.*, u.username, u.avatar, EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS is_liked FROM comments c LEFT JOIN userinfo u ON c.user_id = u.id WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = 1 ORDER BY c.create_at DESC LIMIT ? OFFSET ?`
    const countSql = "SELECT COUNT(*) AS total FROM comments c WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = 1"
    db.query(countSql, [postId], (errC, counts) => {
        if (errC) { console.error("查询评论总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, postId, size, offset], (err, results) => {
        if (err) { console.error("查询评论列表失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            ...row,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}
// ============ My Comment List ============
module.exports.myCommentList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked, c.id AS comment_id, c.parent_id, c.content AS comment_content, c.images AS comment_images, c.star_count, c.reply_count, c.create_at AS comment_create_at FROM comments c JOIN posts p ON c.post_id = p.id LEFT JOIN userinfo u ON p.user_id = u.id WHERE c.user_id = ? AND c.status = 1 AND p.status = 1 AND p.report_status <> 3 AND (p.is_public = 1 OR p.user_id = ?) ORDER BY c.create_at DESC, c.id DESC LIMIT ? OFFSET ?`
    const countSql = `SELECT COUNT(*) AS total FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.user_id = ? AND c.status = 1 AND p.status = 1 AND p.report_status <> 3 AND (p.is_public = 1 OR p.user_id = ?)`
    db.query(countSql, [req.user.id, req.user.id], (errC, counts) => {
        if (errC) { console.error("查询我的评论总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, req.user.id, req.user.id, size, offset], (err, results) => {
        if (err) { console.error("查询我的评论列表失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            id: row.id,
            user_id: row.user_id,
            content: row.content,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
            category: row.category || "日常",
            view_count: row.view_count,
            like_count: row.like_count,
            comment_count: row.comment_count,
            hot_value: row.hot_value,
            is_public: row.is_public,
            is_anonymous: row.is_anonymous,
            created_at: row.created_at,
            username: row.is_anonymous ? "匿名用户" : row.username,
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
            is_liked: row.is_liked,
            my_comment: {
                id: row.comment_id,
                parent_id: row.parent_id,
                content: row.comment_content,
                images: typeof row.comment_images === "string" ? JSON.parse(row.comment_images) : (row.comment_images || []),
                star_count: row.star_count,
                reply_count: row.reply_count,
                create_at: row.comment_create_at,
            },
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}// ============ Create Message To Post Author ============
module.exports.createMessage = function (req, res) {
    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")
    const content = filterXSS(req.body.content)
    const images = req.body.images && req.body.images.length > 0 ? JSON.stringify(req.body.images) : null

    db.query("SELECT id, user_id FROM posts WHERE id = ? AND status = 1", [postId], (err, posts) => {
        if (err) { console.error("查询帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (posts.length === 0) return req.cc("帖子不存在")

        db.query("SELECT username, avatar FROM userinfo WHERE id = ?", [req.user.id], (err2, users) => {
            if (err2) { console.error("查询留言人信息失败:", err2); return req.cc("服务器异常", 1, 500) }
            if (users.length === 0) return req.cc("用户不存在")
            const sender = users[0]
            const avatar = sender.avatar ? (sender.avatar.startsWith("http") ? sender.avatar : req.protocol + "://" + req.get("host") + sender.avatar) : null

            db.query("INSERT INTO post_messages (post_id, sender_id, sender_username, sender_avatar, content, images) VALUES (?, ?, ?, ?, ?, ?)", [postId, req.user.id, sender.username, avatar, content, images], (err3, result) => {
                if (err3) { console.error("创建留言失败:", err3); return req.cc("服务器异常", 1, 500) }
                db.query("SELECT * FROM post_messages WHERE id = ?", [result.insertId], (err4, rows) => {
                    if (err4) { console.error("查询新留言失败:", err4); return req.cc("服务器异常", 1, 500) }
                    if (rows.length === 0) return req.cc("留言失败")
                    const row = rows[0]
                    res.send({
                        status: 0, msg: "留言成功",
                        data: {
                            ...row,
                            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                        },
                    })
                    // 通知帖子作者（留言）
                    notify.createNotification({
                        user_id: posts[0].user_id,
                        type: "message",
                        actor_id: req.user.id,
                        actor_name: sender.username,
                        actor_avatar: avatar,
                        content,
                        target_id: result.insertId,
                        post_id: postId,
                    })
                })
            })
        })
    })
}// ============ My Message List ============
module.exports.myMessageList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked, m.id AS message_id, m.content AS message_content, m.create_at AS message_create_at FROM post_messages m JOIN posts p ON m.post_id = p.id LEFT JOIN userinfo u ON p.user_id = u.id WHERE m.sender_id = ? AND m.status = 1 AND p.status = 1 AND p.report_status <> 3 AND (p.is_public = 1 OR p.user_id = ?) ORDER BY m.create_at DESC, m.id DESC LIMIT ? OFFSET ?`
    const countSql = `SELECT COUNT(*) AS total FROM post_messages m JOIN posts p ON m.post_id = p.id WHERE m.sender_id = ? AND m.status = 1 AND p.status = 1 AND p.report_status <> 3 AND (p.is_public = 1 OR p.user_id = ?)`
    db.query(countSql, [req.user.id, req.user.id], (errC, counts) => {
        if (errC) { console.error("查询我的留言总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, req.user.id, req.user.id, size, offset], (err, results) => {
        if (err) { console.error("查询我的留言列表失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            id: row.id,
            user_id: row.user_id,
            content: row.content,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
            category: row.category || "日常",
            view_count: row.view_count,
            like_count: row.like_count,
            comment_count: row.comment_count,
            hot_value: row.hot_value,
            is_public: row.is_public,
            is_anonymous: row.is_anonymous,
            created_at: row.created_at,
            username: row.is_anonymous ? "匿名用户" : row.username,
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
            is_liked: row.is_liked,
            my_message: {
                id: row.message_id,
                content: row.message_content,
                create_at: row.message_create_at,
            },
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}
// ============ Message To Me List (别人对我的留言) ============
module.exports.messageToMeList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked, m.id AS message_id, m.content AS message_content, m.create_at AS message_create_at, m.sender_id, m.sender_username, m.sender_avatar FROM post_messages m JOIN posts p ON m.post_id = p.id LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.user_id = ? AND m.sender_id <> ? AND m.status = 1 AND p.status = 1 AND p.report_status <> 3 ORDER BY m.create_at DESC, m.id DESC LIMIT ? OFFSET ?`
    const countSql = `SELECT COUNT(*) AS total FROM post_messages m JOIN posts p ON m.post_id = p.id WHERE p.user_id = ? AND m.sender_id <> ? AND m.status = 1 AND p.status = 1 AND p.report_status <> 3`
    db.query(countSql, [req.user.id, req.user.id], (errC, counts) => {
        if (errC) { console.error("查询别人给我的留言总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, req.user.id, req.user.id, size, offset], (err, results) => {
        if (err) { console.error("查询别人对我的留言失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            id: row.id,
            user_id: row.user_id,
            content: row.content,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
            category: row.category || "日常",
            view_count: row.view_count,
            like_count: row.like_count,
            comment_count: row.comment_count,
            hot_value: row.hot_value,
            is_public: row.is_public,
            is_anonymous: row.is_anonymous,
            created_at: row.created_at,
            username: row.is_anonymous ? "匿名用户" : row.username,
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
            is_liked: row.is_liked,
            message: {
                id: row.message_id,
                content: row.message_content,
                create_at: row.message_create_at,
                sender_id: row.sender_id,
                sender_username: row.sender_username,
                sender_avatar: row.sender_avatar ? (row.sender_avatar.startsWith("http") ? row.sender_avatar : req.protocol + "://" + req.get("host") + row.sender_avatar) : null,
            },
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}
// ============ Notification List (通知列表：已读/未读都返回) ============
module.exports.notificationList = function (req, res) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const countSql = "SELECT COUNT(*) AS total, SUM(is_read = 0) AS unread FROM notifications WHERE user_id = ?"
    db.query(countSql, [req.user.id], (err, counts) => {
        if (err) { console.error("查询通知数量失败:", err); return req.cc("服务器异常", 1, 500) }
        const row = counts[0] || {}
        const total = row.total || 0
        const unreadCount = (row.unread === null || row.unread === undefined) ? 0 : Number(row.unread)

        const sql = `SELECT n.id, n.type, n.is_read, n.create_at, n.actor_name, n.actor_avatar, n.content, n.target_id, n.post_id, n.reasons, n.handle_result, n.is_success, n.role, p.content AS post_content, p.images AS post_images, u.username AS post_username, u.avatar AS post_avatar FROM notifications n LEFT JOIN posts p ON n.post_id = p.id LEFT JOIN userinfo u ON p.user_id = u.id WHERE n.user_id = ? ORDER BY n.create_at DESC, n.id DESC LIMIT ? OFFSET ?`
        db.query(sql, [req.user.id, size, offset], (err2, results) => {
            if (err2) { console.error("查询通知列表失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => ({
                id: row.id,
                type: row.type,
                is_read: row.is_read === 1,
                create_at: row.create_at,
                actor_name: row.actor_name,
                actor_avatar: row.actor_avatar ? (row.actor_avatar.startsWith("http") ? row.actor_avatar : req.protocol + "://" + req.get("host") + row.actor_avatar) : null,
                content: row.content || "",
                target_id: row.target_id,
                post: {
                    id: row.post_id,
                    username: row.post_username || "",
                    avatar: row.post_avatar ? (row.post_avatar.startsWith("http") ? row.post_avatar : req.protocol + "://" + req.get("host") + row.post_avatar) : null,
                    content: row.post_content || "",
                    images: typeof row.post_images === "string" ? JSON.parse(row.post_images) : (row.post_images || []),
                },
                reasons: notify.parseReasons(row.reasons),
                handle_result: row.handle_result || "",
                is_success: (row.is_success === null || row.is_success === undefined) ? null : !!row.is_success,
                role: row.role || null,
            }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, total, unread_count: unreadCount, hasMore: offset + size < total } })
        })
    })
}

// ============ Delete One Notification (删除单条通知) ============
module.exports.deleteNotification = function (req, res) {
    const id = parseInt(req.params.id)
    if (!id) return req.cc("参数错误")
    db.query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [id, req.user.id], (err, result) => {
        if (err) { console.error("删除通知失败:", err); return req.cc("服务器异常", 1, 500) }
        if (result.affectedRows === 0) return req.cc("通知不存在")
        res.send({ status: 0, msg: "删除成功" })
    })
}
// ============ Create Reply ============
module.exports.createReply = function (req, res) {
    const parentId = parseInt(req.body.parent_id)
    const content = filterXSS(req.body.content)
    if (!parentId || !content) return req.cc("参数不完整")

    const images = req.body.images && req.body.images.length > 0 ? JSON.stringify(req.body.images) : null

    db.query("SELECT post_id FROM comments WHERE id = ? AND status = 1", [parentId], (err, comments) => {
        if (err) { console.error("查询父评论失败:", err); return req.cc("服务器异常", 1, 500) }
        if (comments.length === 0) return req.cc("被回复的评论不存在")
        const postId = comments[0].post_id
        db.query("INSERT INTO comments (post_id, parent_id, user_id, content, images) VALUES (?, ?, ?, ?, ?)", [postId, parentId, req.user.id, content, images], (err2, result) => {
            if (err2) { console.error("创建回复失败:", err2); return req.cc("服务器异常", 1, 500) }
            db.query("UPDATE comments SET reply_count = reply_count + 1 WHERE id = ?", [parentId])
            db.query("UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?", [postId])

            const detailSql = `SELECT c.*, u.username, u.avatar FROM comments c LEFT JOIN userinfo u ON c.user_id = u.id WHERE c.id = ?`
            db.query(detailSql, [result.insertId], (err3, rows) => {
                if (err3) { console.error("查询新回复失败:", err3); return req.cc("服务器异常", 1, 500) }
                if (rows.length === 0) return req.cc("回复失败")
                const row = rows[0]
                res.send({
                    status: 0,
                    msg: "回复成功",
                    data: {
                        id: row.id,
                        post_id: row.post_id,
                        parent_id: row.parent_id,
                        user_id: row.user_id,
                        username: row.username,
                        avatar: row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null,
                        content: row.content,
                        images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                        star_count: row.star_count,
                        reply_count: row.reply_count,
                        status: row.status,
                        create_at: row.create_at,
                        is_liked: 0,
                    },
                    })
                    // 通知被回复评论的作者（回复）
                    db.query("SELECT user_id FROM comments WHERE id = ?", [parentId], (nerr, parents) => {
                        if (nerr || parents.length === 0) return
                        notify.createNotification({
                            user_id: parents[0].user_id,
                            type: "reply",
                            actor_id: req.user.id,
                            actor_name: row.username,
                            actor_avatar: row.avatar,
                            content,
                            target_id: result.insertId,
                            post_id: postId,
                        })
                    })
                })
            })
        })
}

// ============ Reply List ============
module.exports.replyList = function (req, res) {
    const parentId = parseInt(req.params.parent_id)
    if (!parentId) return req.cc("参数错误")
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const sql = `SELECT c.*, u.username, u.avatar, EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS is_liked FROM comments c LEFT JOIN userinfo u ON c.user_id = u.id WHERE c.parent_id = ? AND c.status = 1 ORDER BY c.create_at ASC LIMIT ? OFFSET ?`
    const countSql = "SELECT COUNT(*) AS total FROM comments c WHERE c.parent_id = ? AND c.status = 1"
    db.query(countSql, [parentId], (errC, counts) => {
        if (errC) { console.error("查询回复总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0


    db.query(sql, [req.user.id, parentId, size, offset], (err, results) => {
        if (err) { console.error("查询回复列表失败:", err); return req.cc("服务器异常", 1, 500) }
        const list = results.map(row => ({
            ...row,
            images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
            avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
        }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}

// ============ Like Comment ============
module.exports.likeComment = function (req, res) {
    const commentId = parseInt(req.params.id)
    if (!commentId) return req.cc("参数错误")

    db.getConnection((connErr, conn) => {
        if (connErr) { console.error("获取数据库连接失败:", connErr); return req.cc("服务器异常", 1, 500) }
        conn.beginTransaction((beginErr) => {
            if (beginErr) { conn.release(); return req.cc("服务器异常", 1, 500) }

            const fail = (err) => {
                console.error("点赞评论失败:", err)
                conn.rollback(() => conn.release())
                return req.cc("服务器异常", 1, 500)
            }

            conn.query("UPDATE comments SET star_count = star_count + 1 WHERE id = ? AND status = 1", [commentId], (err, result) => {
                if (err) return fail(err)
                if (result.affectedRows === 0) { conn.rollback(() => conn.release()); return req.cc("评论不存在") }
                conn.query("INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)", [commentId, req.user.id], (err2) => {
                    if (err2) {
                        if (err2.code === "ER_DUP_ENTRY") { conn.rollback(() => conn.release()); return req.cc("请勿重复点赞") }
                        return fail(err2)
                    }
                    conn.commit((commitErr) => {
                        conn.release()
                        if (commitErr) { console.error("点赞评论提交失败:", commitErr); return req.cc("服务器异常", 1, 500) }
                        res.send({ status: 0, msg: "点赞成功", data: { is_liked: 1 } })
                    })
                })
            })
        })
    })
}

// ============ Unlike Comment ============
module.exports.unlikeComment = function (req, res) {
    const commentId = parseInt(req.params.id)
    if (!commentId) return req.cc("参数错误")

    db.getConnection((connErr, conn) => {
        if (connErr) { console.error("获取数据库连接失败:", connErr); return req.cc("服务器异常", 1, 500) }
        conn.beginTransaction((beginErr) => {
            if (beginErr) { conn.release(); return req.cc("服务器异常", 1, 500) }

            const fail = (err) => {
                console.error("取消点赞评论失败:", err)
                conn.rollback(() => conn.release())
                return req.cc("服务器异常", 1, 500)
            }

            conn.query("SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?", [commentId, req.user.id], (err, likes) => {
                if (err) return fail(err)
                if (likes.length === 0) { conn.rollback(() => conn.release()); return req.cc("还未点赞该评论") }
                conn.query("DELETE FROM comment_likes WHERE id = ?", [likes[0].id], (err2) => {
                    if (err2) return fail(err2)
                    conn.query("UPDATE comments SET star_count = GREATEST(star_count - 1, 0) WHERE id = ?", [commentId], (err3) => {
                        if (err3) return fail(err3)
                        conn.commit((commitErr) => {
                            conn.release()
                            if (commitErr) { console.error("取消点赞评论提交失败:", commitErr); return req.cc("服务器异常", 1, 500) }
                            res.send({ status: 0, msg: "已取消点赞", data: { is_liked: 0 } })
                        })
                    })
                })
            })
        })
    })
}
// ============ Get Sensitive Words ============
const sensitiveWordsPath = path.join(__dirname, "..", "sensitive_words.json")
module.exports.getSensitiveWords = function (req, res) {
    fs.readFile(sensitiveWordsPath, "utf8", (err, data) => {
        if (err) {
            console.error("读取敏感词库失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        try {
            const words = JSON.parse(data)
            res.send({ status: 0, msg: "获取成功", data: words })
        } catch (e) {
            console.error("解析敏感词库失败:", e)
            return req.cc("服务器异常", 1, 500)
        }
    })
}

// ============ Get Tags ============
module.exports.getTags = function (req, res) {
    const tags = [
        "求助", "日常生活", "吐槽", "情感",
        "学习", "工作", "恋爱", "失恋",
        "友情", "家庭", "心事", "秘密",
        "搞笑", "深夜", "回忆", "许愿",
        "提问", "树洞", "焦虑", "开心",
        "文案", "短句",
    ]
    res.send({ status: 0, msg: "获取成功", data: { tags } })
}

// ============ User Custom Tags ============
// 获取当前用户的自定义标签
module.exports.getUserTags = function (req, res) {
    const sql = "SELECT tags FROM user_tags WHERE user_id = ?"
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("查询用户标签失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        const tags = results.length > 0 && results[0].tags ? results[0].tags : []
        // 如果是字符串则 parse
        const tagList = typeof tags === "string" ? JSON.parse(tags) : tags
        res.send({ status: 0, msg: "获取成功", data: { tags: tagList } })
    })
}

// 更新当前用户的自定义标签（全量覆盖）
module.exports.updateUserTags = function (req, res) {
    const { tags } = req.body
    if (!tags || !Array.isArray(tags)) {
        return req.cc("标签格式错误")
    }
    if (tags.length > 50) {
        return req.cc("最多50个自定义标签")
    }
    const tagsJson = JSON.stringify(tags)

    const sql = "INSERT INTO user_tags (user_id, tags) VALUES (?, ?) ON DUPLICATE KEY UPDATE tags = ?"
    db.query(sql, [req.user.id, tagsJson, tagsJson], (err) => {
        if (err) {
            console.error("更新用户标签失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        res.send({ status: 0, msg: "标签更新成功" })
    })
}


// ============ Search History (搜索记录) ============
module.exports.searchHistory = function (req, res) {
    db.query("SELECT keyword, create_at FROM search_records WHERE user_id = ? ORDER BY create_at DESC LIMIT 20", [req.user.id], (err, results) => {
        if (err) { console.error("查询搜索记录失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({ status: 0, msg: "查询成功", data: { list: results.map(r => r.keyword) } })
    })
}

// ============ Add Search History (手动添加搜索记录) ============
module.exports.addSearchHistory = function (req, res) {
    let keyword = (req.body.keyword || "").trim()
    if (!keyword) return req.cc("请输入搜索关键词")
    if (keyword.length > 100) keyword = keyword.slice(0, 100)
    db.query("INSERT INTO search_records (user_id, keyword) VALUES (?, ?) ON DUPLICATE KEY UPDATE create_at = NOW(3)", [req.user.id, keyword], (err) => {
        if (err) { console.error("添加搜索记录失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({ status: 0, msg: "记录成功" })
    })
}

// ============ Clear Search History (清空搜索记录) ============
module.exports.clearSearchHistory = function (req, res) {
    db.query("DELETE FROM search_records WHERE user_id = ?", [req.user.id], (err) => {
        if (err) { console.error("清空搜索记录失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({ status: 0, msg: "已清空搜索记录" })
    })
}

// ============ Delete Search History (删除单个搜索记录) ============
module.exports.deleteSearchHistory = function (req, res) {
    const keyword = decodeURIComponent(req.params.keyword || "").trim()
    if (!keyword) return req.cc("请输入搜索关键词")
    db.query("DELETE FROM search_records WHERE user_id = ? AND keyword = ?", [req.user.id, keyword], (err, result) => {
        if (err) { console.error("删除搜索记录失败:", err); return req.cc("服务器异常", 1, 500) }
        if (result.affectedRows === 0) return req.cc("搜索记录不存在")
        res.send({ status: 0, msg: "删除成功" })
    })
}

// ============ Hot Search Keywords (大家都在搜 Top10) ============
module.exports.hotSearchKeywords = function (req, res) {
    const sql = `SELECT keyword, COUNT(*) AS count FROM search_records GROUP BY keyword ORDER BY count DESC, MAX(create_at) DESC LIMIT 10`
    db.query(sql, (err, results) => {
        if (err) { console.error("查询热搜词失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({
            status: 0,
            msg: "查询成功",
            data: { list: results.map(r => ({ keyword: r.keyword, count: r.count })) },
        })
    })
}

// ============ Hot Search Post List (热词对应的帖子列表) ============
module.exports.hotSearchPostList = function (req, res) {
    const keyword = (req.query.keyword || "").trim()
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size
    if (!keyword) return req.cc("请输入搜索关键词")

    const countSql = `SELECT COUNT(*) AS total FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.content LIKE CONCAT('%', ?, '%')`
    db.query(countSql, [keyword], (errC, counts) => {
        if (errC) { console.error("查询热词帖子总数失败:", errC); return req.cc("服务器异常", 1, 500) }
        const total = counts[0] ? counts[0].total : 0

        const sql = `SELECT p.id, p.user_id, p.content, p.images, p.tags, p.category, p.view_count, p.like_count, p.comment_count, p.hot_value, p.is_public, p.is_anonymous, p.report_status, p.created_at, u.username, u.avatar, EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS is_liked FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.content LIKE CONCAT('%', ?, '%') ORDER BY (p.like_count * 3 + p.comment_count * 5 + p.view_count * 1) DESC, p.hot_value DESC LIMIT ? OFFSET ?`
        db.query(sql, [req.user.id, keyword, size, offset], (err2, results) => {
            if (err2) { console.error("查询热词帖子失败:", err2); return req.cc("服务器异常", 1, 500) }
            const list = results.map(row => ({
                ...row,
                avatar: row.is_anonymous ? (req.protocol + "://" + req.get("host") + "/default_avatar.jpeg") : (row.avatar ? (row.avatar.startsWith("http") ? row.avatar : req.protocol + "://" + req.get("host") + row.avatar) : null),
                username: row.is_anonymous ? "匿名用户" : row.username,
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                category: row.category || "日常",
            }))
            res.send({ status: 0, msg: "查询成功", data: { list, page, size, hasMore: offset + size < total } })
        })
    })
}

// ============ Search Associate (搜索联想：根据输入找相关热词) ============
module.exports.searchAssociate = function (req, res) {
    const keyword = (req.query.keyword || "").trim()
    if (!keyword) return req.cc("请输入搜索关键词")

    const sql = `SELECT keyword, MAX(count) AS count FROM (
            SELECT keyword, COUNT(*) AS count, (keyword LIKE CONCAT(?, '%')) AS pref, MAX(create_at) AS t FROM search_records WHERE keyword LIKE CONCAT('%', ?, '%') GROUP BY keyword
            UNION ALL
            SELECT category AS keyword, COUNT(*) AS count, (category LIKE CONCAT(?, '%')) AS pref, MAX(created_at) AS t FROM posts p WHERE p.status = 1 AND p.report_status <> 3 AND p.is_public = 1 AND p.category LIKE CONCAT('%', ?, '%') GROUP BY category
        ) t GROUP BY keyword ORDER BY MAX(pref) DESC, MAX(count) DESC, MAX(t) DESC LIMIT 10`
    db.query(sql, [keyword, keyword, keyword, keyword], (err, results) => {
        if (err) { console.error("查询搜索联想失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({
            status: 0,
            msg: "查询成功",
            data: { list: results.map(r => ({ keyword: r.keyword, count: r.count })) },
        })
    })
}

// ============ Site Stats (用户总数 + 帖子总数) ============
module.exports.getStats = function (req, res) {
    const sql = "SELECT (SELECT COUNT(*) FROM userinfo) AS user_count, (SELECT COUNT(*) FROM posts WHERE status = 1) AS post_count"
    db.query(sql, (err, results) => {
        if (err) { console.error("查询统计数据失败:", err); return req.cc("服务器异常", 1, 500) }
        const row = results[0] || {}
        res.send({
            status: 0,
            msg: "查询成功",
            data: {
                user_count: row.user_count || 0,
                post_count: row.post_count || 0,
            },
        })
    })
}

// ============ Clear Notifications (清空所有通知) ============
module.exports.clearNotifications = function (req, res) {
    db.query("DELETE FROM notifications WHERE user_id = ?", [req.user.id], (err, result) => {
        if (err) { console.error("清空通知失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({
            status: 0,
            msg: "已清空所有通知",
            data: { deleted: result ? result.affectedRows : 0 },
        })
    })
}

// ============ Report Post (举报帖子) ============
module.exports.reportPost = function (req, res) {
    const postId = parseInt(req.params.id || req.body.post_id)
    if (!postId) return req.cc("请传入帖子 id")

    const description = typeof req.body.description === "string" ? req.body.description.trim().slice(0, 500) : ""
    let reasons = []
    if (Array.isArray(req.body.reasons)) {
        reasons = req.body.reasons
            .filter(r => typeof r === "string" && r.trim())
            .map(r => r.trim().slice(0, 50))
            .slice(0, 10)
    }
    if (!description && reasons.length === 0) return req.cc("举报理由和补充说明至少填写一项")

    db.query("SELECT id, user_id, status, report_status FROM posts WHERE id = ?", [postId], (err, posts) => {
        if (err) { console.error("举报时查询帖子失败:", err); return req.cc("服务器异常", 1, 500) }
        if (posts.length === 0 || posts[0].status !== 1) return req.cc("帖子不存在")
        // 已下架的帖子不能再被举报（原来这里错写成 === 2，导致：已受理的帖子被误报为"已下架"，
        // 而真正已下架的帖子反倒可以继续举报）
        if (posts[0].report_status === 3) return req.cc("该帖子已下架")
        if (posts[0].user_id === req.user.id) return req.cc("不能举报自己的帖子")

        db.query("SELECT username, avatar FROM userinfo WHERE id = ?", [req.user.id], (err2, users) => {
            if (err2) { console.error("举报时查询用户失败:", err2); return req.cc("服务器异常", 1, 500) }
            const me = users[0] || {}
            const reasonsJson = reasons.length > 0 ? JSON.stringify(reasons) : null
            const sql = "INSERT INTO post_reports (post_id, user_id, username, avatar, reasons, description) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reasons = VALUES(reasons), description = VALUES(description), status = 0, create_at = NOW(3)"
            db.query(sql, [postId, req.user.id, me.username || "用户", me.avatar || null, reasonsJson, description || null], (err3) => {
                if (err3) { console.error("提交举报失败:", err3); return req.cc("服务器异常", 1, 500) }
                // 只要不是"已下架"就置为待受理：已受理(2)的帖子再次被举报，要能重新变回待受理，
                // 否则新的举报会被这个字段吞掉，管理员在列表里看不出有待处理
                db.query("UPDATE posts SET report_status = 1 WHERE id = ? AND report_status <> 3", [postId])
                res.send({ status: 0, msg: "举报已提交，我们会尽快处理" })
            })
        })
    })
}

// ============ Update Post Audit Status (管理端：下架 / 恢复，需要 x-admin-key) ============
// 审核结果通知：帖子作者（被下架）+ 举报人（处理结果）
function sendAuditNotifications(postId, reportStatus, handleResult, reports) {
    db.query("SELECT user_id FROM posts WHERE id = ?", [postId], (err, posts) => {
        if (err || posts.length === 0) return
        const authorId = posts[0].user_id
        const list = Array.isArray(reports) ? reports : []

        // 1. 帖子作者：帖子被下架（不暴露举报人，actor 用系统）
        if (reportStatus === 3) {
            notify.createNotification({
                user_id: authorId,
                type: "post_offline",
                actor_id: 0,
                actor_name: "系统",
                actor_avatar: null,
                content: "你的帖子因违规被举报下架",
                target_id: postId,
                post_id: postId,
                reasons: notify.parseReasons(list.length > 0 ? list[0].reasons : null),
                handle_result: handleResult,
                is_success: 1,
                role: "author",
            })
        }

        // 2. 举报人：举报处理结果（成立 / 不成立）
        for (const r of list) {
            notify.createNotification({
                user_id: r.user_id,
                type: "report_result",
                actor_id: 0,
                actor_name: "系统",
                actor_avatar: null,
                content: reportStatus === 3 ? "你举报的内容已被下架，感谢你的反馈" : "你举报的内容经核实未违规，举报未通过",
                target_id: postId,
                post_id: postId,
                reasons: notify.parseReasons(r.reasons),
                handle_result: handleResult,
                is_success: reportStatus === 3 ? 1 : 0,
                role: "reporter",
            })
        }
    })
}

module.exports.updatePostAuditStatus = function (req, res) {
    const adminKey = req.headers["x-admin-key"] || (req.body && req.body.admin_key)
    const expectKey = require("../config").adminKey
    if (!expectKey || adminKey !== expectKey) return req.cc("无权操作", 1, 403)

    const postId = parseInt(req.params.id)
    if (!postId) return req.cc("参数错误")
    const action = (req.body && req.body.action) || ""
    // report_status 语义（全项目统一）：
    //   0 正常 / 1 待受理 / 2 已受理 / 3 已下架（= 不显示，C 端查询统一用 <> 3 排除）
    const map = { normal: 0, pending: 1, accepted: 2, offline: 3 }
    if (!(action in map)) return req.cc("action 只能是 normal / pending / accepted / offline")
    const value = map[action]

    db.query("UPDATE posts SET report_status = ? WHERE id = ?", [value, postId], (err, result) => {
        if (err) { console.error("更新帖子审核状态失败:", err); return req.cc("服务器异常", 1, 500) }
        if (result.affectedRows === 0) return req.cc("帖子不存在")
        // 下架（offline）或驳回（normal）时：标记举报已处理 + 通知帖子作者和举报人
        if (value === 3 || value === 0) {
            const handleResult = (req.body && req.body.handle_result) || (value === 3 ? "已下架" : "举报不成立")
            const handleBy = (req.body && req.body.handle_by) || "admin"
            const resultText = String(handleResult).slice(0, 200)
            db.query("SELECT id, user_id, reasons FROM post_reports WHERE post_id = ? AND status = 0", [postId], (eR, reports) => {
                if (eR) console.error("查询待处理举报失败:", eR)
                db.query(
                    "UPDATE post_reports SET status = 1, handle_at = NOW(3), handle_result = ?, handle_by = ? WHERE post_id = ? AND status = 0",
                    [resultText, String(handleBy).slice(0, 50), postId],
                    () => { /* 举报标记为已处理 */ }
                )
                sendAuditNotifications(postId, value, resultText, eR ? [] : reports)
            })
        }
        res.send({ status: 0, msg: "操作成功", data: { report_status: value } })
    })
}

// ============ Mark One Notification Read (标记单条通知已读) ============
module.exports.markNotificationRead = function (req, res) {
    const id = parseInt(req.params.id)
    if (!id) return req.cc("参数错误")

    db.query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [id, req.user.id], (err, result) => {
        if (err) { console.error("标记通知已读失败:", err); return req.cc("服务器异常", 1, 500) }
        if (result.affectedRows > 0) return res.send({ status: 0, msg: "已标记为已读", data: { id, is_read: true } })
        // 没有更新到：可能是已读，或不属于当前用户
        db.query("SELECT id FROM notifications WHERE id = ? AND user_id = ?", [id, req.user.id], (e2, rows) => {
            if (e2) { console.error("查询通知失败:", e2); return req.cc("服务器异常", 1, 500) }
            if (rows.length === 0) return req.cc("通知不存在")
            res.send({ status: 0, msg: "已标记为已读", data: { id, is_read: true } })
        })
    })
}

// ============ Mark Notifications Read (批量标记已读，不传 ids 则全部) ============
module.exports.markNotificationsRead = function (req, res) {
    const rawIds = req.body && Array.isArray(req.body.ids) ? req.body.ids : null
    const ids = rawIds ? rawIds.map(n => parseInt(n)).filter(n => n > 0) : []

    if (ids.length > 0) {
        db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0 AND id IN (?)", [req.user.id, ids], (err, result) => {
            if (err) { console.error("批量标记已读失败:", err); return req.cc("服务器异常", 1, 500) }
            res.send({ status: 0, msg: "已标记为已读", data: { updated: result.affectedRows } })
        })
        return
    }

    db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [req.user.id], (err, result) => {
        if (err) { console.error("标记通知已读失败:", err); return req.cc("服务器异常", 1, 500) }
        res.send({ status: 0, msg: "已全部标记为已读", data: { updated: result.affectedRows } })
    })
}
