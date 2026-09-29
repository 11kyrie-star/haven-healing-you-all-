// 自动迁移脚本：启动时检查并补全缺失的字段
const db = require("./db/index")

const migrations = [
    // [表名, 字段, 定义, 在哪个字段后面]
    ["posts", "tags", "JSON", "images"],
    ["posts", "category", "VARCHAR(20) DEFAULT '日常'", "tags"],
    ["comments", "parent_id", "INT DEFAULT NULL", "post_id"],
    ["comments", "images", "JSON", "content"],
    ["comments", "reply_count", "INT DEFAULT 0", "star_count"],
    ["posts", "report_status", "TINYINT(1) NOT NULL DEFAULT 0", "status"],
]

function columnExists(table, column, cb) {
    db.query("SHOW COLUMNS FROM ?? LIKE ?", [table, column], (err, rows) => {
        if (err) return cb(err)
        cb(null, rows.length > 0)
    })
}

function addColumn(table, column, definition, after, cb) {
    db.query(`ALTER TABLE ?? ADD COLUMN ?? ${definition} AFTER ??`, [table, column, after], cb)
}

function renameColumnIfNeeded(table, oldName, newName, definition, cb) {
    columnExists(table, newName, (err, exists) => {
        if (err) return cb(err)
        if (exists) return cb()
        columnExists(table, oldName, (err2, oldExists) => {
            if (err2) return cb(err2)
            if (!oldExists) return cb()
            db.query(`ALTER TABLE ?? CHANGE COLUMN ?? ?? ${definition}`, [table, oldName, newName], cb)
        })
    })
}

function runMigrations(cb) {
    let idx = 0
    const next = (err) => {
        if (err) return cb(err)
        if (idx >= migrations.length) return cb(null)
        const [table, column, definition, after] = migrations[idx++]
        columnExists(table, column, (err2, exists) => {
            if (err2) return next(err2)
            if (exists) {
                console.log(`[migrate] ${table}.${column} 已存在`)
                return next(null)
            }
            addColumn(table, column, definition, after, (err3) => {
                if (err3) return next(err3)
                console.log(`[migrate] 已添加 ${table}.${column}`)
                next(null)
            })
        })
    }
    next(null)
}

// 字段重命名：like_count -> star_count, created_at -> create_at
function runRenames(cb) {
    renameColumnIfNeeded("comments", "like_count", "star_count", "INT DEFAULT 0", (err) => {
        if (err) return cb(err)
        renameColumnIfNeeded("comments", "created_at", "create_at", "DATETIME DEFAULT CURRENT_TIMESTAMP", cb)
    })
}

// 确保点赞表存在
function ensurePostLikesTable(cb) {
    const sql = `CREATE TABLE IF NOT EXISTS post_likes (
        id          INT             PRIMARY KEY AUTO_INCREMENT,
        post_id     INT             NOT NULL,
        user_id     INT             NOT NULL,
        created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_post_user (post_id, user_id),
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
        if (err) return cb(err)
        console.log("[migrate] post_likes 表已就绪")
        cb(null)
    })
}

// 确保评论点赞表存在
function ensureCommentLikesTable(cb) {
    const sql = `CREATE TABLE IF NOT EXISTS comment_likes (
        id          INT             PRIMARY KEY AUTO_INCREMENT,
        comment_id  INT             NOT NULL,
        user_id     INT             NOT NULL,
        created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_comment_user (comment_id, user_id),
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
        if (err) return cb(err)
        console.log("[migrate] comment_likes 表已就绪")
        cb(null)
    })
}

// 确保留言表存在
function ensurePostMessagesTable(cb) {
    const sql = `CREATE TABLE IF NOT EXISTS post_messages (
        id              INT             PRIMARY KEY AUTO_INCREMENT,
        post_id         INT             NOT NULL,
        sender_id       INT             NOT NULL,
        sender_username VARCHAR(50)     NOT NULL,
        sender_avatar   VARCHAR(255),
        content         TEXT,
        images          JSON,
        status          TINYINT(1)      DEFAULT 1,
        create_at       DATETIME        DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post   (post_id),
        INDEX idx_sender (sender_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
        if (err) return cb(err)
        console.log("[migrate] post_messages 表已就绪")
        cb(null)
    })
}

// 确保通知表存在
function ensureNotificationsTable(cb) {
    const sql = `CREATE TABLE IF NOT EXISTS notifications (
        id           INT             PRIMARY KEY AUTO_INCREMENT,
        user_id      INT             NOT NULL,
        type         VARCHAR(20)     NOT NULL,
        actor_id     INT             NOT NULL,
        actor_name   VARCHAR(50)     NOT NULL,
        actor_avatar VARCHAR(255),
        content      TEXT,
        target_id    INT             NOT NULL,
        post_id      INT             NOT NULL,
        is_read      TINYINT(1)      DEFAULT 0,
        reasons      TEXT,
        handle_result VARCHAR(200),
        is_success   TINYINT(1)      DEFAULT NULL,
        role         VARCHAR(20)     DEFAULT NULL,
        create_at    DATETIME        DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_read (user_id, is_read),
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
        if (err) return cb(err)
        console.log("[migrate] notifications 表已就绪")
        cb(null)
    })
}

// 确保搜索记录表存在
function ensureSearchRecordsTable(cb) {
    const sql = `CREATE TABLE IF NOT EXISTS search_records (
        id         INT             PRIMARY KEY AUTO_INCREMENT,
        user_id    INT             NOT NULL,
        keyword    VARCHAR(100)    NOT NULL,
        create_at  DATETIME(3)     DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uk_user_keyword (user_id, keyword),
        INDEX idx_user_time (user_id, create_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
        if (err) return cb(err)
        console.log("[migrate] search_records 表已就绪")
        cb(null)
    })
}
// 确保举报表存在
function ensurePostReportsTable(cb) {
    const sql = `CREATE TABLE IF NOT EXISTS post_reports (
        id          INT             PRIMARY KEY AUTO_INCREMENT,
        post_id     INT             NOT NULL,
        user_id     INT             NOT NULL,
        username    VARCHAR(50)     NOT NULL,
        avatar      VARCHAR(255),
        reasons     TEXT,
        description TEXT,
        status        TINYINT(1)    DEFAULT 0,
        handle_at     DATETIME(3)   DEFAULT NULL,
        handle_result VARCHAR(200)  DEFAULT NULL,
        handle_by     VARCHAR(50)   DEFAULT NULL,
        create_at     DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uk_post_user (post_id, user_id),
        INDEX idx_post (post_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
        if (err) return cb(err)
        console.log("[migrate] post_reports 表已就绪")
        cb(null)
    })
}
// 举报表处理详情字段（已存在的表补齐）
function ensurePostReportsColumns(cb) {
    const cols = [
        ["handle_at", "DATETIME(3) DEFAULT NULL"],
        ["handle_result", "VARCHAR(200) DEFAULT NULL"],
        ["handle_by", "VARCHAR(50) DEFAULT NULL"],
    ]
    let i = 0
    const next = (err) => {
        if (err) return cb(err)
        if (i >= cols.length) return cb(null)
        const col = cols[i++]
        columnExists("post_reports", col[0], (e, exists) => {
            if (e) return next(e)
            if (exists) return next(null)
            db.query("ALTER TABLE ?? ADD COLUMN ?? " + col[1], ["post_reports", col[0]], (e2) => {
                if (e2) return next(e2)
                console.log("[migrate] post_reports." + col[0] + " 已添加")
                next(null)
            })
        })
    }
    next(null)
}
// 通知表补充字段（举报原因 / 处理结果 / 是否成功）
function ensureNotificationsColumns(cb) {
    const cols = [
        ["reasons", "TEXT DEFAULT NULL"],
        ["handle_result", "VARCHAR(200) DEFAULT NULL"],
        ["is_success", "TINYINT(1) DEFAULT NULL"],
        ["role", "VARCHAR(20) DEFAULT NULL"],
    ]
    let i = 0
    const next = (err) => {
        if (err) return cb(err)
        if (i >= cols.length) return cb(null)
        const col = cols[i++]
        columnExists("notifications", col[0], (e, exists) => {
            if (e) return next(e)
            if (exists) return next(null)
            db.query("ALTER TABLE ?? ADD COLUMN ?? " + col[1], ["notifications", col[0]], (e2) => {
                if (e2) return next(e2)
                console.log("[migrate] notifications." + col[0] + " 已添加")
                next(null)
            })
        })
    }
    next(null)
}
module.exports = function (done) {
    runMigrations((err) => {
        if (err) return done(err)
        runRenames((err2) => {
            if (err2) return done(err2)
            ensurePostLikesTable((err3) => {
                if (err3) return done(err3)
                ensureCommentLikesTable((err4) => {
                    if (err4) return done(err4)
                    ensurePostMessagesTable((err5) => {
                        if (err5) return done(err5)
                        ensureNotificationsTable((err6) => {
                            if (err6) return done(err6)
                            ensureNotificationsColumns((err6b) => {
                            if (err6b) return done(err6b)
                            ensureSearchRecordsTable((err7) => {
                                if (err7) return done(err7)
                                ensurePostReportsTable((err8) => {
                                    if (err8) return done(err8)
                                    ensurePostReportsColumns((err9) => {
                                        if (err9) return done(err9)
                                        console.log("[migrate] 数据库检查完成")
                                        done(null)
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