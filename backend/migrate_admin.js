// B 端后台：RBAC 建表 + 种子数据
// 幂等设计：可重复执行，已存在的表/角色/权限不会重复创建
const db = require("./db/index")
const bcrypt = require("bcryptjs")

// 种子管理员账号：按用户名幂等创建，已存在的不会重复插入
// 一级/二级/三级各一个，方便按等级验证动态路由差异
const SEED_ADMINS = [
    {
        username: "admin",
        password: process.env.ADMIN_SEED_PASSWORD || "Admin@123456",
        nickname: "一级管理员",
        email: "admin@haven.local",
        roleLevel: 1,
    },
    {
        username: "admin2",
        password: process.env.ADMIN2_SEED_PASSWORD || "Admin2@123456",
        nickname: "二级管理员",
        email: "admin2@haven.local",
        roleLevel: 2,
    },
    {
        username: "admin3",
        password: process.env.ADMIN3_SEED_PASSWORD || "Admin3@123456",
        nickname: "三级管理员",
        email: "admin3@haven.local",
        roleLevel: 3,
    },
]

// 角色：按等级递进，等级越高包含越低等级的全部权限和菜单
const ROLES = [
    { level: 1, name: "一级管理员", description: "巡查帖子、处理举报、驳回；下架帖子需提交申请" },
    { level: 2, name: "二级管理员", description: "继承一级权限但不可申请下架，并审批一级提交的下架申请" },
    { level: 3, name: "三级管理员", description: "含一、二级全部权限，并封禁账号、查看用户信息、可视化大屏" },
    { level: 4, name: "超级管理员", description: "含一、二、三级全部权限，并管理管理员账号与角色权限" },
]

// 权限点：minLevel / maxLevel 定义「哪些等级拥有该权限」的闭区间
// 不写 maxLevel 默认 4（向上继承）；写 maxLevel 则是「仅低等级可用」的能力
// 例：申请下架只属于一级——申请是「没有终审权时上报」的通道，
// 二级及以上能直接下架，再申请就是多余的，还会出现自己申请自己审批
const PERMISSIONS = [
    { code: "post:view", name: "巡查帖子", minLevel: 1, type: "menu" },
    { code: "report:list", name: "查看举报列表", minLevel: 1, type: "menu" },
    { code: "report:handle", name: "处理举报", minLevel: 1, type: "button" },
    { code: "post:reject", name: "驳回帖子", minLevel: 1, type: "button" },
    { code: "post:offline:apply", name: "申请下架帖子", minLevel: 1, maxLevel: 1, type: "button" },
    { code: "post:offline", name: "下架帖子", minLevel: 2, type: "button" },
    { code: "post:offline:approve", name: "审批下架申请", minLevel: 2, type: "button" },
    { code: "user:view", name: "查看用户信息", minLevel: 3, type: "menu" },
    { code: "user:ban", name: "封禁/解封账号", minLevel: 3, type: "button" },
    { code: "dashboard:view", name: "可视化大屏", minLevel: 3, type: "menu" },
    { code: "dashboard:user_active", name: "用户日活量", minLevel: 3, type: "button" },
    { code: "dashboard:post_daily", name: "日发帖量", minLevel: 3, type: "button" },
]

// 菜单/路由种子：path 是唯一键，minLevel 表示可见的最低等级（和权限一样按等级继承）
// maxLevel 用于「仅某一等级可见」的场景，不写默认 4（即所有更高等级都可见）
// component 对应 src/views 下的文件（不含 .vue），pages 层级：目录 path=/post，页面 path=/post/find
// 页面 path 必须写成「父路径 + 子段」的绝对路径，pure-admin 的动态路由靠绝对 path 注册
const MENUS = [
    // 帖子管理
    { path: "/post", name: null, type: 1, title: "帖子管理", icon: "ep:document", sort: 1, minLevel: 1, component: null },
    { path: "/post/find", name: "PostFind", type: 2, title: "帖子巡查", icon: null, sort: 11, minLevel: 1, component: "PostManagement/FindPost/index" },
    // 下架申请只给一级：二级及以上可以直接下架，不需要走申请流程
    { path: "/post/out-apply", name: "PostOutApply", type: 2, title: "下架申请", icon: null, sort: 12, minLevel: 1, maxLevel: 1, component: "PostManagement/OutApply/index" },
    { path: "/post/exame", name: "PostExame", type: 2, title: "下架审批", icon: null, sort: 13, minLevel: 2, component: "PostManagement/DecideApply/index" },
    { path: "/post/examine-record", name: "ExamineRecord", type: 2, title: "审批记录", icon: null, sort: 14, minLevel: 2, component: "PostManagement/ExamineRecord/index" },

    // 举报中心
    { path: "/report", name: null, type: 1, title: "举报中心", icon: "ep:warning", sort: 2, minLevel: 1, component: null },
    { path: "/report/appending", name: "ReportAppending", type: 2, title: "待处理举报", icon: null, sort: 21, minLevel: 1, component: "ReportManagement/AppendingReport/index" },
    { path: "/report/record", name: "ReportRecord", type: 2, title: "举报处理记录", icon: null, sort: 22, minLevel: 1, component: "ReportManagement/ReportRecord/index" },

    // 用户管理（仅三级及以上）
    { path: "/user", name: null, type: 1, title: "用户管理", icon: "ep:user", sort: 3, minLevel: 3, component: null },
    { path: "/user/list", name: "UserList", type: 2, title: "用户列表", icon: null, sort: 31, minLevel: 3, component: "UserManagement/UserList/index" },
    { path: "/user/ban", name: "UserBan", type: 2, title: "封禁管理", icon: null, sort: 32, minLevel: 3, component: "UserManagement/BanManagement/index" },
    // 用户详情：三级及以上可用，但隐藏不渲染菜单（visible=0 -> meta.showLink=false）
    // top=true 表示不挂父目录，作为顶级隐藏路由注册；前端用 /userdetail/:id 跳转
    { path: "/userdetail/:id", name: "userdetail", type: 2, title: "用户详情", icon: null, sort: 33, minLevel: 3, visible: 0, top: true, component: "UserInfo/index" },

    // 系统管理（仅四级超级管理员）
    { path: "/system", name: null, type: 1, title: "系统管理", icon: "ep:setting", sort: 4, minLevel: 4, component: null },
    { path: "/system/account", name: "SystemAccount", type: 2, title: "管理员账号管理", icon: null, sort: 41, minLevel: 4, component: "SystemManagement/AccountManagement/index" },
    { path: "/system/role", name: "SystemRole", type: 2, title: "角色权限管理", icon: null, sort: 42, minLevel: 4, component: "SystemManagement/RoleManagement/index" },
]

// 菜单 path 只有一段的是目录，多段的父路径取第一段
function parentPathOf(path) {
    const parts = String(path).split("/").filter(Boolean)
    return parts.length > 1 ? "/" + parts[0] : null
}

const CREATE_TABLES = [
    `CREATE TABLE IF NOT EXISTS admin_roles (
        id          INT             PRIMARY KEY AUTO_INCREMENT,
        role_level  TINYINT         NOT NULL UNIQUE,
        role_name   VARCHAR(45)     NOT NULL,
        description VARCHAR(200),
        create_at   DATETIME        DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS admin_permissions (
        id          INT             PRIMARY KEY AUTO_INCREMENT,
        perm_code   VARCHAR(64)     NOT NULL UNIQUE,
        perm_name   VARCHAR(64)     NOT NULL,
        type        VARCHAR(20)     NOT NULL DEFAULT 'api',
        description VARCHAR(200),
        create_at   DATETIME        DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS admins (
        id            INT             PRIMARY KEY AUTO_INCREMENT,
        username      VARCHAR(45)     NOT NULL UNIQUE,
        password      VARCHAR(255)    NOT NULL,
        nickname      VARCHAR(45),
        avatar        VARCHAR(500),
        email         VARCHAR(100),
        role_id       INT             NOT NULL,
        status        TINYINT(1)      NOT NULL DEFAULT 1,
        last_login_at DATETIME        DEFAULT NULL,
        last_login_ip VARCHAR(45)     DEFAULT NULL,
        create_at     DATETIME        DEFAULT CURRENT_TIMESTAMP,
        update_at     DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS admin_role_permissions (
        id       INT  PRIMARY KEY AUTO_INCREMENT,
        role_id  INT  NOT NULL,
        perm_id  INT  NOT NULL,
        UNIQUE KEY uk_role_perm (role_id, perm_id),
        INDEX idx_role (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 菜单/路由表：B 端动态路由的数据源，扁平结构(parent_id)，后端查出后组装成树返回
    // menu_type: 1=目录(仅分组，不渲染页面) 2=菜单(真实页面，会注册成前端路由)
    // 按钮级权限不放这张表，统一走 admin_permissions（登录接口返回 permissions，前端用 v-perms 判断）
    // component 是 src/views 下的相对路径（不含 .vue），前端用 import.meta.glob 配对组件
    `CREATE TABLE IF NOT EXISTS admin_menus (
        id          INT             PRIMARY KEY AUTO_INCREMENT,
        parent_id   INT             NOT NULL DEFAULT 0,
        menu_type   TINYINT         NOT NULL DEFAULT 2,
        menu_name   VARCHAR(50)     NOT NULL,
        route_name  VARCHAR(100)    DEFAULT NULL,
        path        VARCHAR(200)    DEFAULT NULL,
        component   VARCHAR(200)    DEFAULT NULL,
        redirect    VARCHAR(200)    DEFAULT NULL,
        icon        VARCHAR(100)    DEFAULT NULL,
        perm_code   VARCHAR(64)     DEFAULT NULL,
        frame_src   VARCHAR(500)    DEFAULT NULL,
        sort        INT             NOT NULL DEFAULT 0,
        visible     TINYINT(1)      NOT NULL DEFAULT 1,
        keep_alive  TINYINT(1)      NOT NULL DEFAULT 0,
        always_show TINYINT(1)      NOT NULL DEFAULT 0,
        status      TINYINT(1)      NOT NULL DEFAULT 1,
        remark      VARCHAR(200)    DEFAULT NULL,
        create_at   DATETIME        DEFAULT CURRENT_TIMESTAMP,
        update_at   DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent (parent_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 角色-菜单映射表：不同角色登录后拿到不同的路由树
    `CREATE TABLE IF NOT EXISTS admin_role_menus (
        id       INT  PRIMARY KEY AUTO_INCREMENT,
        role_id  INT  NOT NULL,
        menu_id  INT  NOT NULL,
        UNIQUE KEY uk_role_menu (role_id, menu_id),
        INDEX idx_role (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 帖子下架申请表：一级管理员提交，二级及以上审批
    // status: 0 待处理 / 1 处理完成（帖子已下架） / 2 已驳回（帖子保留）
    //         3 已撤销（申请人自己撤回） / 4 申诉中（申请人对驳回结果申诉）
    // pending_post_id 是生成列：仅当 status=0 时等于 post_id，否则为 NULL
    // 配合唯一索引，从数据库层保证「同一帖子最多只有一条待处理申请」，避免重复提交
    `CREATE TABLE IF NOT EXISTS post_offline_applications (
        id              INT          PRIMARY KEY AUTO_INCREMENT,
        post_id         INT          NOT NULL,
        applicant_id    INT          NOT NULL,
        apply_reason    VARCHAR(50)  NOT NULL,
        status          TINYINT      NOT NULL DEFAULT 0,
        handle_by       INT          DEFAULT NULL,
        handle_reason   VARCHAR(50)  DEFAULT NULL,
        handle_at       DATETIME     DEFAULT NULL,
        appeal_reason   VARCHAR(50)  DEFAULT NULL,
        appeal_at       DATETIME     DEFAULT NULL,
        appeal_handle_by     INT         DEFAULT NULL,
        appeal_handle_reason VARCHAR(50) DEFAULT NULL,
        appeal_handle_at     DATETIME    DEFAULT NULL,
        create_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
        record_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
        pending_post_id INT GENERATED ALWAYS AS (IF(status = 0, post_id, NULL)) STORED,
        UNIQUE KEY uk_pending_post (pending_post_id),
        INDEX idx_post (post_id),
        INDEX idx_applicant (applicant_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // refresh token 表：只存 sha256 摘要（不存原始 token），
    // 每次刷新都会删除旧记录并写入新记录，实现「一次一换」
    `CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
        id         INT          PRIMARY KEY AUTO_INCREMENT,
        admin_id   INT          NOT NULL,
        token_hash CHAR(64)     NOT NULL UNIQUE,
        expires_at DATETIME     NOT NULL,
        create_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin (admin_id),
        INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 封禁操作记录：解封只清 userinfo 上的封禁信息，历史记录保留在这里
    `CREATE TABLE IF NOT EXISTS user_ban_records (
        id          INT          PRIMARY KEY AUTO_INCREMENT,
        user_id     INT          NOT NULL,
        reason      VARCHAR(50)  NOT NULL,
        duration    VARCHAR(20)  NOT NULL,
        ban_at      DATETIME     NOT NULL,
        ban_until   DATETIME     DEFAULT NULL,
        operator_id INT          NOT NULL,
        unban_reason VARCHAR(50) DEFAULT NULL,
        unban_by    INT          DEFAULT NULL,
        unban_at    DATETIME     DEFAULT NULL,
        create_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_ban_at (ban_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 封禁申诉表：用户对被封禁的结果不满意时提交，三级管理员处理
    // status: 0 待处理 / 1 同意（撤销封禁） / 2 驳回（维持封禁）
    `CREATE TABLE IF NOT EXISTS user_ban_appeals (
        id            INT          PRIMARY KEY AUTO_INCREMENT,
        user_id       INT          NOT NULL,
        ban_record_id INT          DEFAULT NULL,
        appeal_reason VARCHAR(50)  NOT NULL,
        status        TINYINT      NOT NULL DEFAULT 0,
        handle_by     INT          DEFAULT NULL,
        handle_reason VARCHAR(50)  DEFAULT NULL,
        handle_at     DATETIME     DEFAULT NULL,
        create_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_create (create_at),
        UNIQUE KEY uk_user_ban (user_id, ban_record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]

function runSequential(tasks, done) {
    let i = 0
    const next = (err) => {
        if (err) return done(err)
        if (i >= tasks.length) return done(null)
        tasks[i++](next)
    }
    next(null)
}

function ensureTables(cb) {
    const tasks = CREATE_TABLES.map((sql) => (next) => db.query(sql, (err) => next(err)))
    runSequential(tasks, (err) => {
        if (err) return cb(err)
        console.log("[migrate] B端 RBAC 表已就绪")
        cb(null)
    })
}

// C 端用户账号状态：1 正常 / 0 封禁。历史数据默认全部正常
function ensureUserStatusColumn(cb) {
    db.query("SHOW COLUMNS FROM ?? LIKE ?", ["userinfo", "status"], (err, rows) => {
        if (err) return cb(err)
        if (rows.length) return cb(null)
        db.query(
            "ALTER TABLE ?? ADD COLUMN ?? TINYINT(1) NOT NULL DEFAULT 1 AFTER ??",
            ["userinfo", "status", "email"],
            (err2) => {
                if (err2) return cb(err2)
                console.log("[migrate] userinfo.status 已添加")
                cb(null)
            }
        )
    })
}

// 封禁信息：理由、操作人、封禁时间，便于封禁管理页回看
function ensureUserBanColumns(cb) {
    const cols = [
        ["ban_reason", "VARCHAR(50) DEFAULT NULL", "status"],
        ["ban_by", "INT DEFAULT NULL", "ban_reason"],
        ["ban_at", "DATETIME DEFAULT NULL", "ban_by"],
        ["ban_until", "DATETIME DEFAULT NULL", "ban_at"],
        ["create_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP", "ban_until"],
    ]
    let i = 0
    const next = (err) => {
        if (err) return cb(err)
        if (i >= cols.length) return cb(null)
        const [col, def, after] = cols[i++]
        db.query("SHOW COLUMNS FROM ?? LIKE ?", ["userinfo", col], (e, rows) => {
            if (e) return next(e)
            if (rows.length) return next(null)
            db.query(`ALTER TABLE ?? ADD COLUMN ?? ${def} AFTER ??`, ["userinfo", col, after], (e2) => {
                if (e2) return next(e2)
                console.log(`[migrate] userinfo.${col} 已添加`)
                next(null)
            })
        })
    }
    next(null)
}

// 封禁记录表补撤销封禁相关字段（老表升级用）
function ensureBanRecordColumns(cb) {
    const cols = [
        ["unban_reason", "VARCHAR(50) DEFAULT NULL", "operator_id"],
        ["unban_by", "INT DEFAULT NULL", "unban_reason"],
        ["unban_at", "DATETIME DEFAULT NULL", "unban_by"],
    ]
    let i = 0
    const next = (err) => {
        if (err) return cb(err)
        if (i >= cols.length) return cb(null)
        const [col, def, after] = cols[i++]
        db.query("SHOW COLUMNS FROM ?? LIKE ?", ["user_ban_records", col], (e, rows) => {
            if (e) return next(e)
            if (rows.length) return next(null)
            db.query(`ALTER TABLE ?? ADD COLUMN ?? ${def} AFTER ??`, ["user_ban_records", col, after], (e2) => {
                if (e2) return next(e2)
                console.log(`[migrate] user_ban_records.${col} 已添加`)
                next(null)
            })
        })
    }
    next(null)
}

// 封禁申诉表补「同一用户同一次封禁只能申诉一次」的唯一索引（老表升级用）
function ensureBanAppealIndex(cb) {
    db.query("SHOW INDEX FROM user_ban_appeals WHERE Key_name = 'uk_user_ban'", (err, rows) => {
        if (err) return cb(err)
        if (rows.length) return cb(null)
        db.query(
            "ALTER TABLE user_ban_appeals ADD UNIQUE KEY uk_user_ban (user_id, ban_record_id)",
            (err2) => {
                if (err2) return cb(err2)
                console.log("[migrate] user_ban_appeals.uk_user_ban 已添加")
                cb(null)
            }
        )
    })
}

// 申诉相关字段（已存在的表补齐，CREATE TABLE IF NOT EXISTS 不会给旧表加字段）
function ensureOfflineApplicationColumns(cb) {
    const cols = [
        ["appeal_reason", "VARCHAR(50) DEFAULT NULL", "handle_at"],
        ["appeal_at", "DATETIME DEFAULT NULL", "appeal_reason"],
        ["appeal_handle_by", "INT DEFAULT NULL", "appeal_at"],
        ["appeal_handle_reason", "VARCHAR(50) DEFAULT NULL", "appeal_handle_by"],
        ["appeal_handle_at", "DATETIME DEFAULT NULL", "appeal_handle_reason"],
        // 审批记录页的软删除标记：删除记录只影响记录展示，不改申请本身的审批结果
        ["record_deleted", "TINYINT(1) NOT NULL DEFAULT 0", "create_at"],
    ]
    let i = 0
    const next = (err) => {
        if (err) return cb(err)
        if (i >= cols.length) return cb(null)
        const [col, def, after] = cols[i++]
        db.query("SHOW COLUMNS FROM ?? LIKE ?", ["post_offline_applications", col], (e, rows) => {
            if (e) return next(e)
            if (rows.length) return next(null)
            db.query(
                `ALTER TABLE ?? ADD COLUMN ?? ${def} AFTER ??`,
                ["post_offline_applications", col, after],
                (e2) => {
                    if (e2) return next(e2)
                    console.log(`[migrate] post_offline_applications.${col} 已添加`)
                    next(null)
                }
            )
        })
    }
    next(null)
}

// 举报表补充字段：记录「该举报是被哪条下架申请收尾的」，
// 申请被驳回/撤销时据此把举报恢复成待处理，避免举报凭空丢失
function ensurePostReportColumns(cb) {
    db.query("SHOW COLUMNS FROM ?? LIKE ?", ["post_reports", "offline_application_id"], (err, rows) => {
        if (err) return cb(err)
        if (rows.length) return ensureRecordDeletedColumn(cb)
        db.query(
            "ALTER TABLE ?? ADD COLUMN ?? INT DEFAULT NULL AFTER ??, ADD INDEX idx_offline_application (offline_application_id)",
            ["post_reports", "offline_application_id", "handle_by"],
            (err2) => {
                if (err2) return cb(err2)
                console.log("[migrate] post_reports.offline_application_id 已添加")
                ensureRecordDeletedColumn(cb)
            }
        )
    })
}

// record_deleted：管理员删除「举报处理记录」时只置位不删行，
// 保留 C 端用户的举报历史和通知关联
function ensureRecordDeletedColumn(cb) {
    db.query("SHOW COLUMNS FROM ?? LIKE ?", ["post_reports", "record_deleted"], (err, rows) => {
        if (err) return cb(err)
        if (rows.length) return cb(null)
        db.query(
            "ALTER TABLE ?? ADD COLUMN ?? TINYINT(1) NOT NULL DEFAULT 0 AFTER ??",
            ["post_reports", "record_deleted", "handle_by"],
            (err2) => {
                if (err2) return cb(err2)
                console.log("[migrate] post_reports.record_deleted 已添加")
                cb(null)
            }
        )
    })
}

function seedRoles(cb) {
    const tasks = ROLES.map((r) => (next) =>
        db.query(
            "INSERT INTO admin_roles (role_level, role_name, description) VALUES (?,?,?) ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description)",
            [r.level, r.name, r.description],
            (err) => next(err)
        )
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)
        console.log("[migrate] 管理员角色已就绪（一级/二级/三级/四级）")
        cb(null)
    })
}

function seedPermissions(cb) {
    const tasks = PERMISSIONS.map((p) => (next) =>
        db.query(
            "INSERT INTO admin_permissions (perm_code, perm_name, type, description) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE perm_name = VALUES(perm_name), type = VALUES(type)",
            [p.code, p.name, p.type, `等级 ${p.minLevel}~${p.maxLevel || 4} 拥有`],
            (err) => next(err)
        )
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)
        console.log("[migrate] 管理员权限点已就绪")
        cb(null)
    })
}

// 按 [minLevel, maxLevel] 给角色分配权限：minLevel 实现向上继承，
// maxLevel 实现「仅低等级可用」（如申请下架只给一级）。
// 超出 maxLevel 的历史授权会被删掉，否则改了 maxLevel 也拦不住老账号
function seedRolePermissions(cb) {
    const tasks = PERMISSIONS.map((p) => (next) =>
        db.query(
            `INSERT IGNORE INTO admin_role_permissions (role_id, perm_id)
             SELECT r.id, p.id FROM admin_roles r, admin_permissions p
             WHERE p.perm_code = ? AND r.role_level >= ? AND r.role_level <= ?`,
            [p.code, p.minLevel, p.maxLevel || 4],
            (err) => next(err)
        )
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)

        const cleanupTasks = PERMISSIONS.filter((p) => p.maxLevel).map((p) => (next) =>
            db.query(
                `DELETE rp FROM admin_role_permissions rp
                 JOIN admin_permissions p ON p.id = rp.perm_id
                 JOIN admin_roles r ON r.id = rp.role_id
                 WHERE p.perm_code = ? AND r.role_level > ?`,
                [p.code, p.maxLevel],
                (err2) => next(err2)
            )
        )
        runSequential(cleanupTasks, (err2) => {
            if (err2) return cb(err2)
            console.log("[migrate] 角色-权限映射已就绪")
            cb(null)
        })
    })
}

// admin_menus 需要 path 唯一索引，种子数据才能用 ON DUPLICATE KEY UPDATE 幂等写入
function ensureMenuPathIndex(cb) {
    db.query("SHOW INDEX FROM admin_menus WHERE Key_name = 'uk_path'", (err, rows) => {
        if (err) return cb(err)
        if (rows.length > 0) return cb(null)
        db.query("ALTER TABLE admin_menus ADD UNIQUE KEY uk_path (path)", (err2) => {
            if (err2) return cb(err2)
            console.log("[migrate] admin_menus 已添加唯一索引 uk_path")
            cb(null)
        })
    })
}

// 写入菜单/路由种子：先插目录，再用目录的 id 作为子菜单的 parent_id
function seedMenus(cb) {
    const insert = (m, parentId, next) =>
        db.query(
            `INSERT INTO admin_menus
                (parent_id, menu_type, menu_name, route_name, path, component, icon, sort, visible, status)
             VALUES (?,?,?,?,?,?,?,?,?,1)
             ON DUPLICATE KEY UPDATE
                parent_id = VALUES(parent_id), menu_type = VALUES(menu_type), menu_name = VALUES(menu_name),
                route_name = VALUES(route_name), component = VALUES(component), icon = VALUES(icon),
                sort = VALUES(sort), visible = VALUES(visible), status = 1`,
            [parentId, m.type, m.title, m.name, m.path, m.component, m.icon, m.sort, m.visible === undefined ? 1 : m.visible],
            next
        )

    const dirs = MENUS.filter((m) => parentPathOf(m.path) === null)
    const pages = MENUS.filter((m) => parentPathOf(m.path) !== null)

    const tasks = dirs.map((m) => (next) => insert(m, 0, next))

    // 目录插完后查出 path -> id，再挂子菜单
    tasks.push((next) =>
        db.query("SELECT id, path FROM admin_menus", (err, rows) => {
            if (err) return next(err)
            const idByPath = {}
            rows.forEach((r) => { idByPath[r.path] = r.id })
            const childTasks = pages.map((m) => (n2) => {
                // top=true 的页面不挂父目录（比如 /userdetail/:id 这种隐藏详情路由）
                if (m.top) return insert(m, 0, n2)
                const pid = idByPath[parentPathOf(m.path)]
                if (!pid) return n2(new Error("未找到菜单父级：" + parentPathOf(m.path)))
                insert(m, pid, n2)
            })
            runSequential(childTasks, next)
        })
    )

    runSequential(tasks, (err) => {
        if (err) return cb(err)
        console.log(`[migrate] B端菜单/路由已就绪（${MENUS.length} 条）`)
        cb(null)
    })
}

// 按 [minLevel, maxLevel] 给角色分配菜单，实现菜单的等级继承；
// 超出范围的旧映射会被清掉，保证改了 maxLevel 后立即生效
function seedRoleMenus(cb) {
    const tasks = MENUS.map((m) => (next) =>
        db.query(
            `INSERT IGNORE INTO admin_role_menus (role_id, menu_id)
             SELECT r.id, m.id FROM admin_roles r, admin_menus m
             WHERE m.path = ? AND r.role_level >= ? AND r.role_level <= ?`,
            [m.path, m.minLevel, m.maxLevel || 4],
            (err) => next(err)
        )
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)

        const cleanupTasks = MENUS.filter((m) => m.maxLevel).map((m) => (next) =>
            db.query(
                `DELETE rm FROM admin_role_menus rm
                 JOIN admin_menus m ON m.id = rm.menu_id
                 JOIN admin_roles r ON r.id = rm.role_id
                 WHERE m.path = ? AND r.role_level > ?`,
                [m.path, m.maxLevel],
                (err2) => next(err2)
            )
        )
        runSequential(cleanupTasks, (err2) => {
            if (err2) return cb(err2)
            console.log("[migrate] 角色-菜单映射已就绪")
            cb(null)
        })
    })
}

// 创建种子管理员账号：按用户名逐个幂等创建（已存在就跳过）
function seedAdminAccounts(cb) {
    const tasks = SEED_ADMINS.map((a) => (next) =>
        db.query("SELECT id FROM admins WHERE username = ?", [a.username], (err, rows) => {
            if (err) return next(err)
            if (rows.length) {
                console.log(`[migrate] 管理员账号 ${a.username} 已存在，跳过`)
                return next(null)
            }
            db.query("SELECT id FROM admin_roles WHERE role_level = ?", [a.roleLevel], (err2, roleRows) => {
                if (err2) return next(err2)
                if (roleRows.length === 0) return next(new Error(`未找到等级 ${a.roleLevel} 的管理员角色，无法创建账号 ${a.username}`))
                db.query(
                    "INSERT INTO admins (username, password, nickname, email, role_id, status) VALUES (?,?,?,?,?,1)",
                    [a.username, bcrypt.hashSync(a.password, 10), a.nickname, a.email, roleRows[0].id],
                    (err3) => {
                        if (err3) return next(err3)
                        console.log(`[migrate] 已创建${a.nickname}账号：${a.username} / ${a.password}`)
                        next(null)
                    }
                )
            })
        })
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)
        cb(null)
    })
}

module.exports = function (done) {
    ensureTables((err) => {
        if (err) return done(err)
        ensureUserStatusColumn((errU) => {
            if (errU) return done(errU)
            ensureUserBanColumns((errB) => {
                if (errB) return done(errB)
                ensureBanRecordColumns((errBR) => {
                    if (errBR) return done(errBR)
                    ensureBanAppealIndex((errBA) => {
                        if (errBA) return done(errBA)
                        ensureOfflineApplicationColumns((errC) => {
                            if (errC) return done(errC)
                            ensurePostReportColumns((errR) => {
                                if (errR) return done(errR)
                                ensureMenuPathIndex((err0) => {
                                    if (err0) return done(err0)
                                    seedRoles((err2) => {
                                        if (err2) return done(err2)
                                        seedPermissions((err3) => {
                                            if (err3) return done(err3)
                                            seedRolePermissions((err4) => {
                                                if (err4) return done(err4)
                                                seedMenus((err5) => {
                                                    if (err5) return done(err5)
                                                    seedRoleMenus((err6) => {
                                                        if (err6) return done(err6)
                                                        seedAdminAccounts(done)
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}
