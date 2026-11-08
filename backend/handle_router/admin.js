const db = require("../db/index")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const secretkey = require("../config").secretkey
const notify = require("../notify")

// 把 admin_menus 的一行记录转成前端路由节点
// 字段映射规则：
//   menu_name -> meta.title、icon -> meta.icon、sort -> meta.rank（仅顶级排序生效）
//   visible=0 -> meta.showLink=false、always_show -> meta.showParent、frame_src -> meta.frameSrc
//   页面(menu_type=2) -> meta.keepAlive=true；目录(menu_type=1) 不渲染页面，不给 keepAlive
function toRouteNode(m) {
    const meta = { title: m.menu_name }
    if (m.icon) meta.icon = m.icon
    if (m.sort !== null && m.sort !== undefined) meta.rank = m.sort
    // 菜单页面统一开启缓存（前端 keep-alive 按路由 name 缓存，需要组件 name 与之一致）
    if (m.menu_type === 2) meta.keepAlive = true
    if (m.visible === 0) meta.showLink = false
    if (m.always_show) meta.showParent = true
    if (m.frame_src) meta.frameSrc = m.frame_src

    const node = { path: m.path, meta }
    if (m.route_name) node.name = m.route_name
    if (m.component) node.component = m.component
    if (m.redirect) node.redirect = m.redirect
    return node
}

// 扁平记录 -> 路由树。保留 id 是为了组装 children，最后再序列化成纯路由对象
function buildRouteTree(rows) {
    const byId = new Map()
    rows.forEach((m) => {
        byId.set(m.id, {
            row: m,
            node: toRouteNode(m),
            isDir: m.menu_type === 1,
            children: [],
        })
    })

    const roots = []
    byId.forEach((item) => {
        // 只有 parent_id = 0 才是顶级；不能"查不到父级就当顶级"，
        // 否则父目录被停用/未授权时，子页面会变成一个没有图标的顶级菜单
        if (!item.row.parent_id) {
            roots.push(item)
            return
        }
        const parent = byId.get(item.row.parent_id)
        if (parent) parent.children.push(item)
    })

    const serialize = (items) =>
        items
            // 目录下一条可见子菜单都没有时不返回，避免侧边栏出现空分组
            .filter((it) => !it.isDir || it.children.length > 0)
            .map((it) => {
                if (it.children.length) {
                    // 目录只是分组，不渲染页面，所以不返回 component
                    it.node.children = serialize(it.children)
                }
                return it.node
            })

    return serialize(roots)
}

// 按当前管理员的角色返回可见的前端路由树（B 端动态路由）
// 鉴权要点：角色不取 token 里的 role_id，而是按 token 里的管理员 id 实时查库，
// 这样改角色 / 停用账号后立即生效，不用等 8 小时 token 过期
module.exports.routes = (req, res) => {
    db.query("SELECT id, role_id, status FROM admins WHERE id = ?", [req.admin.id], (err, rows) => {
        if (err) {
            console.error("查询管理员失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length !== 1) {
            return req.cc("账号不存在，请重新登录", 1, 401)
        }
        const admin = rows[0]
        if (admin.status !== 1) {
            return req.cc("该账号已被禁用", 1, 403)
        }

        const sql = `SELECT m.id, m.parent_id, m.menu_type, m.menu_name, m.route_name, m.path,
                            m.component, m.redirect, m.icon, m.frame_src, m.sort,
                            m.visible, m.keep_alive, m.always_show
                     FROM admin_role_menus rm
                     JOIN admin_menus m ON m.id = rm.menu_id
                     WHERE rm.role_id = ? AND m.status = 1 AND m.menu_type IN (1, 2)
                     ORDER BY m.sort ASC, m.id ASC`
        db.query(sql, [admin.role_id], (err2, menus) => {
            if (err2) {
                console.error("查询管理员菜单失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            res.send({ status: 0, msg: "获取成功", data: buildRouteTree(menus) })
        })
    })
}

// 格式化时间为 yyyy/MM/dd HH:mm:ss（服务器本地时区）
function formatDateTime(ms) {
    const d = new Date(ms)
    const pad = (n) => String(n).padStart(2, "0")
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// access token 有效期 8 小时
const ACCESS_EXPIRES_SECONDS = 8 * 60 * 60
// refresh token 有效期 7 天，过期后必须重新登录
const REFRESH_EXPIRES_DAYS = 7

// 签发 access token
function issueAccessToken(admin) {
    const payload = {
        id: admin.id,
        username: admin.username,
        role_id: admin.role_id,
        role_level: admin.role_level,
        scope: "admin",
    }
    return {
        token: jwt.sign(payload, secretkey, { expiresIn: ACCESS_EXPIRES_SECONDS }),
        expires: formatDateTime(Date.now() + ACCESS_EXPIRES_SECONDS * 1000),
    }
}

// refresh token 只存 sha256 摘要：数据库泄露也拿不到可用的原始 token
function hashRefreshToken(raw) {
    return crypto.createHash("sha256").update(raw).digest("hex")
}

function createRefreshToken(adminId, cb) {
    const raw = crypto.randomBytes(48).toString("hex")
    const expiresMs = Date.now() + REFRESH_EXPIRES_DAYS * 24 * 3600 * 1000
    db.query(
        "INSERT INTO admin_refresh_tokens (admin_id, token_hash, expires_at) VALUES (?,?,?)",
        [adminId, hashRefreshToken(raw), new Date(expiresMs)],
        (err) => {
            if (err) return cb(err)
            cb(null, { refresh_token: raw, refresh_expires: formatDateTime(expiresMs) })
        }
    )
}

// B 端管理员登录
module.exports.login = (req, res) => {
    const { username, password } = req.body
    const sql = `SELECT a.id, a.username, a.password, a.nickname, a.avatar, a.email, a.status,
                        a.role_id, r.role_name, r.role_level
                 FROM admins a
                 LEFT JOIN admin_roles r ON a.role_id = r.id
                 WHERE a.username = ?`
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("管理员登录查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        // 账号不存在与密码错误统一提示，避免泄露账号是否存在
        if (results.length !== 1) {
            return req.cc("用户名或密码错误")
        }
        const admin = results[0]
        const compareResult = bcrypt.compareSync(password, admin.password)
        if (!compareResult) {
            return req.cc("用户名或密码错误")
        }
        if (admin.status !== 1) {
            return req.cc("该账号已被禁用", 1, 403)
        }

        // 查询该角色拥有的权限，供前端做动态路由与按钮级权限控制
        const permSql = `SELECT p.perm_code, p.perm_name, p.type
                         FROM admin_role_permissions rp
                         JOIN admin_permissions p ON rp.perm_id = p.id
                         WHERE rp.role_id = ?
                         ORDER BY p.id`
        db.query(permSql, [admin.role_id], (err2, perms) => {
            if (err2) {
                console.error("查询管理员权限失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            const permissions = perms.map((p) => p.perm_code)
            const access = issueAccessToken(admin)

            // 记录最后登录时间与 IP（失败不影响登录结果）
            db.query(
                "UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?",
                [req.ip || null, admin.id],
                (err3) => { if (err3) console.error("更新管理员登录信息失败:", err3) }
            )

            // 登录同时下发 refresh token；创建失败不阻断登录，前端重新登录即可
            createRefreshToken(admin.id, (errR, rt) => {
                if (errR) console.error("创建 refresh token 失败:", errR)
                res.send({
                    status: 0,
                    msg: "登录成功",
                    data: {
                        token: access.token,
                        expires: access.expires,
                        refreshToken: rt ? rt.refresh_token : null,
                        refreshExpires: rt ? rt.refresh_expires : null,
                        id: admin.id,
                        username: admin.username,
                        nickname: admin.nickname || admin.username,
                        avatar: admin.avatar || null,
                        email: admin.email || null,
                        role_id: admin.role_id,
                        role_name: admin.role_name || "",
                        role_level: admin.role_level,
                        permissions,
                        permission_details: perms,
                    },
                })
            })
        })
    })
}

// 刷新 access token：用 refresh_token 换新的一对 token（旧的 refresh token 立即作废）
module.exports.refreshToken = (req, res) => {
    // 前端模板传的是 camelCase 的 refreshToken，同时兼容 refresh_token
    const body = req.body || {}
    const raw = String(body.refreshToken || body.refresh_token || "").trim()
    if (!raw) return req.cc("请提供 refresh_token", 1, 400)

    const sql = `SELECT t.id, t.admin_id, t.expires_at,
                        a.id AS aid, a.username, a.status, a.role_id,
                        r.role_level
                 FROM admin_refresh_tokens t
                 JOIN admins a ON a.id = t.admin_id
                 LEFT JOIN admin_roles r ON r.id = a.role_id
                 WHERE t.token_hash = ?`
    db.query(sql, [hashRefreshToken(raw)], (err, rows) => {
        if (err) {
            console.error("查询 refresh token 失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("refresh_token 无效，请重新登录", 1, 401)

        const row = rows[0]
        if (new Date(row.expires_at).getTime() <= Date.now()) {
            db.query("DELETE FROM admin_refresh_tokens WHERE id = ?", [row.id], (e) => {
                if (e) console.error("清理过期 refresh token 失败:", e)
            })
            return req.cc("refresh_token 已过期，请重新登录", 1, 401)
        }
        if (row.status !== 1) return req.cc("该账号已被禁用", 1, 403)

        // 旋转：先删旧的再发新的。并发重复使用时，只有一个请求能成功
        db.query("DELETE FROM admin_refresh_tokens WHERE id = ?", [row.id], (errDel) => {
            if (errDel) {
                console.error("作废旧 refresh token 失败:", errDel)
                return req.cc("服务器异常", 1, 500)
            }
            // 顺手清理全表过期记录，避免表无限增长
            db.query("DELETE FROM admin_refresh_tokens WHERE expires_at < NOW()", (e) => {
                if (e) console.error("清理过期 refresh token 失败:", e)
            })

            const access = issueAccessToken({
                id: row.aid,
                username: row.username,
                role_id: row.role_id,
                role_level: row.role_level,
            })
            createRefreshToken(row.admin_id, (errR, rt) => {
                if (errR) {
                    console.error("刷新时创建 refresh token 失败:", errR)
                    return req.cc("服务器异常", 1, 500)
                }
                // 响应结构对齐前端 RefreshTokenResult；
                // 前端类型里写的是 refreshtoken，但 setToken() 实际读 refreshToken，
                // 两个都返回，避免刷新后刷新令牌丢失
                res.send({
                    success: true,
                    data: {
                        token: access.token,
                        refreshToken: rt.refresh_token,
                        refreshtoken: rt.refresh_token,
                        expires: access.expires,
                    },
                })
            })
        })
    })
}

// ============ B 端：帖子巡查列表（分页） ============

// 列表状态：由「举报记录」实时推导，不直接取 posts.report_status，
// 避免那个持久化字段和真实举报记录不同步（原设计就存在这个隐患）
// 推导优先级：有待处理举报 -> 待受理；否则累计举报 >= 2 -> 多人举报；否则 1 条 -> 已受理；否则 正常
const POST_STATUS_TEXT = {
    normal: "正常",
    pending: "待受理",
    accepted: "已受理",
    multi_reported: "多人举报",
    offline: "已下架",
}

module.exports.postList = (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size) || 12, 1), 50)
    const offset = (page - 1) * size
    const keyword = String(req.query.keyword || "").trim()
    const status = String(req.query.status || "").trim()
    const author = String(req.query.author || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()
    const date = String(req.query.date || "").trim()

    // 同一举报人对同一帖子只会有一行(post_reports 有 uk_post_user)，
    // 所以 COUNT(*) 等于「被多少个不同用户举报过」
    const HAS_REPORT = "EXISTS (SELECT 1 FROM post_reports r WHERE r.post_id = p.id)"
    const PENDING_REPORT = "EXISTS (SELECT 1 FROM post_reports r WHERE r.post_id = p.id AND r.status = 0)"
    const REPORT_COUNT = "(SELECT COUNT(*) FROM post_reports r WHERE r.post_id = p.id)"
    const STATUS_WHERE = {
        normal: `NOT ${HAS_REPORT}`,
        pending: PENDING_REPORT,
        accepted: `NOT ${PENDING_REPORT} AND ${REPORT_COUNT} = 1`,
        multi_reported: `NOT ${PENDING_REPORT} AND ${REPORT_COUNT} >= 2`,
    }

    // ---- 参数校验：非法值宁可报错，也不静默忽略 ----
    // 静默忽略会让管理员以为筛选生效了，实际拿到的是全量数据
    // status=all 表示不按状态过滤（和"不传 status"等价，便于前端下拉框直接传值）
    if (status && status !== "all" && !STATUS_WHERE[status]) {
        return req.cc("status 只能是 all / normal / pending / accepted / multi_reported", 1, 400)
    }
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) {
        return req.cc("start_date 不能晚于 end_date", 1, 400)
    }

    // 只看「作者未删除 && 未被下架」的帖子，也就是 B 端认为仍在显示中的
    // 作者、状态、创建时间三个条件可以任意组合，未传就不参与筛选
    const conditions = ["p.status = 1", "p.report_status <> 3"]
    const params = []
    if (keyword) {
        conditions.push("p.content LIKE CONCAT('%', ?, '%')")
        params.push(keyword)
    }
    if (author) {
        // 按作者昵称模糊搜索；匿名帖的 username 在前端被替换成"匿名用户"，所以搜不到
        conditions.push("u.username LIKE CONCAT('%', ?, '%')")
        params.push(author)
    }
    if (STATUS_WHERE[status]) conditions.push(STATUS_WHERE[status])
    if (date) {
        // date 表示「就是这一天」，单选日期控件只用传这一个参数
        conditions.push("p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)")
        params.push(date + " 00:00:00", date)
    } else {
        if (startDate) {
            conditions.push("p.created_at >= ?")
            params.push(startDate + " 00:00:00")
        }
        if (endDate) {
            // 用「< 次日 0 点」而不是「<= 当日 23:59:59」，避免漏掉 23:59:59.5 这种毫秒数据
            conditions.push("p.created_at < DATE_ADD(?, INTERVAL 1 DAY)")
            params.push(endDate)
        }
    }

    // 作者条件要查 u.username，所以计数查询也必须带上同一个 JOIN
    const FROM = "FROM posts p LEFT JOIN userinfo u ON p.user_id = u.id"
    const where = "WHERE " + conditions.join(" AND ")

    db.query(`SELECT COUNT(*) AS total ${FROM} ${where}`, params, (errC, counts) => {
        if (errC) {
            console.error("查询帖子总数失败:", errC)
            return req.cc("服务器异常", 1, 500)
        }
        const total = counts[0] ? counts[0].total : 0

        const sql = `SELECT p.id, p.category, p.is_anonymous, u.username,
                            DATE_FORMAT(p.created_at, '%Y-%c-%e') AS date,
                            ${REPORT_COUNT} AS report_count,
                            (SELECT COUNT(*) FROM post_reports r WHERE r.post_id = p.id AND r.status = 0) AS pending_count
                     ${FROM}
                     ${where}
                     ORDER BY pending_count DESC, p.created_at DESC, p.id DESC
                     LIMIT ? OFFSET ?`
        db.query(sql, params.concat([size, offset]), (err, rows) => {
            if (err) {
                console.error("查询帖子巡查列表失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            const list = rows.map((row) => {
                const reportCount = Number(row.report_count) || 0
                const pendingCount = Number(row.pending_count) || 0
                const code = pendingCount > 0
                    ? "pending"
                    : reportCount >= 2
                        ? "multi_reported"
                        : reportCount === 1 ? "accepted" : "normal"
                return {
                    id: row.id,
                    type: row.category || "日常",
                    author: row.is_anonymous ? "匿名用户" : row.username,
                    date: row.date,
                    status: code,
                    status_text: POST_STATUS_TEXT[code],
                    report_count: reportCount,
                    pending_count: pendingCount,
                }
            })
            res.send({
                status: 0,
                msg: "查询成功",
                data: { list, page, size, total, hasMore: offset + size < total },
            })
        })
    })
}

// ============ B 端：帖子详情 ============

// 详情比列表多一个 offline（已下架）状态：详情要能看完整状态，
// 列表接口只返回仍在显示的帖子，所以列表不会出现 offline。
// 已下架只能看 posts.report_status（管理员处置结果），不能靠举报记录推导
function detailStatusCode(reportStatus, reportCount, pendingCount) {
    if (reportStatus === 3) return "offline"
    if (pendingCount > 0) return "pending"
    if (reportCount >= 2) return "multi_reported"
    if (reportCount === 1) return "accepted"
    return "normal"
}

module.exports.postDetail = (req, res) => {
    // Number('12abc') 是 NaN，parseInt('12abc') 却是 12，会把错误参数当成合法 id 去查
    const postId = Number(req.params.id)
    if (!Number.isInteger(postId) || postId < 1) return req.cc("帖子 id 不合法", 1, 400)

    // 详情不限制帖子状态：作者已删除、已下架也要能查得到，否则管理员点开链接会看不到
    const sql = `SELECT p.id, p.category, p.content, p.images, p.tags,
                        p.is_public, p.is_anonymous, p.view_count, p.like_count, p.comment_count,
                        p.status, p.report_status, p.offline_reason, p.created_at,
                        DATE_FORMAT(p.created_at, '%Y-%c-%e') AS date,
                        u.username, u.avatar,
                        (SELECT COUNT(*) FROM post_reports r WHERE r.post_id = p.id) AS report_count,
                        (SELECT COUNT(*) FROM post_reports r WHERE r.post_id = p.id AND r.status = 0) AS pending_count
                 FROM posts p
                 LEFT JOIN userinfo u ON p.user_id = u.id
                 WHERE p.id = ?`
    db.query(sql, [postId], (err, rows) => {
        if (err) {
            console.error("查询帖子详情失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("帖子不存在", 1, 404)

        const row = rows[0]
        const reportCount = Number(row.report_count) || 0
        const pendingCount = Number(row.pending_count) || 0
        const code = detailStatusCode(row.report_status, reportCount, pendingCount)

        res.send({
            status: 0,
            msg: "查询成功",
            data: {
                id: row.id,
                type: row.category || "日常",
                author: row.is_anonymous ? "匿名用户" : row.username,
                // 匿名帖不返回真实头像，否则等于绕过 user:view 权限泄露作者身份
                avatar: row.is_anonymous ? null : (row.avatar || null),
                is_anonymous: row.is_anonymous,
                content: row.content || "",
                images: typeof row.images === "string" ? JSON.parse(row.images) : (row.images || []),
                tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
                view_count: row.view_count || 0,
                like_count: row.like_count || 0,
                comment_count: row.comment_count || 0,
                is_public: row.is_public,
                // 作者是否已删除该帖子（列表接口会过滤掉，详情要能看到）
                is_deleted: row.status !== 1,
                // 仅已下架的帖子有值：下架理由（普通帖子为 null）
                offline_reason: row.offline_reason || null,
                date: row.date,
                created_at: formatDateTime(row.created_at),
                status: code,
                status_text: POST_STATUS_TEXT[code],
                report_count: reportCount,
                pending_count: pendingCount,
            },
        })
    })
}

// ============ B 端：待处理举报列表（按帖子聚合） ============
// 举报状态：0 待处理 / 1 已处理
const REPORT_STATUS = { 0: "pending", 1: "done" }
const REPORT_STATUS_TEXT = { 0: "待处理", 1: "已处理" }

// 一个帖子一条记录，reports 里放这个帖子当前所有待处理举报
// 前端按帖子处理，处理一次就能收尾这个帖子下的全部举报
module.exports.pendingReportList = (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size) || 12, 1), 50)
    const offset = (page - 1) * size

    // 按举报数量筛选：report_count=N 表示只看「待处理举报条数 >= N」的帖子
    // 前端传 null / 空串 / 不传 都视为不筛选（axios 有时会把 null 拼成字符串 "null"）
    let reportCount = null
    const rawCount = String(req.query.report_count ?? "").trim()
    if (rawCount && rawCount !== "null" && rawCount !== "undefined") {
        if (!/^\d+$/.test(rawCount) || Number(rawCount) < 1) {
            return req.cc("report_count 必须是大于 0 的整数", 1, 400)
        }
        reportCount = Number(rawCount)
    }

    // 按举报提交时间筛选：date 表示「就是这一天」；start_date/end_date 表示区间
    // 同时传 date 和区间时以 date 为准（和帖子列表的规则保持一致）
    const date = String(req.query.date || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) {
        return req.cc("start_date 不能晚于 end_date", 1, 400)
    }

    // 时间条件作用在「举报记录」上：筛选某天提交的举报时，
    // 聚合出来的 report_count / reports 也只看该时间范围内的举报，口径保持一致
    const dateConds = []
    const dateParams = []
    if (date) {
        dateConds.push("r.create_at >= ? AND r.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
        dateParams.push(date + " 00:00:00", date)
    } else {
        if (startDate) {
            dateConds.push("r.create_at >= ?")
            dateParams.push(startDate + " 00:00:00")
        }
        if (endDate) {
            dateConds.push("r.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
            dateParams.push(endDate)
        }
    }
    const DATE_WHERE = dateConds.map((c) => " AND " + c).join("")

    // 作者已删除的帖子不进入队列（已经没有可处置的对象）
    const FROM = `FROM post_reports r
                  JOIN posts p ON p.id = r.post_id
                  WHERE r.status = 0 AND p.status = 1${DATE_WHERE}`
    // 聚合后的条数过滤，必须放在 HAVING 里（WHERE 阶段还没统计出条数）
    const HAVING = reportCount ? " HAVING COUNT(*) >= ?" : ""
    const havingParams = reportCount ? [reportCount] : []

    // 分页单位是「帖子」：先按 post_id 聚合，再对结果计数，
    // 否则 HAVING 过滤后的总数会算错
    const countSql = `SELECT COUNT(*) AS total FROM (
                          SELECT r.post_id ${FROM} GROUP BY r.post_id${HAVING}
                      ) t`
    db.query(countSql, [...dateParams, ...havingParams], (errC, counts) => {
        if (errC) {
            console.error("查询待处理举报总数失败:", errC)
            return req.cc("服务器异常", 1, 500)
        }
        const total = counts[0] ? counts[0].total : 0

        // 先来先处理：按这个帖子「最早一条举报」的时间排序
        const sql = `SELECT r.post_id, p.category AS post_type,
                            COUNT(*) AS report_count,
                            MIN(r.create_at) AS first_report_at,
                            MAX(r.create_at) AS last_report_at
                     ${FROM}
                     GROUP BY r.post_id, p.category${HAVING}
                     ORDER BY first_report_at ASC, r.post_id ASC
                     LIMIT ? OFFSET ?`
        db.query(sql, [...dateParams, ...havingParams, size, offset], (err, posts) => {
            if (err) {
                console.error("查询待处理举报帖子失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (posts.length === 0) {
                return res.send({
                    status: 0,
                    msg: "查询成功",
                    data: { list: [], page, size, total, hasMore: false },
                })
            }

            // 再一次性把这个页的所有举报查出来，在内存里按 post_id 分组，避免 N+1 查询
            const postIds = posts.map((p) => p.post_id)
            db.query(
                `SELECT r.id, r.post_id, r.username, r.reasons, r.description, r.status, r.create_at
                 FROM post_reports r
                 WHERE r.post_id IN (?) AND r.status = 0${DATE_WHERE}
                 ORDER BY r.create_at ASC, r.id ASC`,
                [postIds, ...dateParams],
                (err2, reports) => {
                    if (err2) {
                        console.error("查询帖子举报明细失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }

                    const grouped = new Map()
                    reports.forEach((row) => {
                        if (!grouped.has(row.post_id)) grouped.set(row.post_id, [])
                        grouped.get(row.post_id).push({
                            id: row.id,
                            reporter: row.username || "未知用户",
                            reasons: notify.parseReasons(row.reasons),
                            description: row.description || "",
                            status: REPORT_STATUS[row.status] || "pending",
                            status_text: REPORT_STATUS_TEXT[row.status] || "待处理",
                            created_at: formatDateTime(row.create_at),
                        })
                    })

                    const list = posts.map((post) => ({
                        post_id: post.post_id,
                        post_type: post.post_type || "日常",
                        status: "pending",
                        status_text: "待处理",
                        report_count: Number(post.report_count) || 0,
                        first_report_at: formatDateTime(post.first_report_at),
                        last_report_at: formatDateTime(post.last_report_at),
                        reports: grouped.get(post.post_id) || [],
                    }))

                    res.send({
                        status: 0,
                        msg: "查询成功",
                        data: { list, page, size, total, hasMore: offset + size < total },
                    })
                }
            )
        })
    })
}

// ============ B 端：举报处理 ============

// 举报处理页：驳回某帖的全部待处理举报（核实后认为内容不违规）
// 驳回理由作为统一回复写入每条举报，并通知每个举报人
module.exports.rejectPostReports = (req, res) => {
    const body = req.body || {}
    const idCheck = parseId(body.post_id, "帖子 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const reasonCheck = parseReason(body.reason, "驳回理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const postId = idCheck.id
    const reason = reasonCheck.reason

    // 先查出待处理举报（通知要用举报人信息），再统一置为已处理
    db.query(
        "SELECT id, user_id, reasons FROM post_reports WHERE post_id = ? AND status = 0",
        [postId],
        (err, rows) => {
            if (err) {
                console.error("查询待驳回举报失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (rows.length === 0) return req.cc("该帖子暂无待处理举报，无需驳回", 1, 400)
            const reports = rows

            db.query(
                `UPDATE post_reports
                 SET status = 1, handle_at = NOW(3), handle_result = ?, handle_by = ?
                 WHERE post_id = ? AND status = 0`,
                [reason, String(req.admin.username).slice(0, 50), postId],
                (errUpd) => {
                    if (errUpd) {
                        console.error("驳回举报失败:", errUpd)
                        return req.cc("服务器异常", 1, 500)
                    }

                    // 驳回表示举报不成立，is_success 传 0，前端据此区分「已下架」和「未违规」
                    reports.forEach((r) => {
                        notify.createNotification({
                            user_id: r.user_id,
                            type: "report_result",
                            actor_id: 0,
                            actor_name: "系统",
                            actor_avatar: null,
                            content: "你举报的内容经核实未违规，感谢你的反馈",
                            target_id: postId,
                            post_id: postId,
                            reasons: notify.parseReasons(r.reasons),
                            handle_result: reason,
                            is_success: 0,
                            role: "reporter",
                        })
                    })

                    res.send({
                        status: 0,
                        msg: "已驳回该帖全部举报",
                        data: {
                            post_id: postId,
                            handled_report_count: reports.length,
                            handle_result: reason,
                        },
                    })
                }
            )
        }
    )
}

// 举报处理记录：只查已处理（status = 1）的举报，按帖子聚合给管理员回看
// 帖子可能已删除/已下架，记录要保留，所以这里不限制 p.status
module.exports.reportRecordList = (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size) || 12, 1), 50)
    const offset = (page - 1) * size
    const date = String(req.query.date || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()

    // 筛选的是「举报处理时间」，不是举报提交时间
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) {
        return req.cc("start_date 不能晚于 end_date", 1, 400)
    }

    const dateConditions = []
    const dateParams = []
    if (date) {
        // date 表示「就是这一天」，单选日期控件只传这一个参数
        dateConditions.push("r.handle_at >= ? AND r.handle_at < DATE_ADD(?, INTERVAL 1 DAY)")
        dateParams.push(date + " 00:00:00", date)
    } else {
        if (startDate) {
            dateConditions.push("r.handle_at >= ?")
            dateParams.push(startDate + " 00:00:00")
        }
        if (endDate) {
            dateConditions.push("r.handle_at < DATE_ADD(?, INTERVAL 1 DAY)")
            dateParams.push(endDate)
        }
    }
    const DATE_WHERE = dateConditions.length ? " AND " + dateConditions.join(" AND ") : ""

    const FROM = `FROM post_reports r
                  JOIN posts p ON p.id = r.post_id
                  WHERE r.status = 1 AND r.record_deleted = 0${DATE_WHERE}`

    db.query(`SELECT COUNT(DISTINCT r.post_id) AS total ${FROM}`, dateParams, (errC, counts) => {
        if (errC) {
            console.error("查询举报记录总数失败:", errC)
            return req.cc("服务器异常", 1, 500)
        }
        const total = counts[0] ? counts[0].total : 0

        // 最近处理的排前面
        const sql = `SELECT r.post_id, p.category AS post_type,
                            COUNT(*) AS report_count,
                            MAX(r.handle_at) AS handled_at
                     ${FROM}
                     GROUP BY r.post_id, p.category
                     ORDER BY handled_at DESC, r.post_id DESC
                     LIMIT ? OFFSET ?`
        db.query(sql, [...dateParams, size, offset], (err, posts) => {
            if (err) {
                console.error("查询举报记录失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (posts.length === 0) {
                return res.send({
                    status: 0,
                    msg: "查询成功",
                    data: { list: [], page, size, total, hasMore: false },
                })
            }

            const postIds = posts.map((p) => p.post_id)
            db.query(
                `SELECT r.id, r.post_id, r.username, r.reasons, r.description,
                        r.handle_result, r.handle_at, r.create_at
                 FROM post_reports r
                 WHERE r.post_id IN (?) AND r.status = 1 AND r.record_deleted = 0${DATE_WHERE}
                 ORDER BY r.handle_at ASC, r.id ASC`,
                [postIds, ...dateParams],
                (err2, rows) => {
                    if (err2) {
                        console.error("查询举报记录明细失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }

                    const grouped = new Map()
                    rows.forEach((row) => {
                        if (!grouped.has(row.post_id)) grouped.set(row.post_id, [])
                        grouped.get(row.post_id).push(row)
                    })

                    const list = posts.map((post) => {
                        const items = grouped.get(post.post_id) || []
                        // 同一帖可能被处理过多轮，取最后一次的驳回/下架理由作为统一结果
                        let handleResult = "无"
                        for (let i = items.length - 1; i >= 0; i--) {
                            const v = String(items[i].handle_result || "").trim()
                            if (v) { handleResult = v; break }
                        }
                        return {
                            post_id: post.post_id,
                            post_type: post.post_type || "日常",
                            report_count: Number(post.report_count) || 0,
                            handle_result: handleResult,
                            handled_at: post.handled_at ? formatDateTime(post.handled_at) : "无",
                            reports: items.map((row) => ({
                                id: row.id,
                                reporter: row.username || "未知用户",
                                reasons: notify.parseReasons(row.reasons),
                                description: row.description || "",
                                created_at: formatDateTime(row.create_at),
                            })),
                        }
                    })

                    res.send({
                        status: 0,
                        msg: "查询成功",
                        data: { list, page, size, total, hasMore: offset + size < total },
                    })
                }
            )
        })
    })
}

// 删除举报处理记录：软删除（只置 record_deleted），举报数据本身保留，
// 避免 C 端「我的举报」历史和通知关联凭空消失
// 批量接口同时覆盖「删单条」和「删一页」：
//   删单条传 1 个 post_id；删一页传当前页列表里的全部 post_id
module.exports.deleteReportRecords = (req, res) => {
    const body = req.body || {}
    const raw = body.post_ids
    if (!Array.isArray(raw) || raw.length === 0) return req.cc("请提供 post_ids", 1, 400)
    if (raw.length > 100) return req.cc("一次最多删除 100 条记录", 1, 400)

    const postIds = []
    for (const v of raw) {
        const n = Number(v)
        if (!Number.isInteger(n) || n < 1) return req.cc("post_ids 只能包含正整数", 1, 400)
        if (!postIds.includes(n)) postIds.push(n)
    }

    db.query(
        `SELECT COUNT(DISTINCT post_id) AS posts, COUNT(*) AS reports
         FROM post_reports
         WHERE status = 1 AND record_deleted = 0 AND post_id IN (?)`,
        [postIds],
        (err, rows) => {
            if (err) {
                console.error("查询待删除记录失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            const stat = rows[0] || {}
            if (!Number(stat.reports)) return req.cc("所选记录不存在或已删除", 1, 400)

            db.query(
                `UPDATE post_reports SET record_deleted = 1
                 WHERE status = 1 AND record_deleted = 0 AND post_id IN (?)`,
                [postIds],
                (errUpd) => {
                    if (errUpd) {
                        console.error("删除举报记录失败:", errUpd)
                        return req.cc("服务器异常", 1, 500)
                    }
                    res.send({
                        status: 0,
                        msg: "删除成功",
                        data: {
                            deleted_count: Number(stat.posts) || 0,
                            deleted_report_count: Number(stat.reports) || 0,
                        },
                    })
                }
            )
        }
    )
}

// 清空全部举报处理记录（同样软删除）
module.exports.clearReportRecords = (req, res) => {
    db.query(
        `SELECT COUNT(DISTINCT post_id) AS posts, COUNT(*) AS reports
         FROM post_reports WHERE status = 1 AND record_deleted = 0`,
        (err, rows) => {
            if (err) {
                console.error("查询待清空记录失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            const stat = rows[0] || {}
            // 已经是空的就直接返回 0，保持幂等，前端不用额外判断
            if (!Number(stat.reports)) {
                return res.send({
                    status: 0,
                    msg: "暂无可删除的记录",
                    data: { deleted_count: 0, deleted_report_count: 0 },
                })
            }

            db.query(
                "UPDATE post_reports SET record_deleted = 1 WHERE status = 1 AND record_deleted = 0",
                (errUpd) => {
                    if (errUpd) {
                        console.error("清空举报记录失败:", errUpd)
                        return req.cc("服务器异常", 1, 500)
                    }
                    res.send({
                        status: 0,
                        msg: "已清空全部举报处理记录",
                        data: {
                            deleted_count: Number(stat.posts) || 0,
                            deleted_report_count: Number(stat.reports) || 0,
                        },
                    })
                }
            )
        }
    )
}

// ============ B 端：下架申请 / 审批 ============

// 申请状态：0 待处理 / 1 处理完成（帖子已下架） / 2 已驳回（帖子保留）
//         3 已撤销（申请人自己撤回） / 4 申诉中（申请人对驳回结果申诉）
// 对外统一返回英文枚举 + 中文文案，英文和列表筛选参数 status 的取值保持一致
const APPLICATION_STATUS = { 0: "pending", 1: "done", 2: "rejected", 3: "cancelled", 4: "appealing" }
const APPLICATION_STATUS_TEXT = { 0: "待处理", 1: "处理完成", 2: "已驳回", 3: "已撤销", 4: "申诉中" }

// 理由最多 50 个字：用 [...str].length 按码点计数，
// 避免 emoji（占 2 个 UTF-16 单元）被算成 2 个字
function parseReason(raw, label) {
    const reason = String(raw === undefined || raw === null ? "" : raw).trim()
    if (!reason) return { error: "请填写" + label }
    if ([...reason].length > 50) return { error: label + "最多 50 个字" }
    return { reason }
}

function parseId(raw, label) {
    const id = Number(raw)
    if (!Number.isInteger(id) || id < 1) return { error: label + " 不合法" }
    return { id }
}

// 下架通知：帖子作者 + 举报过该帖的人
// actor_id 固定传 0：管理员 id 和用户 id 是两套自增，可能撞号，
// 撞号时 notify 会误判成「自己操作自己」而不发通知
function sendOfflineNotifications(authorId, postId, reason, reports) {
    notify.createNotification({
        user_id: authorId,
        type: "post_offline",
        actor_id: 0,
        actor_name: "系统",
        actor_avatar: null,
        content: "你的帖子因违规被下架",
        target_id: postId,
        post_id: postId,
        reasons: reports.length > 0 ? notify.parseReasons(reports[0].reasons) : null,
        handle_result: reason,
        is_success: 1,
        role: "author",
    })
    reports.forEach((r) => {
        notify.createNotification({
            user_id: r.user_id,
            type: "report_result",
            actor_id: 0,
            actor_name: "系统",
            actor_avatar: null,
            content: "你举报的内容已被下架，感谢你的反馈",
            target_id: postId,
            post_id: postId,
            reasons: notify.parseReasons(r.reasons),
            handle_result: reason,
            is_success: 1,
            role: "reporter",
        })
    })
}

// 下架申请的公共流程。
// closeReports=false：帖子管理页发起，举报保持待处理，等审批通过（或直接下架）才收尾；
// closeReports=true：举报处理页发起，提交即把该帖待处理举报置为处理完成，驳回也不回滚
function createOfflineApplication(req, res, postId, reason, closeReports) {
    db.query(
        `SELECT p.id, p.status, p.report_status,
                (SELECT COUNT(*) FROM post_offline_applications a
                 WHERE a.post_id = p.id AND a.status IN (0, 4)) AS active_applications
         FROM posts p WHERE p.id = ?`,
        [postId],
        (err, rows) => {
            if (err) {
                console.error("查询待申请帖子失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (rows.length === 0) return req.cc("帖子不存在", 1, 404)
            const post = rows[0]
            // 作者已删除的帖子 C 端本来就看不到，没有下架意义
            if (post.status !== 1) return req.cc("帖子已被作者删除，无需下架", 1, 400)
            if (post.report_status === 3) return req.cc("该帖子已下架，无需申请", 1, 400)
            // 待处理或申诉中都不允许再提一条，否则同一帖子会有两条并行流转
            if (Number(post.active_applications) > 0) {
                return req.cc("该帖子已有待处理或申诉中的申请，请勿重复提交", 1, 400)
            }

            db.query(
                "INSERT INTO post_offline_applications (post_id, applicant_id, apply_reason) VALUES (?,?,?)",
                [postId, req.admin.id, reason],
                (err2, result) => {
                    if (err2) {
                        // uk_pending_post 唯一索引冲突：该帖子已有待处理申请
                        if (err2.code === "ER_DUP_ENTRY") {
                            return req.cc("该帖子已有待处理的下架申请，请勿重复提交", 1, 400)
                        }
                        console.error("提交下架申请失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }
                    const applicationId = result.insertId

                    // 只有举报处理页那条路径才带 handled_report_count，帖子页不需要关心举报
                    const respond = (handledCount) => {
                        const data = {
                            id: applicationId,
                            post_id: postId,
                            apply_reason: reason,
                            status: APPLICATION_STATUS[0],
                            status_text: APPLICATION_STATUS_TEXT[0],
                        }
                        if (handledCount !== null) data.handled_report_count = handledCount
                        res.send({ status: 0, msg: "下架申请已提交，等待二级及以上管理员审批", data })
                    }

                    if (!closeReports) return respond(null)

                    // 举报处理页发起：直接把该帖待处理举报统一置为「处理完成」。
                    // offline_application_id 记录收尾来源，审批通过时据此补发举报人通知
                    db.query(
                        `UPDATE post_reports
                         SET status = 1, handle_at = NOW(3), handle_result = '已提交下架申请，等待审批',
                             handle_by = ?, offline_application_id = ?
                         WHERE post_id = ? AND status = 0`,
                        [String(req.admin.username).slice(0, 50), applicationId, postId],
                        (errRep, upd) => {
                            if (errRep) console.error("提交申请后标记举报已处理失败:", errRep)
                            respond(errRep ? 0 : upd.affectedRows)
                        }
                    )
                }
            )
        }
    )
}

// 帖子管理页：一级管理员提交下架申请（举报保持待处理，审批通过后统一下架收尾）
module.exports.offlineApply = (req, res) => {
    const idCheck = parseId(req.params.id, "帖子 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const reasonCheck = parseReason(req.body && req.body.reason, "下架理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    createOfflineApplication(req, res, idCheck.id, reasonCheck.reason, false)
}

// 举报处理页：一级管理员处理某帖的举报时直接提交下架申请
// 提交即把该帖待处理举报置为处理完成，之后即使申请被驳回也保持处理完成
module.exports.reportOfflineApply = (req, res) => {
    const idCheck = parseId(req.body && req.body.post_id, "帖子 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const reasonCheck = parseReason(req.body && req.body.reason, "下架理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    createOfflineApplication(req, res, idCheck.id, reasonCheck.reason, true)
}

// 二级及以上：直接下架帖子；同时把该帖子所有待处理申请标记为「处理完成」
module.exports.offlinePost = (req, res) => {
    const idCheck = parseId(req.params.id, "帖子 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const postId = idCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "下架理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = "SELECT id, user_id, status, report_status, offline_reason FROM posts WHERE id = ?"
    db.query(sql, [postId], (err, rows) => {
        if (err) {
            console.error("查询待下架帖子失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("帖子不存在", 1, 404)
        const post = rows[0]
        if (post.status !== 1) return req.cc("帖子已被作者删除，无需下架", 1, 400)

        // 不管本次是不是第一次下架，都统一收尾待处理申请和待处理举报：
        // 重复点击、或上一次中途失败，都能靠再次调用自愈
        const finish = (alreadyOffline) => {
            db.query(
                `UPDATE post_offline_applications
                 SET status = 1, handle_by = ?, handle_reason = ?, handle_at = NOW()
                 WHERE post_id = ? AND status = 0`,
                [req.admin.id, reason, postId],
                (errApp) => { if (errApp) console.error("标记下架申请完成失败:", errApp) }
            )

            // 先查待处理举报（通知要用举报人信息），再统一标记为已处理
            // 被下架申请提前收尾的举报也要算进来，否则举报人会收不到下架通知
            db.query(
                "SELECT id, user_id, reasons FROM post_reports WHERE post_id = ? AND (status = 0 OR offline_application_id IS NOT NULL)",
                [postId],
                (errRep, reports) => {
                    if (errRep) console.error("查询待处理举报失败:", errRep)
                    const list = errRep ? [] : (reports || [])
                    db.query(
                        `UPDATE post_reports
                         SET status = 1, handle_at = NOW(3), handle_result = ?, handle_by = ?
                         WHERE post_id = ? AND (status = 0 OR offline_application_id IS NOT NULL)`,
                        [reason, String(req.admin.username).slice(0, 50), postId],
                        (errUpd) => {
                            if (errUpd) console.error("标记举报已处理失败:", errUpd)
                            // 只有第一次真正下架才通知：重复点击不能再给作者/举报人发一遍
                            if (!alreadyOffline) sendOfflineNotifications(post.user_id, postId, reason, list)
                            res.send({
                                status: 0,
                                msg: alreadyOffline ? "该帖子已处于下架状态" : "下架成功",
                                data: {
                                    id: postId,
                                    status: "offline",
                                    status_text: POST_STATUS_TEXT.offline,
                                    offline_reason: alreadyOffline ? (post.offline_reason || null) : reason,
                                    already_offline: alreadyOffline,
                                },
                            })
                        }
                    )
                }
            )
        }

        if (post.report_status === 3) return finish(true)

        db.query(
            `UPDATE posts
             SET report_status = 3, offline_reason = ?, offline_by = ?, offline_at = NOW()
             WHERE id = ?`,
            [reason, req.admin.id, postId],
            (errUpd) => {
                if (errUpd) {
                    console.error("下架帖子失败:", errUpd)
                    return req.cc("服务器异常", 1, 500)
                }
                finish(false)
            }
        )
    })
}

// ============ B 端：待审批下架申请（按帖子聚合） ============
// 供二级及以上审批使用。一级提交的申请在表上有 uk_pending_post 唯一索引，
// 同一帖子同时只会有一条待处理申请，但接口仍按帖子聚合，前端表格按帖子渲染，
// 并保留 applications 数组，避免以后允许同一帖子多条申请时再改结构
module.exports.pendingOfflineApplicationList = (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size) || 12, 1), 50)
    const offset = (page - 1) * size

    // apply_count 单值 = 下限（>= N）；区间用 apply_count_min + apply_count_max（闭区间）
    // 三个都传 null / 空串表示不筛选
    const applyCountRaw = String(req.query.apply_count ?? "").trim()
    const applyCountMinRaw = String(req.query.apply_count_min ?? "").trim()
    const applyCountMaxRaw = String(req.query.apply_count_max ?? "").trim()
    const date = String(req.query.date || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()

    const parseCount = (raw) => {
        if (!raw || raw === "null") return null
        const n = parseInt(raw, 10)
        return Number.isInteger(n) && n > 0 ? n : NaN
    }
    const applyCountSingle = parseCount(applyCountRaw)
    const applyCountMin = parseCount(applyCountMinRaw)
    const applyCountMax = parseCount(applyCountMaxRaw)
    if ([["apply_count", applyCountSingle], ["apply_count_min", applyCountMin], ["apply_count_max", applyCountMax]].some(([, v]) => Number.isNaN(v))) {
        return req.cc("apply_count 相关参数必须是大于 0 的整数", 1, 400)
    }
    // 单值和 min 同时传时取较大者（两者都是下限语义）
    const lowerBound = Math.max(applyCountSingle || 0, applyCountMin || 0) || null
    if (lowerBound && applyCountMax && lowerBound > applyCountMax) {
        return req.cc("申请数量下限不能大于上限", 1, 400)
    }
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) {
        return req.cc("start_date 不能晚于 end_date", 1, 400)
    }

    // 时间条件同时用于统计、聚合和明细查询，保证三处口径一致
    const timeConditions = []
    const timeParams = []
    if (date) {
        timeConditions.push("ap.create_at >= ? AND ap.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
        timeParams.push(date + " 00:00:00", date)
    } else {
        if (startDate) {
            timeConditions.push("ap.create_at >= ?")
            timeParams.push(startDate + " 00:00:00")
        }
        if (endDate) {
            timeConditions.push("ap.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
            timeParams.push(endDate)
        }
    }

    const FROM = `FROM post_offline_applications ap
                  JOIN posts p ON p.id = ap.post_id
                  LEFT JOIN userinfo u ON u.id = p.user_id
                  WHERE ap.status = 0${timeConditions.map((c) => " AND " + c).join("")}`
    const havingParts = []
    const havingParams = []
    if (lowerBound) {
        havingParts.push("COUNT(*) >= ?")
        havingParams.push(lowerBound)
    }
    if (applyCountMax) {
        havingParts.push("COUNT(*) <= ?")
        havingParams.push(applyCountMax)
    }
    const HAVING = havingParts.length ? "HAVING " + havingParts.join(" AND ") : ""

    const countSql = `SELECT COUNT(*) AS total
                      FROM (SELECT ap.post_id ${FROM} GROUP BY ap.post_id ${HAVING}) t`
    db.query(countSql, [...timeParams, ...havingParams], (errC, counts) => {
        if (errC) {
            console.error("统计待审批下架申请失败:", errC)
            return req.cc("服务器异常", 1, 500)
        }
        const total = counts[0] ? counts[0].total : 0

        const sql = `SELECT ap.post_id, p.category AS post_type,
                            u.id AS author_id, u.username AS author,
                            COUNT(*) AS apply_count,
                            MIN(ap.create_at) AS first_apply_at,
                            MAX(ap.create_at) AS last_apply_at
                     ${FROM}
                     GROUP BY ap.post_id, p.category, u.id, u.username
                     ${HAVING}
                     ORDER BY first_apply_at ASC, ap.post_id ASC
                     LIMIT ? OFFSET ?`
        db.query(sql, [...timeParams, ...havingParams, size, offset], (err, posts) => {
            if (err) {
                console.error("查询待审批下架申请失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (posts.length === 0) {
                return res.send({
                    status: 0, msg: "查询成功",
                    data: { list: [], page, size, total, hasMore: false },
                })
            }

            const postIds = posts.map((p) => p.post_id)
            const detailWhere = ["ap.post_id IN (?)", "ap.status = 0"]
                .concat(timeConditions)
                .join(" AND ")
            db.query(
                `SELECT ap.id, ap.post_id, ap.applicant_id, ap.apply_reason, ap.create_at,
                        a.nickname, a.username AS applicant_username
                 FROM post_offline_applications ap
                 LEFT JOIN admins a ON a.id = ap.applicant_id
                 WHERE ${detailWhere}
                 ORDER BY ap.create_at ASC, ap.id ASC`,
                [postIds, ...timeParams],
                (err2, rows) => {
                    if (err2) {
                        console.error("查询下架申请明细失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }
                    const grouped = new Map()
                    rows.forEach((row) => {
                        if (!grouped.has(row.post_id)) grouped.set(row.post_id, [])
                        grouped.get(row.post_id).push({
                            id: row.id,
                            applicant_id: row.applicant_id,
                            applicant_name: row.nickname || row.applicant_username || "未知管理员",
                            apply_reason: row.apply_reason || "",
                            status: "pending",
                            status_text: "待处理",
                            created_at: formatDateTime(row.create_at),
                        })
                    })

                    const list = posts.map((post) => ({
                        post_id: post.post_id,
                        post_type: post.post_type || "日常",
                        author_id: post.author_id,
                        author: post.author || "未知用户",
                        apply_count: Number(post.apply_count) || 0,
                        first_apply_at: formatDateTime(post.first_apply_at),
                        last_apply_at: formatDateTime(post.last_apply_at),
                        applications: grouped.get(post.post_id) || [],
                    }))
                    res.send({
                        status: 0, msg: "查询成功",
                        data: { list, page, size, total, hasMore: offset + size < total },
                    })
                }
            )
        })
    })
}

// ============ B 端：下架审批记录（以一次审批动作为主体） ============
// 一条记录 = 一次审批动作：同一帖 + 同一审批人 + 同一时间 + 同一理由的一批申请，
// 因为按帖子批准/驳回会一次性处理该帖全部待处理申请。
// 返回审批结果（只有批准/驳回两种）、理由、时间、本次涉及申请数量、帖子信息、申请明细。
// 待处理(0)、已撤销(3) 不是审批结果，不进入记录。
// 支持按审批时间、审批状态、该帖举报数量筛选
module.exports.offlineApprovalRecordList = (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size) || 12, 1), 50)
    const offset = (page - 1) * size

    const statusRaw = String(req.query.status ?? "").trim().toLowerCase()
    // 审批结果只有两种：approved=批准、rejected=驳回；all / 空 = 不筛选
    const statusMap = { all: null, approved: 1, rejected: "rejected" }
    if (statusRaw && statusMap[statusRaw] === undefined) {
        return req.cc("status 只能是 all / approved / rejected", 1, 400)
    }
    const statusValue = statusMap[statusRaw]
    // 申诉中(4) 源于一次驳回，在审批记录里按驳回展示
    const APPROVAL_RESULT = {
        1: { status: "approved", text: "批准" },
        2: { status: "rejected", text: "驳回" },
        4: { status: "rejected", text: "驳回" },
    }

    // report_count 单值 = 下限（>= N）；区间用 report_count_min + report_count_max
    const parseCount = (raw) => {
        if (!raw || raw === "null") return null
        const n = parseInt(raw, 10)
        return Number.isInteger(n) && n >= 0 ? n : NaN
    }
    const reportCountSingle = parseCount(String(req.query.report_count ?? "").trim())
    const reportCountMin = parseCount(String(req.query.report_count_min ?? "").trim())
    const reportCountMax = parseCount(String(req.query.report_count_max ?? "").trim())
    if ([reportCountSingle, reportCountMin, reportCountMax].some((v) => Number.isNaN(v))) {
        return req.cc("report_count 相关参数必须是不小于 0 的整数", 1, 400)
    }
    // 单值和 min 同时传时取较大者（两者都是下限语义）
    const lowerBound = Math.max(reportCountSingle || 0, reportCountMin || 0) || null
    if (lowerBound !== null && reportCountMax !== null && lowerBound > reportCountMax) {
        return req.cc("举报数量下限不能大于上限", 1, 400)
    }

    // 申请数量筛选：口径与返回的 application_count 一致（这次审批处理的下架申请条数）
    // 单值 = 下限（>= N），区间用 apply_count_min + apply_count_max；兼容 application_count 命名
    const applyCount = parseCount(String(req.query.apply_count ?? req.query.application_count ?? "").trim())
    const applyCountMin = parseCount(String(req.query.apply_count_min ?? req.query.application_count_min ?? "").trim())
    const applyCountMax = parseCount(String(req.query.apply_count_max ?? req.query.application_count_max ?? "").trim())
    if ([applyCount, applyCountMin, applyCountMax].some((v) => Number.isNaN(v))) {
        return req.cc("apply_count 相关参数必须是不小于 0 的整数", 1, 400)
    }
    const applyLower = Math.max(applyCount || 0, applyCountMin || 0) || null
    if (applyLower !== null && applyCountMax !== null && applyLower > applyCountMax) {
        return req.cc("申请数量下限不能大于上限", 1, 400)
    }

    const date = String(req.query.date || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) {
        return req.cc("start_date 不能晚于 end_date", 1, 400)
    }

    // 筛选的是「审批时间」handle_at，不是申请提交时间
    const whereParts = ["ap.record_deleted = 0"]
    const whereParams = []
    if (statusValue === 1) {
        whereParts.push("ap.status = ?")
        whereParams.push(1)
    } else if (statusValue === "rejected") {
        whereParts.push("ap.status IN (2, 4)")
    } else {
        whereParts.push("ap.status IN (1, 2, 4)")
    }
    if (date) {
        whereParts.push("ap.handle_at >= ? AND ap.handle_at < DATE_ADD(?, INTERVAL 1 DAY)")
        whereParams.push(date + " 00:00:00", date)
    } else {
        if (startDate) {
            whereParts.push("ap.handle_at >= ?")
            whereParams.push(startDate + " 00:00:00")
        }
        if (endDate) {
            whereParts.push("ap.handle_at < DATE_ADD(?, INTERVAL 1 DAY)")
            whereParams.push(endDate)
        }
    }
    const WHERE = "WHERE " + whereParts.join(" AND ")

    const havingParts = []
    const havingParams = []
    // COUNT(*) 在「按审批批次分组」下就是本次审批处理的申请数
    if (applyLower !== null) {
        havingParts.push("COUNT(*) >= ?")
        havingParams.push(applyLower)
    }
    if (applyCountMax !== null) {
        havingParts.push("COUNT(*) <= ?")
        havingParams.push(applyCountMax)
    }
    if (lowerBound !== null) {
        havingParts.push("report_count >= ?")
        havingParams.push(lowerBound)
    }
    if (reportCountMax !== null) {
        havingParts.push("report_count <= ?")
        havingParams.push(reportCountMax)
    }
    const HAVING = havingParts.length ? "HAVING " + havingParts.join(" AND ") : ""

    // 每帖举报数：该帖全部未删除的举报（含已处理），筛选与展示共用这一口径
    const REPORT_COUNT = `(SELECT COUNT(*) FROM post_reports pr
                          WHERE pr.post_id = ap.post_id AND pr.record_deleted = 0)`
    // 一条审批记录 = 一次审批动作：同帖 + 同审批人 + 同时间 + 同理由 + 同结果
    const BATCH_GROUP = "ap.post_id, ap.handle_by, ap.handle_at, ap.handle_reason, ap.status"
    const batchKey = (postId, handleBy, handleAt, handleReason) =>
        `${postId}|${handleBy || 0}|${handleAt ? new Date(handleAt).getTime() : 0}|${handleReason || ""}`

    const countSql = `SELECT COUNT(*) AS total
                      FROM (SELECT ap.post_id, ${REPORT_COUNT} AS report_count
                            FROM post_offline_applications ap
                            ${WHERE}
                            GROUP BY ${BATCH_GROUP}
                            ${HAVING}) t`
    db.query(countSql, [...whereParams, ...havingParams], (errC, counts) => {
        if (errC) {
            console.error("统计下架审批记录失败:", errC)
            return req.cc("服务器异常", 1, 500)
        }
        const total = counts[0] ? counts[0].total : 0

        const sql = `SELECT ap.post_id, p.category AS post_type,
                            p.user_id AS author_id, u.username AS author,
                            ap.handle_by, ap.handle_at, ap.handle_reason, ap.status,
                            hd.nickname AS handler_nickname, hd.username AS handler_username,
                            COUNT(*) AS application_count,
                            ${REPORT_COUNT} AS report_count
                     FROM post_offline_applications ap
                     JOIN posts p ON p.id = ap.post_id
                     LEFT JOIN userinfo u ON u.id = p.user_id
                     LEFT JOIN admins hd ON hd.id = ap.handle_by
                     ${WHERE}
                     GROUP BY ap.post_id, p.category, p.user_id, u.username,
                              ap.handle_by, ap.handle_at, ap.handle_reason, ap.status,
                              hd.nickname, hd.username
                     ${HAVING}
                     ORDER BY ap.handle_at DESC, ap.post_id DESC
                     LIMIT ? OFFSET ?`
        db.query(sql, [...whereParams, ...havingParams, size, offset], (err, records) => {
            if (err) {
                console.error("查询下架审批记录失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (records.length === 0) {
                return res.send({
                    status: 0, msg: "查询成功",
                    data: { list: [], page, size, total, hasMore: false },
                })
            }

            const postIds = records.map((r) => r.post_id)
            const detailWhere = "ap.post_id IN (?) AND " + whereParts.join(" AND ")

            // 申请明细：用（帖子 + 审批人 + 审批时间 + 理由）匹配到具体某次审批
            db.query(
                `SELECT ap.id, ap.post_id, ap.applicant_id, ap.apply_reason, ap.status, ap.create_at,
                        ap.handle_by, ap.handle_at, ap.handle_reason,
                        a.nickname AS applicant_nickname, a.username AS applicant_username
                 FROM post_offline_applications ap
                 LEFT JOIN admins a ON a.id = ap.applicant_id
                 WHERE ${detailWhere}
                 ORDER BY ap.handle_at ASC, ap.id ASC`,
                [postIds, ...whereParams],
                (err2, rows) => {
                    if (err2) {
                        console.error("查询审批明细失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }

                    const applicationsByBatch = new Map()
                    rows.forEach((row) => {
                        const key = batchKey(row.post_id, row.handle_by, row.handle_at, row.handle_reason)
                        if (!applicationsByBatch.has(key)) applicationsByBatch.set(key, [])
                        applicationsByBatch.get(key).push({
                            id: row.id,
                            applicant_id: row.applicant_id,
                            applicant_name: row.applicant_nickname || row.applicant_username || "未知管理员",
                            apply_reason: row.apply_reason || "",
                            status: APPROVAL_RESULT[row.status].status,
                            status_text: APPROVAL_RESULT[row.status].text,
                            created_at: formatDateTime(row.create_at),
                        })
                    })

                    const list = records.map((row) => ({
                        // 删除单条记录时回传这个 id（帖子id-审批人id-审批时间毫秒）
                        record_id: `${row.post_id}-${row.handle_by}-${new Date(row.handle_at).getTime()}`,
                        post_id: row.post_id,
                        post_type: row.post_type || "日常",
                        author_id: row.author_id,
                        author: row.author || "未知用户",
                        // 审批结果只有两种：approved=批准、rejected=驳回
                        status: APPROVAL_RESULT[row.status].status,
                        status_text: APPROVAL_RESULT[row.status].text,
                        handle_by: row.handle_by,
                        handle_name: row.handler_nickname || row.handler_username || "无",
                        handle_reason: row.handle_reason || "无",
                        handled_at: row.handle_at ? formatDateTime(row.handle_at) : "无",
                        // 本次审批处理的下架申请数量 + 明细
                        application_count: Number(row.application_count) || 0,
                        applications: applicationsByBatch.get(
                            batchKey(row.post_id, row.handle_by, row.handle_at, row.handle_reason)
                        ) || [],
                    }))

                    res.send({
                        status: 0, msg: "查询成功",
                        data: { list, page, size, total, hasMore: offset + size < total },
                    })
                }
            )
        })
    })
}

// 删除单条审批记录（软删除）：record_id 取自列表接口，格式「帖子id-审批人id-审批时间毫秒」，
// 一次删除的是这一批申请（按帖子审批时可能一次处理多条）
module.exports.deleteOfflineApprovalRecord = (req, res) => {
    const raw = String((req.body && req.body.record_id) || "").trim()
    if (!raw) return req.cc("请提供 record_id", 1, 400)
    const parts = raw.split("-")
    if (parts.length !== 3) return req.cc("record_id 格式不正确", 1, 400)
    const postId = parseInt(parts[0], 10)
    const handleBy = parseInt(parts[1], 10)
    const handledAtMs = parseInt(parts[2], 10)
    if (![postId, handleBy, handledAtMs].every((n) => Number.isInteger(n) && n > 0)) {
        return req.cc("record_id 格式不正确", 1, 400)
    }

    db.query(
        `UPDATE post_offline_applications
         SET record_deleted = 1
         WHERE post_id = ? AND handle_by = ? AND handle_at = ?
           AND status IN (1, 2, 4) AND record_deleted = 0`,
        [postId, handleBy, new Date(handledAtMs)],
        (err, result) => {
            if (err) {
                console.error("删除审批记录失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (result.affectedRows === 0) {
                return req.cc("审批记录不存在或已删除", 1, 400)
            }
            res.send({
                status: 0, msg: "删除成功",
                data: { deleted_count: result.affectedRows },
            })
        }
    )
}

// 清空审批记录（软删除）：只清已产生审批结果的申请，待处理/已撤销不受影响
module.exports.clearOfflineApprovalRecords = (req, res) => {
    db.query(
        `UPDATE post_offline_applications
         SET record_deleted = 1
         WHERE status IN (1, 2, 4) AND record_deleted = 0`,
        (err, result) => {
            if (err) {
                console.error("清空审批记录失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            res.send({
                status: 0, msg: result.affectedRows ? "已清空审批记录" : "暂无可清空的审批记录",
                data: { deleted_count: result.affectedRows },
            })
        }
    )
}

// 下架申请列表：一级只看自己提交的；二级及以上看全部（默认全部状态）
module.exports.offlineApplicationList = (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size) || 12, 1), 50)
    const offset = (page - 1) * size
    const statusRaw = String(req.query.status || "").trim()
    const statusMap = { pending: 0, done: 1, rejected: 2, cancelled: 3, appealing: 4 }
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()
    const date = String(req.query.date || "").trim()

    if (statusRaw && statusRaw !== "all" && statusMap[statusRaw] === undefined) {
        return req.cc("status 只能是 all / pending / done / rejected / cancelled / appealing", 1, 400)
    }
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) {
        return req.cc("start_date 不能晚于 end_date", 1, 400)
    }

    // 角色实时查库（不取 token 里的 role_level），改角色后立即生效
    db.query(
        `SELECT a.id, r.role_level FROM admins a
         LEFT JOIN admin_roles r ON a.role_id = r.id
         WHERE a.id = ?`,
        [req.admin.id],
        (err, admins) => {
            if (err) {
                console.error("查询管理员角色失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (admins.length === 0) return req.cc("账号不存在，请重新登录", 1, 401)
            const level = Number(admins[0].role_level) || 0

            const conditions = []
            const params = []
            // 一级管理员只能看自己提交的申请，防止越权查看别人的处置记录
            if (level < 2) {
                conditions.push("ap.applicant_id = ?")
                params.push(req.admin.id)
            }
            if (statusMap[statusRaw] !== undefined) {
                conditions.push("ap.status = ?")
                params.push(statusMap[statusRaw])
            }
            // 按申请提交时间筛选：date=某一天（闭区间当天），或 start_date~end_date 区间
            if (date) {
                conditions.push("ap.create_at >= ? AND ap.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
                params.push(date + " 00:00:00", date)
            } else {
                if (startDate) {
                    conditions.push("ap.create_at >= ?")
                    params.push(startDate + " 00:00:00")
                }
                if (endDate) {
                    conditions.push("ap.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
                    params.push(endDate)
                }
            }

            // 处理人取「最后一次动作」的执行人：申诉复核过就显示复核人，否则显示首次审批人
            const FROM = `FROM post_offline_applications ap
                          LEFT JOIN admins hd ON hd.id = COALESCE(ap.appeal_handle_by, ap.handle_by)`
            const where = conditions.length ? "WHERE " + conditions.join(" AND ") : ""

            db.query(`SELECT COUNT(*) AS total ${FROM} ${where}`, params, (errC, counts) => {
                if (errC) {
                    console.error("查询下架申请总数失败:", errC)
                    return req.cc("服务器异常", 1, 500)
                }
                const total = counts[0] ? counts[0].total : 0

                const sql = `SELECT ap.id, ap.post_id, ap.apply_reason, ap.status, ap.create_at,
                                    ap.handle_reason, ap.appeal_reason,
                                    hd.username AS handler_name, hd.nickname AS handler_nickname
                             ${FROM}
                             ${where}
                             ORDER BY ap.status ASC, ap.create_at DESC, ap.id DESC
                             LIMIT ? OFFSET ?`
                db.query(sql, params.concat([size, offset]), (err2, rows) => {
                    if (err2) {
                        console.error("查询下架申请列表失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }
                    const list = rows.map((row) => ({
                        id: row.id,
                        post_id: row.post_id,
                        apply_reason: row.apply_reason,
                        // 驳回理由：申请人据此决定要不要申诉
                        handle_reason: row.handle_reason || null,
                        // 申诉理由：复核人据此判断申诉是否成立
                        appeal_reason: row.appeal_reason || null,
                        status: APPLICATION_STATUS[row.status],
                        status_text: APPLICATION_STATUS_TEXT[row.status],
                        // 还没人处理时统一返回「无」，前端不用再判空
                        handler_name: row.handler_nickname || row.handler_name || "无",
                        created_at: formatDateTime(row.create_at),
                    }))
                    res.send({
                        status: 0,
                        msg: "查询成功",
                        data: { list, page, size, total, hasMore: offset + size < total },
                    })
                })
            })
        }
    )
}

// 二级及以上：通过下架申请 = 下架帖子 + 一次性收尾该帖全部待处理举报
// 审批动作发生在某一条申请上，所以用申请 id 定位：
// 前端若误传帖子 id，会有可能把另一个帖子的内容下掉
module.exports.approveOfflineApplication = (req, res) => {
    const idCheck = parseId(req.params.id, "申请 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const applicationId = idCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "下架理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT ap.id, ap.post_id, ap.status, ap.applicant_id,
                        p.user_id, p.status AS post_row_status, p.report_status
                 FROM post_offline_applications ap
                 JOIN posts p ON p.id = ap.post_id
                 WHERE ap.id = ?`
    db.query(sql, [applicationId], (err, rows) => {
        if (err) {
            console.error("查询待审批申请失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("申请不存在", 1, 404)

        const application = rows[0]
        if (Number(application.status) !== 0) return req.cc("该申请已处理，请勿重复操作", 1, 400)
        // 回避自审：不能审批自己提交的申请，否则等于自己申请自己批，审批形同虚设
        if (Number(application.applicant_id) === Number(req.admin.id)) {
            return req.cc("不能审批自己提交的下架申请，请由其他管理员处理", 1, 400)
        }
        if (Number(application.post_row_status) !== 1) return req.cc("帖子已被作者删除，无需下架", 1, 400)

        // 条件更新：两个管理员同时点「通过」时只有一个能成功
        db.query(
            `UPDATE post_offline_applications
             SET status = 1, handle_by = ?, handle_reason = ?, handle_at = NOW()
             WHERE id = ? AND status = 0`,
            [req.admin.id, reason, applicationId],
            (err2, result) => {
                if (err2) {
                    console.error("通过下架申请失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) return req.cc("该申请已处理，请勿重复操作", 1, 400)

                takeDown(Number(application.report_status) === 3)
            }
        )

        // 真正下架并收尾举报；帖子已经是下架状态时只补收尾，不覆盖原下架理由
        function takeDown(alreadyOffline) {
            const finish = () => {
                // 先查待处理举报（通知要用举报人信息），再统一置为已处理
                // 提交申请时已被收尾的举报同样要通知，用 offline_application_id 关联回来
                db.query(
                    "SELECT id, user_id, reasons FROM post_reports WHERE post_id = ? AND (status = 0 OR offline_application_id = ?)",
                    [application.post_id, applicationId],
                    (errRep, reports) => {
                        if (errRep) console.error("查询待处理举报失败:", errRep)
                        const list = errRep ? [] : (reports || [])
                        db.query(
                            `UPDATE post_reports
                             SET status = 1, handle_at = NOW(3), handle_result = ?, handle_by = ?
                             WHERE post_id = ? AND (status = 0 OR offline_application_id = ?)`,
                            [reason, String(req.admin.username).slice(0, 50), application.post_id, applicationId],
                            (errUpd) => {
                                if (errUpd) console.error("标记举报已处理失败:", errUpd)
                                // 只有第一次真正下架才通知，重复调用不能重复打扰作者和举报人
                                if (!alreadyOffline) sendOfflineNotifications(application.user_id, application.post_id, reason, list)
                                res.send({
                                    status: 0,
                                    msg: alreadyOffline ? "申请已通过，该帖子已处于下架状态" : "申请已通过，帖子已下架",
                                    data: {
                                        id: applicationId,
                                        post_id: application.post_id,
                                        status: APPLICATION_STATUS[1],
                                        status_text: APPLICATION_STATUS_TEXT[1],
                                        offline_reason: reason,
                                        handled_report_count: list.length,
                                    },
                                })
                            }
                        )
                    }
                )
            }

            if (alreadyOffline) return finish()
            db.query(
                `UPDATE posts
                 SET report_status = 3, offline_reason = ?, offline_by = ?, offline_at = NOW()
                 WHERE id = ?`,
                [reason, req.admin.id, application.post_id],
                (errPost) => {
                    if (errPost) {
                        console.error("通过申请后下架帖子失败:", errPost)
                        return req.cc("服务器异常", 1, 500)
                    }
                    finish()
                }
            )
        }
    })
}

// 二级及以上：按帖子批准下架 = 该帖全部待处理申请置为处理完成 + 下架帖子 + 收尾举报
// 审批页按帖子聚合展示时用，一次操作处理完该帖所有申请
module.exports.approveOfflineApplicationByPost = (req, res) => {
    const postCheck = parseId(req.body && req.body.post_id, "帖子 id")
    if (postCheck.error) return req.cc(postCheck.error, 1, 400)
    const postId = postCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "批准理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT ap.id, ap.status, ap.applicant_id,
                        p.user_id, p.status AS post_row_status, p.report_status
                 FROM post_offline_applications ap
                 JOIN posts p ON p.id = ap.post_id
                 WHERE ap.post_id = ? AND ap.status = 0`
    db.query(sql, [postId], (err, rows) => {
        if (err) {
            console.error("查询待审批申请失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("该帖子暂无待处理的下架申请", 1, 400)
        // 回避自审：该帖待处理申请中有自己提交的，整批不能由本人批准
        if (rows.some((r) => Number(r.applicant_id) === Number(req.admin.id))) {
            return req.cc("该帖子的下架申请中有你本人提交的，不能由本人审批，请由其他管理员处理", 1, 400)
        }
        if (Number(rows[0].post_row_status) !== 1) return req.cc("帖子已被作者删除，无需下架", 1, 400)

        const applicationIds = rows.map((r) => r.id)
        const alreadyOffline = Number(rows[0].report_status) === 3
        let approvedCount = 0

        // 带 status = 0 条件更新，并发审批时只有一方能成功
        db.query(
            `UPDATE post_offline_applications
             SET status = 1, handle_by = ?, handle_reason = ?, handle_at = NOW()
             WHERE post_id = ? AND status = 0`,
            [req.admin.id, reason, postId],
            (err2, result) => {
                if (err2) {
                    console.error("通过下架申请失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) {
                    return req.cc("该帖子的申请已被处理，请刷新后重试", 1, 400)
                }
                approvedCount = result.affectedRows
                takeDown()
            }
        )

        function takeDown() {
            const finish = () => {
                // 收尾该帖举报：待处理的 + 被本次申请提前收尾的（用申请 id 精确关联，
                // 避免把历史上被驳回申请收尾过的举报重新通知一遍）
                db.query(
                    "SELECT id, user_id, reasons FROM post_reports WHERE post_id = ? AND (status = 0 OR offline_application_id IN (?))",
                    [postId, applicationIds],
                    (errRep, reports) => {
                        if (errRep) console.error("查询待处理举报失败:", errRep)
                        const list = errRep ? [] : (reports || [])
                        db.query(
                            `UPDATE post_reports
                             SET status = 1, handle_at = NOW(3), handle_result = ?, handle_by = ?
                             WHERE post_id = ? AND (status = 0 OR offline_application_id IN (?))`,
                            [reason, String(req.admin.username).slice(0, 50), postId, applicationIds],
                            (errUpd) => {
                                if (errUpd) console.error("标记举报已处理失败:", errUpd)
                                // 只有第一次真正下架才通知，重复调用不重复打扰
                                if (!alreadyOffline) sendOfflineNotifications(rows[0].user_id, postId, reason, list)
                                res.send({
                                    status: 0,
                                    msg: alreadyOffline ? "申请已通过，该帖子已处于下架状态" : "申请已通过，帖子已下架",
                                    data: {
                                        post_id: postId,
                                        approved_count: approvedCount,
                                        status: APPLICATION_STATUS[1],
                                        status_text: APPLICATION_STATUS_TEXT[1],
                                        offline_reason: reason,
                                        handled_report_count: list.length,
                                    },
                                })
                            }
                        )
                    }
                )
            }

            if (alreadyOffline) return finish()
            db.query(
                `UPDATE posts
                 SET report_status = 3, offline_reason = ?, offline_by = ?, offline_at = NOW()
                 WHERE id = ?`,
                [reason, req.admin.id, postId],
                (errPost) => {
                    if (errPost) {
                        console.error("通过申请后下架帖子失败:", errPost)
                        return req.cc("服务器异常", 1, 500)
                    }
                    finish()
                }
            )
        }
    })
}

// 二级及以上：驳回下架申请（帖子继续显示）
module.exports.rejectOfflineApplication = (req, res) => {
    const idCheck = parseId(req.params.id, "申请 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const applicationId = idCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "驳回理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT ap.id, ap.status, ap.applicant_id, p.report_status
                 FROM post_offline_applications ap
                 JOIN posts p ON p.id = ap.post_id
                 WHERE ap.id = ?`
    db.query(sql, [applicationId], (err, rows) => {
        if (err) {
            console.error("查询下架申请失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("申请不存在", 1, 404)
        if (rows[0].status !== 0) return req.cc("该申请已处理，请勿重复操作", 1, 400)
        // 回避自审：驳回自己提交的申请请走撤销，避免一人既是申请人又是审批人
        if (Number(rows[0].applicant_id) === Number(req.admin.id)) {
            return req.cc("不能驳回自己提交的下架申请，如需撤回请使用撤销功能", 1, 400)
        }
        if (rows[0].report_status === 3) return req.cc("该帖子已下架，无需驳回", 1, 400)

        // 带 status = 0 条件更新：两个管理员同时操作时只有一个能成功
        db.query(
            `UPDATE post_offline_applications
             SET status = 2, handle_by = ?, handle_reason = ?, handle_at = NOW()
             WHERE id = ? AND status = 0`,
            [req.admin.id, reason, applicationId],
            (err2, result) => {
                if (err2) {
                    console.error("驳回下架申请失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) return req.cc("该申请已处理，请勿重复操作", 1, 400)

                // 帖子管理页提交的申请：举报本来就没动，继续待处理；
                // 举报处理页提交的申请：举报在提交时已置为处理完成，驳回也不回滚
                res.send({
                    status: 0,
                    msg: "已驳回该申请",
                    data: { id: applicationId, status: APPLICATION_STATUS[2], status_text: APPLICATION_STATUS_TEXT[2] },
                })
            }
        )
    })
}

// 按帖子驳回：一次性驳回该帖子全部待处理的下架申请（审批页按帖子操作时用）
module.exports.rejectOfflineApplicationByPost = (req, res) => {
    const postCheck = parseId(req.body && req.body.post_id, "帖子 id")
    if (postCheck.error) return req.cc(postCheck.error, 1, 400)
    const postId = postCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "驳回理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT ap.id, ap.status, ap.applicant_id, p.report_status
                 FROM post_offline_applications ap
                 JOIN posts p ON p.id = ap.post_id
                 WHERE ap.post_id = ? AND ap.status = 0`
    db.query(sql, [postId], (err, rows) => {
        if (err) {
            console.error("查询待处理下架申请失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("该帖子暂无待处理的下架申请", 1, 400)
        // 回避自审：该帖待处理申请中包含自己提交的，整批不能由本人驳回
        if (rows.some((r) => Number(r.applicant_id) === Number(req.admin.id))) {
            return req.cc("该帖子的下架申请中有你本人提交的，不能由本人驳回，如需撤回请使用撤销功能", 1, 400)
        }
        if (rows[0].report_status === 3) return req.cc("该帖子已下架，无需驳回", 1, 400)

        // 带 status = 0 条件更新，和审批/撤销并发时只有一方能成功
        db.query(
            `UPDATE post_offline_applications
             SET status = 2, handle_by = ?, handle_reason = ?, handle_at = NOW()
             WHERE post_id = ? AND status = 0`,
            [req.admin.id, reason, postId],
            (err2, result) => {
                if (err2) {
                    console.error("驳回下架申请失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) {
                    return req.cc("该帖子的申请已被处理，请刷新后重试", 1, 400)
                }
                // 举报状态不动：帖子页发起的申请本来就没收尾举报；
                // 举报页发起的申请在提交时已收尾，驳回后按约定也不回滚
                res.send({
                    status: 0,
                    msg: "已驳回该帖全部下架申请",
                    data: {
                        post_id: postId,
                        rejected_count: result.affectedRows,
                        status: APPLICATION_STATUS[2],
                        status_text: APPLICATION_STATUS_TEXT[2],
                        handle_reason: reason,
                    },
                })
            }
        )
    })
}

// 申请人本人：撤销仍在待处理的下架申请（撤回后帖子保持显示，可以重新提交）
module.exports.cancelOfflineApplication = (req, res) => {
    const idCheck = parseId(req.params.id, "申请 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const applicationId = idCheck.id

    db.query(
        "SELECT id, post_id, applicant_id, status FROM post_offline_applications WHERE id = ?",
        [applicationId],
        (err, rows) => {
            if (err) {
                console.error("查询下架申请失败:", err)
                return req.cc("服务器异常", 1, 500)
            }
            if (rows.length === 0) return req.cc("申请不存在", 1, 404)

            const application = rows[0]
            // 只能撤销自己提交的，二级及以上也不能替别人撤回
            if (Number(application.applicant_id) !== Number(req.admin.id)) {
                return req.cc("只能撤销自己提交的申请", 1, 403)
            }
            if (Number(application.status) !== 0) return req.cc("该申请已处理，无法撤销", 1, 400)

            // 带 status = 0 条件更新：和审批同时发生时只有一个能成功
            db.query(
                "UPDATE post_offline_applications SET status = 3 WHERE id = ? AND status = 0",
                [applicationId],
                (err2, result) => {
                    if (err2) {
                        console.error("撤销下架申请失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }
                    if (result.affectedRows === 0) return req.cc("该申请已处理，无法撤销", 1, 400)

                    // 撤销只影响申请本身：举报处理页提交时已收尾的举报保持处理完成
                    res.send({
                        status: 0,
                        msg: "已撤销该下架申请",
                        data: {
                            id: applicationId,
                            post_id: application.post_id,
                            status: APPLICATION_STATUS[3],
                            status_text: APPLICATION_STATUS_TEXT[3],
                        },
                    })
                }
            )
        }
    )
}

// 申请人本人：对「已驳回」的申请发起申诉（每张申请只能申诉一次）
module.exports.appealOfflineApplication = (req, res) => {
    const idCheck = parseId(req.params.id, "申请 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const applicationId = idCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "申诉理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT id, post_id, applicant_id, status, appeal_at
                 FROM post_offline_applications WHERE id = ?`
    db.query(sql, [applicationId], (err, rows) => {
        if (err) {
            console.error("查询待申诉申请失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("申请不存在", 1, 404)

        const application = rows[0]
        if (Number(application.applicant_id) !== Number(req.admin.id)) {
            return req.cc("只能申诉自己提交的申请", 1, 403)
        }
        if (Number(application.status) !== 2) return req.cc("只有已驳回的申请才能申诉", 1, 400)
        if (application.appeal_at) return req.cc("该申请已申诉过，不能重复申诉", 1, 400)

        // appeal_at IS NULL 做幂等：重复点击或并发只能成功一次
        db.query(
            `UPDATE post_offline_applications
             SET status = 4, appeal_reason = ?, appeal_at = NOW()
             WHERE id = ? AND status = 2 AND appeal_at IS NULL`,
            [reason, applicationId],
            (err2, result) => {
                if (err2) {
                    console.error("提交申诉失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) return req.cc("该申请状态已变化，请刷新后重试", 1, 400)

                res.send({
                    status: 0,
                    msg: "申诉已提交，等待更高级别管理员复核",
                    data: {
                        id: applicationId,
                        post_id: application.post_id,
                        status: APPLICATION_STATUS[4],
                        status_text: APPLICATION_STATUS_TEXT[4],
                    },
                })
            }
        )
    })
}

// 复核申诉：必须比原审批人（驳回者）级别更高，避免自己推翻自己的决定
module.exports.reviewAppeal = (req, res) => {
    const idCheck = parseId(req.params.id, "申请 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const applicationId = idCheck.id

    const action = String((req.body && req.body.action) || "").trim()
    if (action !== "approve" && action !== "reject") {
        return req.cc("action 只能是 approve / reject", 1, 400)
    }
    const reasonCheck = parseReason(req.body && req.body.reason, "复核理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT ap.id, ap.post_id, ap.status, ap.handle_by,
                        p.user_id, p.status AS post_row_status, p.report_status,
                        rr.role_level AS rejecter_level
                 FROM post_offline_applications ap
                 JOIN posts p ON p.id = ap.post_id
                 LEFT JOIN admins h ON h.id = ap.handle_by
                 LEFT JOIN admin_roles rr ON rr.id = h.role_id
                 WHERE ap.id = ?`
    db.query(sql, [applicationId], (err, rows) => {
        if (err) {
            console.error("查询申诉详情失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("申请不存在", 1, 404)

        const application = rows[0]
        if (Number(application.status) !== 4) return req.cc("该申请不在申诉中", 1, 400)
        if (action === "approve" && Number(application.post_row_status) !== 1) {
            return req.cc("帖子已被作者删除，无法通过申诉", 1, 400)
        }

        // 实时查当前管理员等级，不信任 token 里的 role_level
        db.query(
            `SELECT r.role_level FROM admins a
             LEFT JOIN admin_roles r ON r.id = a.role_id
             WHERE a.id = ?`,
            [req.admin.id],
            (errLv, lvRows) => {
                if (errLv) {
                    console.error("查询管理员等级失败:", errLv)
                    return req.cc("服务器异常", 1, 500)
                }
                if (lvRows.length === 0) return req.cc("账号不存在，请重新登录", 1, 401)

                const level = Number(lvRows[0].role_level) || 0
                if (level <= Number(application.rejecter_level)) {
                    return req.cc("申诉需由比原审批人更高级别的管理员复核", 1, 403)
                }

                if (action === "reject") return rejectAppeal()
                approveAppeal()
            }
        )

        // 驳回申诉：申请回到「已驳回」，appeal_at 已写入不能再申诉
        function rejectAppeal() {
            db.query(
                `UPDATE post_offline_applications
                 SET status = 2, appeal_handle_by = ?, appeal_handle_reason = ?, appeal_handle_at = NOW()
                 WHERE id = ? AND status = 4`,
                [req.admin.id, reason, applicationId],
                (err2, result) => {
                    if (err2) {
                        console.error("驳回申诉失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }
                    if (result.affectedRows === 0) return req.cc("该申诉已处理，请勿重复操作", 1, 400)

                    res.send({
                        status: 0,
                        msg: "已驳回该申诉",
                        data: {
                            id: applicationId,
                            post_id: application.post_id,
                            status: APPLICATION_STATUS[2],
                            status_text: APPLICATION_STATUS_TEXT[2],
                        },
                    })
                }
            )
        }

        // 通过申诉：等同于下架帖子，同时收尾举报和通知
        function approveAppeal() {
            db.query(
                `UPDATE post_offline_applications
                 SET status = 1, appeal_handle_by = ?, appeal_handle_reason = ?, appeal_handle_at = NOW()
                 WHERE id = ? AND status = 4`,
                [req.admin.id, reason, applicationId],
                (err2, result) => {
                    if (err2) {
                        console.error("通过申诉失败:", err2)
                        return req.cc("服务器异常", 1, 500)
                    }
                    if (result.affectedRows === 0) return req.cc("该申诉已处理，请勿重复操作", 1, 400)

                    // 同一帖子其他待处理申请一并收尾，避免留下孤儿申请
                    db.query(
                        `UPDATE post_offline_applications
                         SET status = 1, handle_by = ?, handle_reason = ?, handle_at = NOW()
                         WHERE post_id = ? AND status = 0`,
                        [req.admin.id, reason, application.post_id],
                        (errApp) => {
                            if (errApp) console.error("收尾待处理申请失败:", errApp)
                        }
                    )

                    db.query(
                        `UPDATE posts
                         SET report_status = 3, offline_reason = ?, offline_by = ?, offline_at = NOW()
                         WHERE id = ?`,
                        [reason, req.admin.id, application.post_id],
                        (errPost) => {
                            if (errPost) {
                                console.error("申诉通过后下架帖子失败:", errPost)
                                return req.cc("服务器异常", 1, 500)
                            }

                            db.query(
                                "SELECT id, user_id, reasons FROM post_reports WHERE post_id = ? AND status = 0",
                                [application.post_id],
                                (errRep, reports) => {
                                    const list = errRep ? [] : (reports || [])
                                    db.query(
                                        `UPDATE post_reports
                                         SET status = 1, handle_at = NOW(3), handle_result = ?, handle_by = ?
                                         WHERE post_id = ? AND status = 0`,
                                        [reason, String(req.admin.username).slice(0, 50), application.post_id],
                                        (errUpd) => {
                                            if (errUpd) console.error("申诉通过后标记举报已处理失败:", errUpd)
                                            sendOfflineNotifications(application.user_id, application.post_id, reason, list)
                                            res.send({
                                                status: 0,
                                                msg: "申诉已通过，帖子已下架",
                                                data: {
                                                    id: applicationId,
                                                    post_id: application.post_id,
                                                    status: APPLICATION_STATUS[1],
                                                    status_text: APPLICATION_STATUS_TEXT[1],
                                                    offline_reason: reason,
                                                },
                                            })
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            )
        }
    })
}

// 用户列表：被举报次数 → 风险标签（阈值集中在这里，后续调整只改这两个数）
const RISK_HIGH_MIN = 5
const RISK_MEDIUM_MIN = 1
const RISK_TEXT = { high: "高危用户", medium: "中风险用户", green: "绿色用户" }

module.exports.userList = (req, res) => {
    // 数量参数允许 0（比如筛「被举报 0 次」的绿色用户），非法值返回 NaN
    const parseCount = (raw) => {
        if (!raw || raw === "null") return null
        const n = Number(raw)
        return Number.isInteger(n) && n >= 0 ? n : NaN
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size, 10) || 12, 1), 50)
    const offset = (page - 1) * size

    const keyword = String(req.query.keyword || "").trim()
    const risk = String(req.query.risk || "").trim()
    const accountStatus = String(req.query.status || "").trim()
    if (risk && !RISK_TEXT[risk]) return req.cc("risk 只能是 high / medium / green", 1, 400)
    if (accountStatus && accountStatus !== "normal" && accountStatus !== "banned") {
        return req.cc("status 只能是 normal / banned", 1, 400)
    }

    // 数量筛选：单值 = 下限（>= N），区间用 min + max；同时传 min 和单值取较大者
    const reportCount = parseCount(String(req.query.report_count ?? "").trim())
    const reportCountMin = parseCount(String(req.query.report_count_min ?? "").trim())
    const reportCountMax = parseCount(String(req.query.report_count_max ?? "").trim())
    const postCount = parseCount(String(req.query.post_count ?? "").trim())
    const postCountMin = parseCount(String(req.query.post_count_min ?? "").trim())
    const postCountMax = parseCount(String(req.query.post_count_max ?? "").trim())
    if ([reportCount, reportCountMin, reportCountMax, postCount, postCountMin, postCountMax].some((v) => Number.isNaN(v))) {
        return req.cc("report_count / post_count 相关参数必须是不小于 0 的整数", 1, 400)
    }
    const reportLower = Math.max(reportCount || 0, reportCountMin || 0) || null
    const postLower = Math.max(postCount || 0, postCountMin || 0) || null
    if (reportLower !== null && reportCountMax !== null && reportLower > reportCountMax) {
        return req.cc("被举报次数下限不能大于上限", 1, 400)
    }
    if (postLower !== null && postCountMax !== null && postLower > postCountMax) {
        return req.cc("发帖数量下限不能大于上限", 1, 400)
    }

    // 举报次数按「未删除的举报」统计，与举报处理记录页口径一致；
    // 发帖数量只算 status=1 的有效帖子（已被下架但仍 status=1 的也计入）
    const baseSql = `SELECT u.id AS user_id,
                            u.username AS nickname,
                            CASE WHEN u.status = 0 AND u.ban_until IS NOT NULL AND u.ban_until <= NOW() THEN 1 ELSE u.status END AS account_status,
                            u.ban_reason,
                            u.ban_at,
                            u.ban_until,
                            COALESCE(pc.post_count, 0) AS post_count,
                            COALESCE(rc.report_count, 0) AS report_count,
                            rc.last_reported_at,
                            CASE WHEN COALESCE(rc.report_count, 0) >= ${RISK_HIGH_MIN} THEN 'high'
                                 WHEN COALESCE(rc.report_count, 0) >= ${RISK_MEDIUM_MIN} THEN 'medium'
                                 ELSE 'green' END AS risk_level
                     FROM userinfo u
                     LEFT JOIN (
                         SELECT user_id, COUNT(*) AS post_count
                         FROM posts WHERE status = 1
                         GROUP BY user_id
                     ) pc ON pc.user_id = u.id
                     LEFT JOIN (
                         SELECT p.user_id, COUNT(*) AS report_count, MAX(r.create_at) AS last_reported_at
                         FROM post_reports r
                         JOIN posts p ON p.id = r.post_id
                         WHERE r.record_deleted = 0
                         GROUP BY p.user_id
                     ) rc ON rc.user_id = u.id`

    const whereParts = []
    const whereParams = []
    if (keyword) {
        if (/^\d+$/.test(keyword)) {
            whereParts.push("(t.nickname LIKE ? OR t.user_id = ?)")
            whereParams.push(`%${keyword}%`, Number(keyword))
        } else {
            whereParts.push("t.nickname LIKE ?")
            whereParams.push(`%${keyword}%`)
        }
    }
    if (risk) {
        whereParts.push("t.risk_level = ?")
        whereParams.push(risk)
    }
    if (accountStatus) {
        whereParts.push("t.account_status = ?")
        whereParams.push(accountStatus === "normal" ? 1 : 0)
    }
    if (reportLower !== null) {
        whereParts.push("t.report_count >= ?")
        whereParams.push(reportLower)
    }
    if (reportCountMax !== null) {
        whereParts.push("t.report_count <= ?")
        whereParams.push(reportCountMax)
    }
    if (postLower !== null) {
        whereParts.push("t.post_count >= ?")
        whereParams.push(postLower)
    }
    if (postCountMax !== null) {
        whereParts.push("t.post_count <= ?")
        whereParams.push(postCountMax)
    }
    const WHERE = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""

    db.query(`SELECT COUNT(*) AS total FROM (${baseSql}) t ${WHERE}`, whereParams, (err, cntRows) => {
        if (err) {
            console.error("统计用户数量失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        const total = Number(cntRows[0].total)

        const listSql = `SELECT * FROM (${baseSql}) t ${WHERE}
                         ORDER BY t.report_count DESC, t.user_id ASC
                         LIMIT ? OFFSET ?`
        db.query(listSql, [...whereParams, size, offset], (err2, rows) => {
            if (err2) {
                console.error("查询用户列表失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            const list = rows.map((r) => ({
                user_id: r.user_id,
                nickname: r.nickname,
                report_count: Number(r.report_count),
                risk_level: r.risk_level,
                risk_text: RISK_TEXT[r.risk_level],
                post_count: Number(r.post_count),
                status: Number(r.account_status) === 1 ? "normal" : "banned",
                status_text: Number(r.account_status) === 1 ? "正常" : "被封禁",
                ban_reason: Number(r.account_status) === 1 ? "无" : r.ban_reason || "无",
                ban_at: Number(r.account_status) === 1 ? "无" : r.ban_at ? formatDateTime(r.ban_at) : "无",
                ban_until: Number(r.account_status) === 1 ? "无" : r.ban_until ? formatDateTime(r.ban_until) : "永久",
                last_reported_at: r.last_reported_at ? formatDateTime(r.last_reported_at) : "无",
            }))
            res.send({
                status: 0,
                msg: "查询成功",
                data: { list, page, size, total, hasMore: offset + list.length < total },
            })
        })
    })
}

// 封禁时长白名单：英文写法为主，同时兼容前端可能传的中文
const BAN_DURATION_DAYS = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1天": 1,
    "7天": 7,
    "30天": 30,
    "90天": 90,
}

// 封禁 / 解封 C 端账号（三级及以上）
// action=ban 需要理由和时长；action=unban 清空封禁信息。条件更新保证并发下只成功一次
module.exports.banUser = (req, res) => {
    const idCheck = parseId(req.params.id, "用户 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const userId = idCheck.id

    const action = String((req.body && req.body.action) || "").trim()
    if (action !== "ban" && action !== "unban") {
        return req.cc("action 只能是 ban / unban", 1, 400)
    }

    let reason = null
    let duration = null
    let banUntil = null
    if (action === "ban") {
        const reasonCheck = parseReason(req.body && req.body.reason, "封禁理由")
        if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
        reason = reasonCheck.reason

        duration = String((req.body && req.body.duration) || "").trim()
        const isForever = duration === "permanent" || duration === "永久"
        const days = BAN_DURATION_DAYS[duration]
        if (!isForever && !days) {
            return req.cc("封禁时长只能是 1d / 7d / 30d / 90d / permanent", 1, 400)
        }
        banUntil = isForever ? null : new Date(Date.now() + days * 24 * 3600 * 1000)
    }

    db.query("SELECT id, username, status FROM userinfo WHERE id = ?", [userId], (err, rows) => {
        if (err) {
            console.error("查询用户失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("用户不存在", 1, 404)

        const user = rows[0]
        const isBanned = Number(user.status) !== 1
        if (action === "ban" && isBanned) return req.cc("该账号已是封禁状态", 1, 400)
        if (action === "unban" && !isBanned) return req.cc("该账号当前未被封禁", 1, 400)

        const now = new Date()
        const sql = action === "ban"
            ? "UPDATE userinfo SET status = 0, ban_reason = ?, ban_by = ?, ban_at = ?, ban_until = ? WHERE id = ? AND status = 1"
            : "UPDATE userinfo SET status = 1, ban_reason = NULL, ban_by = NULL, ban_at = NULL, ban_until = NULL WHERE id = ? AND status = 0"
        const params = action === "ban" ? [reason, req.admin.id, now, banUntil, userId] : [userId]

        db.query(sql, params, (err2, result) => {
            if (err2) {
                console.error("更新用户状态失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            if (result.affectedRows === 0) return req.cc("该账号状态已变化，请刷新后重试", 1, 400)

            // 封禁成功即写入操作记录（解封不删记录，保证历史可查）
            if (action === "ban") {
                db.query(
                    "INSERT INTO user_ban_records (user_id, reason, duration, ban_at, ban_until, operator_id) VALUES (?,?,?,?,?,?)",
                    [userId, reason, duration, now, banUntil, req.admin.id],
                    (e) => { if (e) console.error("写入封禁记录失败:", e) }
                )
            }

            res.send({
                status: 0,
                msg: action === "ban" ? "已封禁该账号" : "已解封该账号",
                data: {
                    user_id: userId,
                    nickname: user.username,
                    status: action === "ban" ? "banned" : "normal",
                    status_text: action === "ban" ? "被封禁" : "正常",
                    ban_reason: action === "ban" ? reason : "无",
                    ban_at: action === "ban" ? formatDateTime(now) : "无",
                    ban_duration: action === "ban" ? duration : "无",
                    ban_until: action === "ban" ? (banUntil ? formatDateTime(banUntil) : "永久") : "无",
                },
            })
        })
    })
}

// 删除单条封禁记录（三级及以上）
// 仍在生效的封禁（用户当前被封、且这条是最近一次封禁）不允许删除，
// 否则管理员就失去了这条封禁的追溯依据，也没法再据此撤销
module.exports.deleteBanRecord = (req, res) => {
    const idCheck = parseId(req.params.id, "记录 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const recordId = idCheck.id

    const sql = `SELECT r.id, r.user_id, r.ban_until,
                        u.status AS account_status,
                        (SELECT MAX(id) FROM user_ban_records WHERE user_id = r.user_id) AS latest_id
                 FROM user_ban_records r
                 LEFT JOIN userinfo u ON u.id = r.user_id
                 WHERE r.id = ?`
    db.query(sql, [recordId], (err, rows) => {
        if (err) {
            console.error("查询封禁记录失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("封禁记录不存在", 1, 404)

        const r = rows[0]
        // 记录仍对应生效中的封禁：用户被封 + 这条是最近一条 + 未到期（或永久）
        const stillActive =
            Number(r.account_status) === 0 &&
            Number(r.latest_id) === Number(r.id) &&
            (!r.ban_until || new Date(r.ban_until).getTime() > Date.now())
        if (stillActive) {
            return req.cc("该封禁仍在生效，删除后将无法追溯，请先解封该账号", 1, 400)
        }

        db.query("DELETE FROM user_ban_records WHERE id = ?", [recordId], (err2, result) => {
            if (err2) {
                console.error("删除封禁记录失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            if (result.affectedRows === 0) return req.cc("封禁记录不存在", 1, 404)
            res.send({ status: 0, msg: "删除成功", data: { record_id: recordId } })
        })
    })
}

// 撤销封禁（三级及以上）：参数用户 id + 撤销理由
// 与 action=unban 的区别：必须填写撤销理由，并写入该用户最近一条封禁记录
module.exports.unbanUser = (req, res) => {
    const idCheck = parseId(req.params.id, "用户 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const userId = idCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "撤销理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    db.query("SELECT id, username, status FROM userinfo WHERE id = ?", [userId], (err, rows) => {
        if (err) {
            console.error("查询用户失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("用户不存在", 1, 404)
        if (Number(rows[0].status) !== 0) return req.cc("该账号当前未被封禁", 1, 400)

        const now = new Date()
        db.query(
            "UPDATE userinfo SET status = 1, ban_reason = NULL, ban_by = NULL, ban_at = NULL, ban_until = NULL WHERE id = ? AND status = 0",
            [userId],
            (err2, result) => {
                if (err2) {
                    console.error("撤销封禁失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) return req.cc("该账号状态已变化，请刷新后重试", 1, 400)

                const send = () =>
                    res.send({
                        status: 0,
                        msg: "已撤销封禁",
                        data: {
                            user_id: userId,
                            nickname: rows[0].username,
                            status: "normal",
                            status_text: "正常",
                            unban_reason: reason,
                            unban_at: formatDateTime(now),
                        },
                    })

                // 撤销信息写到最近一条封禁记录，便于封禁记录页追溯
                db.query(
                    "SELECT id FROM user_ban_records WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                    [userId],
                    (err3, recRows) => {
                        if (err3 || recRows.length === 0) {
                            if (err3) console.error("查询封禁记录失败:", err3)
                            return send()
                        }
                        db.query(
                            "UPDATE user_ban_records SET unban_reason = ?, unban_by = ?, unban_at = ? WHERE id = ?",
                            [reason, req.admin.id, now, recRows[0].id],
                            (err4) => {
                                if (err4) console.error("写入撤销记录失败:", err4)
                                send()
                            }
                        )
                    }
                )
            }
        )
    })
}

// 同意封禁申诉（三级及以上）：参数用户 id，无需理由
// 同意后账号立即恢复正常，并把该用户全部待处理申诉标记为同意
module.exports.approveUserAppeal = (req, res) => {
    const idCheck = parseId(req.params.id, "用户 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const userId = idCheck.id

    db.query("SELECT id, username, status FROM userinfo WHERE id = ?", [userId], (err, rows) => {
        if (err) {
            console.error("查询用户失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("用户不存在", 1, 404)

        db.query(
            "SELECT id FROM user_ban_appeals WHERE user_id = ? AND status = 0 ORDER BY id DESC LIMIT 1",
            [userId],
            (err2, appealRows) => {
                if (err2) {
                    console.error("查询封禁申诉失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (appealRows.length === 0) return req.cc("该用户暂无待处理的申诉", 1, 400)
                const appealId = appealRows[0].id
                const now = new Date()

                db.query(
                    "UPDATE user_ban_appeals SET status = 1, handle_by = ?, handle_reason = ?, handle_at = ? WHERE user_id = ? AND status = 0",
                    [req.admin.id, "同意申诉", now, userId],
                    (err3, result) => {
                        if (err3) {
                            console.error("同意封禁申诉失败:", err3)
                            return req.cc("服务器异常", 1, 500)
                        }
                        if (result.affectedRows === 0) return req.cc("该申诉已被处理，请刷新后重试", 1, 400)

                        const finish = (unbanned) =>
                            res.send({
                                status: 0,
                                msg: unbanned ? "已同意申诉，账号已恢复正常" : "已同意申诉，账号当前未被封禁",
                                data: {
                                    appeal_id: appealId,
                                    user_id: userId,
                                    nickname: rows[0].username,
                                    status: "approved",
                                    status_text: "同意",
                                    handled_at: formatDateTime(now),
                                    account_status: "normal",
                                    account_status_text: "解封",
                                    account_unbanned: unbanned,
                                },
                            })

                        db.query(
                            "UPDATE userinfo SET status = 1, ban_reason = NULL, ban_by = NULL, ban_at = NULL, ban_until = NULL WHERE id = ? AND status = 0",
                            [userId],
                            (err4, r4) => {
                                if (err4) {
                                    console.error("撤销封禁失败:", err4)
                                    return req.cc("服务器异常", 1, 500)
                                }
                                if (r4.affectedRows === 0) return finish(false)

                                // 撤销信息同步到最近一条封禁记录
                                db.query(
                                    "SELECT id FROM user_ban_records WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                                    [userId],
                                    (err5, recRows) => {
                                        if (err5 || recRows.length === 0) return finish(true)
                                        db.query(
                                            "UPDATE user_ban_records SET unban_reason = ?, unban_by = ?, unban_at = ? WHERE id = ?",
                                            ["申诉同意解封", req.admin.id, now, recRows[0].id],
                                            (err6) => {
                                                if (err6) console.error("写入撤销记录失败:", err6)
                                                finish(true)
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
            }
        )
    })
}

// 驳回封禁申诉（三级及以上）：参数申诉 id + 驳回理由
// 已同意 / 已驳回的申诉不能重复处理
module.exports.rejectBanAppeal = (req, res) => {
    const idCheck = parseId(req.params.id, "申诉 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const appealId = idCheck.id

    const reasonCheck = parseReason(req.body && req.body.reason, "驳回理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT a.id, a.user_id, a.status, u.username AS nickname
                 FROM user_ban_appeals a
                 LEFT JOIN userinfo u ON u.id = a.user_id
                 WHERE a.id = ?`
    db.query(sql, [appealId], (err, rows) => {
        if (err) {
            console.error("查询封禁申诉失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("申诉不存在", 1, 404)
        const appeal = rows[0]
        if (Number(appeal.status) !== 0) return req.cc("该申诉已处理，不能重复处理", 1, 400)

        const now = new Date()
        db.query(
            "UPDATE user_ban_appeals SET status = 2, handle_by = ?, handle_reason = ?, handle_at = ? WHERE id = ? AND status = 0",
            [req.admin.id, reason, now, appealId],
            (err2, result) => {
                if (err2) {
                    console.error("驳回封禁申诉失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) return req.cc("该申诉已被处理，请刷新后重试", 1, 400)
                res.send({
                    status: 0,
                    msg: "已驳回申诉",
                    data: {
                        appeal_id: appealId,
                        user_id: appeal.user_id,
                        nickname: appeal.nickname || "已注销用户",
                        status: "rejected",
                        status_text: "驳回",
                        handle_reason: reason,
                        handled_at: formatDateTime(now),
                        account_unbanned: false,
                    },
                })
            }
        )
    })
}

// 处理封禁申诉（三级及以上）：同意 = 撤销封禁，驳回 = 维持封禁
// 只有待处理（status=0）的申诉能处理，已同意/已驳回的不能重复处理
module.exports.handleBanAppeal = (req, res) => {
    const idCheck = parseId(req.params.id, "申诉 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const appealId = idCheck.id

    const body = req.body || {}
    const action = String(body.action || "").trim()
    if (action !== "approve" && action !== "reject") {
        return req.cc("action 只能是 approve / reject", 1, 400)
    }
    const reasonCheck = parseReason(body.reason, action === "approve" ? "同意理由" : "驳回理由")
    if (reasonCheck.error) return req.cc(reasonCheck.error, 1, 400)
    const reason = reasonCheck.reason

    const sql = `SELECT a.id, a.user_id, a.status, u.username AS nickname, u.status AS user_status
                 FROM user_ban_appeals a
                 LEFT JOIN userinfo u ON u.id = a.user_id
                 WHERE a.id = ?`
    db.query(sql, [appealId], (err, rows) => {
        if (err) {
            console.error("查询封禁申诉失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("申诉不存在", 1, 404)
        const appeal = rows[0]
        // 已同意 / 已驳回 = 已处理完成，禁止重复处理
        if (Number(appeal.status) !== 0) return req.cc("该申诉已处理，不能重复处理", 1, 400)

        const now = new Date()
        const newStatus = action === "approve" ? 1 : 2
        // 条件更新：并发下只有一个请求能成功
        db.query(
            "UPDATE user_ban_appeals SET status = ?, handle_by = ?, handle_reason = ?, handle_at = ? WHERE id = ? AND status = 0",
            [newStatus, req.admin.id, reason, now, appealId],
            (err2, result) => {
                if (err2) {
                    console.error("处理封禁申诉失败:", err2)
                    return req.cc("服务器异常", 1, 500)
                }
                if (result.affectedRows === 0) return req.cc("该申诉已被处理，请刷新后重试", 1, 400)

                const send = (unbanned) =>
                    res.send({
                        status: 0,
                        msg: action === "approve" ? "已同意申诉，账号已解封" : "已驳回申诉",
                        data: {
                            appeal_id: appealId,
                            user_id: appeal.user_id,
                            nickname: appeal.nickname || "已注销用户",
                            status: action === "approve" ? "approved" : "rejected",
                            status_text: action === "approve" ? "同意" : "驳回",
                            handle_reason: reason,
                            handled_at: formatDateTime(now),
                            account_unbanned: action === "approve" ? unbanned : false,
                        },
                    })

                if (action === "reject") return send(false)

                // 同意：撤销封禁（若账号已到期/已解封，则只标记申诉状态）
                db.query(
                    "UPDATE userinfo SET status = 1, ban_reason = NULL, ban_by = NULL, ban_at = NULL, ban_until = NULL WHERE id = ? AND status = 0",
                    [appeal.user_id],
                    (err3, r3) => {
                        if (err3) {
                            console.error("撤销封禁失败:", err3)
                            return req.cc("服务器异常", 1, 500)
                        }
                        if (r3.affectedRows === 0) return send(false)
                        db.query(
                            "SELECT id FROM user_ban_records WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                            [appeal.user_id],
                            (err4, recRows) => {
                                if (err4 || recRows.length === 0) return send(true)
                                db.query(
                                    "UPDATE user_ban_records SET unban_reason = ?, unban_by = ?, unban_at = ? WHERE id = ?",
                                    [reason, req.admin.id, now, recRows[0].id],
                                    (err5) => {
                                        if (err5) console.error("写入撤销记录失败:", err5)
                                        send(true)
                                    }
                                )
                            }
                        )
                    }
                )
            }
        )
    })
}

// 封禁申诉列表（三级及以上）：返回申诉明细，可按申诉时间和状态筛选
module.exports.banAppealList = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size, 10) || 12, 1), 50)
    const offset = (page - 1) * size

    // 状态：all / pending 待处理 / approved 同意 / rejected 驳回
    const APPEAL_STATUS = { pending: 0, approved: 1, rejected: 2 }
    const APPEAL_STATUS_TEXT = { 0: "待处理", 1: "同意", 2: "驳回" }
    const statusParam = String(req.query.status || "all").trim()
    if (statusParam !== "all" && APPEAL_STATUS[statusParam] === undefined) {
        return req.cc("status 只能是 all / pending / approved / rejected", 1, 400)
    }

    // 申诉时间：date 优先（当天闭区间），否则 start_date/end_date 区间
    const date = String(req.query.date || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) return req.cc("start_date 不能晚于 end_date", 1, 400)

    const conds = []
    const params = []
    if (statusParam !== "all") {
        conds.push("a.status = ?")
        params.push(APPEAL_STATUS[statusParam])
    }
    if (date) {
        conds.push("a.create_at >= ? AND a.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
        params.push(date, date)
    } else {
        if (startDate) {
            conds.push("a.create_at >= ?")
            params.push(startDate)
        }
        if (endDate) {
            conds.push("a.create_at < DATE_ADD(?, INTERVAL 1 DAY)")
            params.push(endDate)
        }
    }
    const WHERE = conds.length ? " WHERE " + conds.join(" AND ") : ""

    db.query(`SELECT COUNT(*) AS total FROM user_ban_appeals a${WHERE}`, params, (err, cntRows) => {
        if (err) {
            console.error("统计封禁申诉失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        const total = Number(cntRows[0].total)

        const sql = `SELECT a.id, a.user_id, u.username AS nickname, a.appeal_reason,
                            a.status, a.handle_reason, a.create_at
                     FROM user_ban_appeals a
                     LEFT JOIN userinfo u ON u.id = a.user_id
                     ${WHERE}
                     ORDER BY a.create_at DESC, a.id DESC
                     LIMIT ? OFFSET ?`
        db.query(sql, [...params, size, offset], (err2, rows) => {
            if (err2) {
                console.error("查询封禁申诉失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            const list = rows.map((r) => ({
                appeal_id: r.id,
                user_id: r.user_id,
                nickname: r.nickname || "已注销用户",
                appeal_reason: r.appeal_reason,
                appeal_at: formatDateTime(r.create_at),
                status: ["pending", "approved", "rejected"][Number(r.status)] || "pending",
                status_text: APPEAL_STATUS_TEXT[Number(r.status)] || "待处理",
                reject_reason: r.handle_reason || "无",
            }))
            res.send({
                status: 0,
                msg: "查询成功",
                data: { list, page, size, total, hasMore: offset + list.length < total },
            })
        })
    })
}

// 各等级管理员的职位简介：问候语 + 职责说明
const ROLE_BRIEF = {
    1: {
        greeting: "欢迎来到 Haven 后台管理系统，让我们一起让 Haven 这个树洞变得更好。",
        duties: [
            "巡查帖子内容，发现违规内容及时处理",
            "处理用户举报，决定驳回或下架",
            "遇到严重违规帖子时可提交下架申请，由上级管理员审批",
        ],
    },
    2: {
        greeting: "欢迎回来，Haven 的守护者。你的审批让每一条处理都更审慎。",
        duties: [
            "包含一级管理员的全部职责",
            "审批一级管理员提交的下架申请，决定帖子是否下架",
            "对违规帖子直接执行下架，无需等待申请",
        ],
    },
    3: {
        greeting: "欢迎回来，Haven 的秩序维护者。用户与内容的健康都离不开你的把关。",
        duties: [
            "包含一、二级管理员的全部职责",
            "查看用户信息与用户发布的帖子，掌握账号风险",
            "封禁违规账号、撤销封禁，并处理用户的封禁申诉",
            "查看后台首页看板，了解举报、封禁与申诉的整体趋势",
        ],
    },
    4: {
        greeting: "欢迎回来，Haven 的最高管理者。系统的稳定与公平由你掌舵。",
        duties: [
            "包含一、二、三级管理员的全部职责",
            "管理管理员账号，分配不同等级的管理员",
            "维护角色与权限，决定每个等级可以做什么",
            "统筹全局数据，保障 Haven 社区的长期健康",
        ],
    },
}

// 获取当前管理员的职位描述（问候语 + 职责 + 权限码）
module.exports.roleDescription = (req, res) => {
    const sql = `SELECT a.id, a.username, a.role_id, r.role_name, r.role_level
                 FROM admins a LEFT JOIN admin_roles r ON r.id = a.role_id
                 WHERE a.id = ?`
    db.query(sql, [req.admin.id], (err, rows) => {
        if (err) {
            console.error("查询管理员职位失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("账号不存在，请重新登录", 1, 401)
        const me = rows[0]
        const level = Number(me.role_level) || 1
        const brief = ROLE_BRIEF[level] || ROLE_BRIEF[1]

        const permSql = `SELECT p.perm_code, p.perm_name
                         FROM admin_role_permissions rp
                         JOIN admin_permissions p ON p.id = rp.perm_id
                         WHERE rp.role_id = ?
                         ORDER BY p.id`
        db.query(permSql, [me.role_id], (err2, perms) => {
            if (err2) {
                console.error("查询管理员权限失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            res.send({
                status: 0,
                msg: "获取成功",
                data: {
                    level,
                    role_name: me.role_name || "",
                    nickname: me.username,
                    greeting: brief.greeting,
                    duties: brief.duties,
                    permissions: perms.map((p) => p.perm_code),
                    permission_names: perms.map((p) => p.perm_name),
                },
            })
        })
    })
}

// Promise 版查询，仅用于首页这种需要并行统计的场景
function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
    })
}

// 最近 7 天（含今天）的日期序列，格式 YYYY-MM-DD
function last7Dates() {
    const dates = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const pad = (n) => String(n).padStart(2, "0")
        dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
    }
    return dates
}

// 把按天聚合的结果映射到固定 7 天序列（没有数据的日期补 0）
function fillTrend(dates, rows) {
    const map = new Map(rows.map((r) => [r.d, Number(r.c)]))
    return dates.map((d) => map.get(d) || 0)
}

// 首页看板：按等级返回不同数据（覆盖式，结构统一为 stats + trend）
// 一级：举报相关（统计 + 趋势）；二级：下架申请相关（统计 + 趋势）；三级及以上暂未设计
module.exports.dashboardOverview = async (req, res) => {
    try {
        const admins = await queryAsync(
            `SELECT a.id, a.username, a.role_id, r.role_name, r.role_level
             FROM admins a LEFT JOIN admin_roles r ON r.id = a.role_id
             WHERE a.id = ?`,
            [req.admin.id]
        )
        if (admins.length === 0) return req.cc("账号不存在，请重新登录", 1, 401)
        const me = admins[0]
        const level = Number(me.role_level) || 1

        const dates = last7Dates()
        const since = dates[0] + " 00:00:00"
        const today = dates[6]

        // 通用结构：level / role_name 恒定；stats 是当前等级的概览数字，trend 是近 7 天趋势
        // 不同等级返回不同的 stats / trend（覆盖式，不追加），字段名保持通用
        const data = {
            level,
            role_name: me.role_name || "",
            stats: {},
            trend: {},
        }

        if (level === 1) {
            // 一级：待处理举报 / 今日新增举报 / 今日处理举报 + 近 7 天举报趋势
            const [pendingTrendRows, handledTrendRows, pendingReports, todayNew, todayHandled] = await Promise.all([
                queryAsync(
                    `SELECT DATE_FORMAT(create_at, '%Y-%m-%d') AS d, COUNT(*) AS c
                     FROM post_reports WHERE status = 0 AND create_at >= ? GROUP BY d`,
                    [since]
                ),
                queryAsync(
                    `SELECT DATE_FORMAT(handle_at, '%Y-%m-%d') AS d, COUNT(*) AS c
                     FROM post_reports WHERE status = 1 AND handle_at >= ? GROUP BY d`,
                    [since]
                ),
                queryAsync("SELECT COUNT(*) AS c FROM post_reports WHERE status = 0"),
                queryAsync(
                    "SELECT COUNT(*) AS c FROM post_reports WHERE create_at >= ? AND create_at < DATE_ADD(?, INTERVAL 1 DAY)",
                    [today, today]
                ),
                queryAsync(
                    "SELECT COUNT(*) AS c FROM post_reports WHERE status = 1 AND handle_at >= ? AND handle_at < DATE_ADD(?, INTERVAL 1 DAY)",
                    [today, today]
                ),
            ])
            data.stats = {
                pending_reports: Number(pendingReports[0].c),
                today_new_reports: Number(todayNew[0].c),
                today_handled_reports: Number(todayHandled[0].c),
            }
            data.trend = {
                dates,
                pending_reports: fillTrend(dates, pendingTrendRows),
                handled_reports: fillTrend(dates, handledTrendRows),
            }
        } else if (level === 2) {
            // 二级：待处理下架申请 / 待处理举报 + 近 7 天下架申请趋势
            const [submittedRows, handledRows, pendingApps, pendingReports] = await Promise.all([
                queryAsync(
                    `SELECT DATE_FORMAT(create_at, '%Y-%m-%d') AS d, COUNT(*) AS c
                     FROM post_offline_applications WHERE create_at >= ? GROUP BY d`,
                    [since]
                ),
                queryAsync(
                    `SELECT DATE_FORMAT(handle_at, '%Y-%m-%d') AS d, COUNT(*) AS c
                     FROM post_offline_applications WHERE status IN (1, 2) AND handle_at >= ? GROUP BY d`,
                    [since]
                ),
                queryAsync("SELECT COUNT(*) AS c FROM post_offline_applications WHERE status = 0"),
                queryAsync("SELECT COUNT(*) AS c FROM post_reports WHERE status = 0"),
            ])
            data.stats = {
                pending_applications: Number(pendingApps[0].c),
                pending_reports: Number(pendingReports[0].c),
            }
            data.trend = {
                dates,
                submitted: fillTrend(dates, submittedRows),
                handled: fillTrend(dates, handledRows),
            }
        }
        // 三级及以上：封禁相关（当前封禁 / 待处理申诉）+ 近 7 天封禁与申诉趋势
        if (level >= 3) {
            const [banRows, appealRows, activeBans, pendingAppeals] = await Promise.all([
                queryAsync(
                    `SELECT DATE_FORMAT(ban_at, '%Y-%m-%d') AS d, COUNT(*) AS c
                     FROM user_ban_records WHERE ban_at >= ? GROUP BY d`,
                    [since]
                ),
                queryAsync(
                    `SELECT DATE_FORMAT(create_at, '%Y-%m-%d') AS d, COUNT(*) AS c
                     FROM user_ban_appeals WHERE create_at >= ? GROUP BY d`,
                    [since]
                ),
                // 当前仍处封禁中的用户：临时封禁已到期的自动视为已解封
                queryAsync(
                    "SELECT COUNT(*) AS c FROM userinfo WHERE status = 0 AND (ban_until IS NULL OR ban_until > NOW())"
                ),
                queryAsync("SELECT COUNT(*) AS c FROM user_ban_appeals WHERE status = 0"),
            ])
            data.stats = {
                active_bans: Number(activeBans[0].c),
                pending_appeals: Number(pendingAppeals[0].c),
            }
            data.trend = {
                dates,
                banned: fillTrend(dates, banRows),
                appeals: fillTrend(dates, appealRows),
            }
        }

        res.send({ status: 0, msg: "获取成功", data })
    } catch (err) {
        console.error("查询首页看板失败:", err)
        return req.cc("服务器异常", 1, 500)
    }
}

// 封禁操作记录（三级及以上）：按处理时间倒序，可按处理时间筛选
module.exports.banRecordList = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const size = Math.min(Math.max(parseInt(req.query.size, 10) || 12, 1), 50)
    const offset = (page - 1) * size

    // 处理时间筛选：date 优先（当天闭区间），否则 start_date/end_date 区间
    const date = String(req.query.date || "").trim()
    const startDate = String(req.query.start_date || "").trim()
    const endDate = String(req.query.end_date || "").trim()
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (date && !DATE_RE.test(date)) return req.cc("date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && !DATE_RE.test(startDate)) return req.cc("start_date 格式应为 YYYY-MM-DD", 1, 400)
    if (endDate && !DATE_RE.test(endDate)) return req.cc("end_date 格式应为 YYYY-MM-DD", 1, 400)
    if (startDate && endDate && startDate > endDate) return req.cc("start_date 不能晚于 end_date", 1, 400)

    const conds = []
    const params = []
    if (date) {
        conds.push("r.ban_at >= ? AND r.ban_at < DATE_ADD(?, INTERVAL 1 DAY)")
        params.push(date, date)
    } else {
        if (startDate) {
            conds.push("r.ban_at >= ?")
            params.push(startDate)
        }
        if (endDate) {
            conds.push("r.ban_at < DATE_ADD(?, INTERVAL 1 DAY)")
            params.push(endDate)
        }
    }
    const DATE_WHERE = conds.length ? " WHERE " + conds.join(" AND ") : ""

    db.query(`SELECT COUNT(*) AS total FROM user_ban_records r${DATE_WHERE}`, params, (err, cntRows) => {
        if (err) {
            console.error("统计封禁记录失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        const total = Number(cntRows[0].total)

        const sql = `SELECT r.id, r.user_id, u.username AS nickname, r.reason, r.duration,
                            r.ban_at, r.ban_until, a.username AS operator_name,
                            r.unban_reason, r.unban_at,
                            u.status AS user_status, u.ban_until AS user_ban_until
                     FROM user_ban_records r
                     LEFT JOIN userinfo u ON u.id = r.user_id
                     LEFT JOIN admins a ON a.id = r.operator_id
                     ${DATE_WHERE}
                     ORDER BY r.ban_at DESC, r.id DESC
                     LIMIT ? OFFSET ?`
        db.query(sql, [...params, size, offset], (err2, rows) => {
            if (err2) {
                console.error("查询封禁记录失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            const list = rows.map((r) => {
                // 账号当前状态：临时封禁已到期的按解封算
                const banned =
                    Number(r.user_status) === 0 &&
                    (!r.user_ban_until || new Date(r.user_ban_until).getTime() > Date.now())
                return {
                    record_id: r.id,
                    user_id: r.user_id,
                    nickname: r.nickname || "已注销用户",
                    ban_reason: r.reason,
                    ban_duration: r.duration,
                    ban_until: r.ban_until ? formatDateTime(r.ban_until) : "永久",
                    handled_at: formatDateTime(r.ban_at),
                    operator_name: r.operator_name || "无",
                    account_status: banned ? "banned" : "normal",
                    account_status_text: banned ? "封禁" : "解封",
                    unban_reason: r.unban_reason || "无",
                    unban_at: r.unban_at ? formatDateTime(r.unban_at) : "无",
                }
            })
            res.send({
                status: 0,
                msg: "查询成功",
                data: { list, page, size, total, hasMore: offset + list.length < total },
            })
        })
    })
}

// 用户详情（三级及以上）：发帖数量、昵称、头像、注册邮箱、注册时间
module.exports.userDetail = (req, res) => {
    const idCheck = parseId(req.params.id, "用户 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const userId = idCheck.id

    const sql = `SELECT u.id AS user_id, u.username AS nickname, u.avatar, u.email,
                        u.create_at, u.status AS account_status, u.ban_reason, u.ban_at, u.ban_until,
                        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND status = 1) AS post_count
                 FROM userinfo u
                 WHERE u.id = ?`
    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("查询用户详情失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) return req.cc("用户不存在", 1, 404)

        const u = rows[0]
        // 头像存的是相对路径时补全成完整地址，前端可直接渲染
        const avatar = u.avatar
            ? String(u.avatar).startsWith("http")
                ? u.avatar
                : `${req.protocol}://${req.get("host")}${u.avatar}`
            : null
        // 封禁已到期的按正常展示（C 端登录时会自动恢复）
        const banExpired = u.ban_until && new Date(u.ban_until).getTime() <= Date.now()
        const isBanned = Number(u.account_status) !== 1 && !banExpired

        res.send({
            status: 0,
            msg: "查询成功",
            data: {
                user_id: u.user_id,
                nickname: u.nickname,
                avatar,
                email: u.email || null,
                register_at: u.create_at ? formatDateTime(u.create_at) : "无",
                post_count: Number(u.post_count),
                status: isBanned ? "banned" : "normal",
                status_text: isBanned ? "被封禁" : "正常",
                ban_reason: isBanned ? u.ban_reason || "无" : "无",
                ban_at: isBanned && u.ban_at ? formatDateTime(u.ban_at) : "无",
                ban_until: isBanned ? (u.ban_until ? formatDateTime(u.ban_until) : "永久") : "无",
            },
        })
    })
}

// 用户发的帖子（三级及以上）：固定每页 10 条，按发布时间倒序
module.exports.userPosts = (req, res) => {
    const idCheck = parseId(req.params.id, "用户 id")
    if (idCheck.error) return req.cc(idCheck.error, 1, 400)
    const userId = idCheck.id

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const size = 10
    const offset = (page - 1) * size

    db.query("SELECT id FROM userinfo WHERE id = ?", [userId], (err, users) => {
        if (err) {
            console.error("查询用户失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (users.length === 0) return req.cc("用户不存在", 1, 404)

        db.query("SELECT COUNT(*) AS total FROM posts WHERE user_id = ?", [userId], (err2, cntRows) => {
            if (err2) {
                console.error("统计用户帖子失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            const total = Number(cntRows[0].total)

            const sql = `SELECT id, content, images, category, view_count, like_count, comment_count,
                                status, report_status, offline_reason, created_at
                         FROM posts
                         WHERE user_id = ?
                         ORDER BY created_at DESC, id DESC
                         LIMIT ? OFFSET ?`
            db.query(sql, [userId, size, offset], (err3, rows) => {
                if (err3) {
                    console.error("查询用户帖子失败:", err3)
                    return req.cc("服务器异常", 1, 500)
                }
                const list = rows.map((r) => {
                    // 下架优先于删除：帖子被下架后仍 status=1
                    let state = { status: "normal", status_text: "正常" }
                    if (Number(r.report_status) === 3) state = { status: "offline", status_text: "已下架" }
                    else if (Number(r.status) !== 1) state = { status: "deleted", status_text: "已删除" }

                    return {
                        post_id: r.id,
                        content: r.content || "",
                        images: typeof r.images === "string" ? JSON.parse(r.images) : (r.images || []),
                        category: r.category,
                        view_count: Number(r.view_count),
                        like_count: Number(r.like_count),
                        comment_count: Number(r.comment_count),
                        status: state.status,
                        status_text: state.status_text,
                        offline_reason: r.offline_reason || "无",
                        created_at: r.created_at ? formatDateTime(r.created_at) : "无",
                    }
                })
                res.send({
                    status: 0,
                    msg: "查询成功",
                    data: { list, page, size, total, hasMore: offset + list.length < total },
                })
            })
        })
    })
}
