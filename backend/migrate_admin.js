// B 端后台：RBAC 建表 + 种子数据
// 幂等设计：可重复执行，已存在的表/角色/权限不会重复创建
const db = require("./db/index")
const bcrypt = require("bcryptjs")

// 种子管理员账号（仅在 admins 表为空时创建）
const SEED_ADMIN = {
    username: "admin",
    password: process.env.ADMIN_SEED_PASSWORD || "Admin@123456",
    nickname: "一级管理员",
    email: "admin@haven.local",
    roleLevel: 1,
}

// 角色：按等级递进，等级越高包含越低等级的全部权限
const ROLES = [
    { level: 1, name: "一级管理员", description: "巡查帖子、处理举报、驳回；下架帖子需向二级管理员申请" },
    { level: 2, name: "二级管理员", description: "含一级全部权限，并审批一级管理员的下架申请" },
    { level: 3, name: "三级管理员", description: "含一、二级全部权限，并封禁账号、查看用户信息、可视化大屏" },
]

// 权限点：minLevel 表示拥有该权限的最低等级（等级继承的体现）
const PERMISSIONS = [
    { code: "post:view", name: "巡查帖子", minLevel: 1, type: "menu" },
    { code: "report:list", name: "查看举报列表", minLevel: 1, type: "menu" },
    { code: "report:handle", name: "处理举报", minLevel: 1, type: "button" },
    { code: "post:reject", name: "驳回帖子", minLevel: 1, type: "button" },
    { code: "post:offline:apply", name: "申请下架帖子", minLevel: 1, type: "button" },
    { code: "post:offline", name: "下架帖子", minLevel: 2, type: "button" },
    { code: "post:offline:approve", name: "审批下架申请", minLevel: 2, type: "button" },
    { code: "user:view", name: "查看用户信息", minLevel: 3, type: "menu" },
    { code: "user:ban", name: "封禁/解封账号", minLevel: 3, type: "button" },
    { code: "dashboard:view", name: "可视化大屏", minLevel: 3, type: "menu" },
    { code: "dashboard:user_active", name: "用户日活量", minLevel: 3, type: "button" },
    { code: "dashboard:post_daily", name: "日发帖量", minLevel: 3, type: "button" },
]

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
        console.log("[migrate] 管理员角色已就绪（一级/二级/三级）")
        cb(null)
    })
}

function seedPermissions(cb) {
    const tasks = PERMISSIONS.map((p) => (next) =>
        db.query(
            "INSERT INTO admin_permissions (perm_code, perm_name, type, description) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE perm_name = VALUES(perm_name), type = VALUES(type)",
            [p.code, p.name, p.type, "最低等级 " + p.minLevel + " 拥有"],
            (err) => next(err)
        )
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)
        console.log("[migrate] 管理员权限点已就绪")
        cb(null)
    })
}

// 按 minLevel 给所有等级 >= minLevel 的角色分配权限，实现等级继承
function seedRolePermissions(cb) {
    const tasks = PERMISSIONS.map((p) => (next) =>
        db.query(
            `INSERT IGNORE INTO admin_role_permissions (role_id, perm_id)
             SELECT r.id, p.id FROM admin_roles r, admin_permissions p
             WHERE p.perm_code = ? AND r.role_level >= ?`,
            [p.code, p.minLevel],
            (err) => next(err)
        )
    )
    runSequential(tasks, (err) => {
        if (err) return cb(err)
        console.log("[migrate] 角色-权限映射已就绪")
        cb(null)
    })
}

// 创建种子管理员账号（仅在没有任何管理员时）
function seedAdminAccount(cb) {
    db.query("SELECT COUNT(*) AS total FROM admins", (err, rows) => {
        if (err) return cb(err)
        if (rows[0].total > 0) {
            console.log("[migrate] 已存在管理员账号，跳过种子账号创建")
            return cb(null)
        }
        db.query("SELECT id FROM admin_roles WHERE role_level = ?", [SEED_ADMIN.roleLevel], (err2, roleRows) => {
            if (err2) return cb(err2)
            if (roleRows.length === 0) return cb(new Error("未找到一级管理员角色，无法创建种子账号"))
            const hashedPassword = bcrypt.hashSync(SEED_ADMIN.password, 10)
            db.query(
                "INSERT INTO admins (username, password, nickname, email, role_id, status) VALUES (?,?,?,?,?,1)",
                [SEED_ADMIN.username, hashedPassword, SEED_ADMIN.nickname, SEED_ADMIN.email, roleRows[0].id],
                (err3) => {
                    if (err3) return cb(err3)
                    console.log(`[migrate] 已创建一级管理员种子账号：${SEED_ADMIN.username} / ${SEED_ADMIN.password}（请尽快修改密码）`)
                    cb(null)
                }
            )
        })
    })
}

module.exports = function (done) {
    ensureTables((err) => {
        if (err) return done(err)
        seedRoles((err2) => {
            if (err2) return done(err2)
            seedPermissions((err3) => {
                if (err3) return done(err3)
                seedRolePermissions((err4) => {
                    if (err4) return done(err4)
                    seedAdminAccount(done)
                })
            })
        })
    })
}
