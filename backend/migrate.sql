-- ============================================
-- HavenDB 建表脚本
-- 数据库: my-haven
-- 兼容 MySQL 5.7+
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS userinfo (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(45)     UNIQUE,
    password    VARCHAR(255),
    email       VARCHAR(100),
    avatar      VARCHAR(500),
    status      TINYINT(1)      NOT NULL DEFAULT 1,
    ban_reason  VARCHAR(50)     DEFAULT NULL,
    ban_by      INT             DEFAULT NULL,
    ban_at      DATETIME        DEFAULT NULL,
    ban_until   DATETIME        DEFAULT NULL,
    create_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 帖子表
CREATE TABLE IF NOT EXISTS posts (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    content     TEXT,
    images      JSON,
    tags        JSON,
    category    VARCHAR(20)     DEFAULT "日常",
    view_count  INT             DEFAULT 0,
    like_count  INT             DEFAULT 0,
    comment_count INT           DEFAULT 0,
    hot_value   INT             DEFAULT 0,
    is_public   TINYINT(1)      DEFAULT 1,
    is_anonymous TINYINT(1)     DEFAULT 0,
    status      TINYINT(1)      DEFAULT 1,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user     (user_id),
    INDEX idx_hot      (hot_value),
    INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 评论表 (parent_id 为 NULL 表示一级评论，否则为回复)
CREATE TABLE IF NOT EXISTS comments (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    post_id     INT             NOT NULL,
    parent_id   INT             DEFAULT NULL,
    user_id     INT             NOT NULL,
    content     TEXT,
    images      JSON,
    star_count  INT             DEFAULT 0,
    reply_count INT             DEFAULT 0,
    status      TINYINT(1)      DEFAULT 1,
    create_at   DATETIME        DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_post   (post_id),
    INDEX idx_parent (parent_id),
    INDEX idx_user   (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 用户自定义标签表
CREATE TABLE IF NOT EXISTS user_tags (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    user_id     INT             NOT NULL UNIQUE,
    tags        JSON,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Post likes (one row per user+post; used to answer 'is this user liked this post')
CREATE TABLE IF NOT EXISTS post_likes (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    post_id     INT             NOT NULL,
    user_id     INT             NOT NULL,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Comment likes (one row per user+comment; used for is_liked on comments)
CREATE TABLE IF NOT EXISTS comment_likes (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    comment_id  INT             NOT NULL,
    user_id     INT             NOT NULL,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_comment_user (comment_id, user_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 已有库升级 ALTER (按需执行)
-- ============================================

-- posts 表
-- ALTER TABLE posts ADD COLUMN tags JSON AFTER images;
-- ALTER TABLE posts ADD COLUMN category VARCHAR(20) DEFAULT "日常" AFTER tags;
-- ALTER TABLE posts MODIFY COLUMN hot_value INT DEFAULT 0;

-- comments 表
-- ALTER TABLE comments ADD COLUMN parent_id INT DEFAULT NULL AFTER post_id;
-- ALTER TABLE comments ADD COLUMN images JSON AFTER content;
-- ALTER TABLE comments ADD COLUMN reply_count INT DEFAULT 0 AFTER star_count;
-- 字段重命名 (like_count -> star_count, created_at -> create_at)
-- ALTER TABLE comments CHANGE COLUMN like_count star_count INT DEFAULT 0;
-- ALTER TABLE comments CHANGE COLUMN created_at create_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 7. 通知表
CREATE TABLE IF NOT EXISTS notifications (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 搜索记录表
CREATE TABLE IF NOT EXISTS search_records (
    id         INT             PRIMARY KEY AUTO_INCREMENT,
    user_id    INT             NOT NULL,
    keyword    VARCHAR(100)    NOT NULL,
    create_at  DATETIME(3)     DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_user_keyword (user_id, keyword),
    INDEX idx_user_time (user_id, create_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 帖子审核状态：0 正常 / 1 举报受理中 / 2 下架
ALTER TABLE posts ADD COLUMN report_status TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- 举报表
CREATE TABLE IF NOT EXISTS post_reports (
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
    offline_application_id INT  DEFAULT NULL,
    record_deleted TINYINT(1)   NOT NULL DEFAULT 0,
    create_at     DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_status (status),
    INDEX idx_offline_application (offline_application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. B 端后台 RBAC（表结构；角色/权限/种子账号由 migrate_admin.js 启动时自动写入）
--    等级继承：等级越高，权限包含越低等级的全部权限
--    一级(role_level=1)：巡查帖子、处理举报、驳回，下架需申请
--    二级(role_level=2)：含一级 + 审批下架申请、下架帖子
--    三级(role_level=3)：含一、二级 + 查看用户信息、封禁账号、可视化大屏
--    四级(role_level=4)：超级管理员，含一、二、三级 + 管理员账号管理、角色权限管理
-- ============================================

-- 角色表
CREATE TABLE IF NOT EXISTS admin_roles (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    role_level  TINYINT         NOT NULL UNIQUE,
    role_name   VARCHAR(45)     NOT NULL,
    description VARCHAR(200),
    create_at   DATETIME        DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 权限点表
CREATE TABLE IF NOT EXISTS admin_permissions (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    perm_code   VARCHAR(64)     NOT NULL UNIQUE,
    perm_name   VARCHAR(64)     NOT NULL,
    type        VARCHAR(20)     NOT NULL DEFAULT 'api',
    description VARCHAR(200),
    create_at   DATETIME        DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员账号表
CREATE TABLE IF NOT EXISTS admins (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色-权限映射表
CREATE TABLE IF NOT EXISTS admin_role_permissions (
    id       INT  PRIMARY KEY AUTO_INCREMENT,
    role_id  INT  NOT NULL,
    perm_id  INT  NOT NULL,
    UNIQUE KEY uk_role_perm (role_id, perm_id),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. B 端动态路由（菜单表 + 角色-菜单映射）
--    菜单数据由 migrate_admin.js 启动时自动写入（按 minLevel 做等级继承）
--    admin_menus 是扁平结构(parent_id)，后端按角色查出后组装成树形 JSON 返回
--    menu_type: 1=目录(仅分组，不渲染页面) 2=菜单(真实页面，注册成前端路由)
--    按钮级权限不在这张表，统一走 admin_permissions
-- ============================================

-- 菜单/路由表
CREATE TABLE IF NOT EXISTS admin_menus (
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
    UNIQUE KEY uk_path (path),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色-菜单映射表
CREATE TABLE IF NOT EXISTS admin_role_menus (
    id       INT  PRIMARY KEY AUTO_INCREMENT,
    role_id  INT  NOT NULL,
    menu_id  INT  NOT NULL,
    UNIQUE KEY uk_role_menu (role_id, menu_id),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- admin_refresh_tokens：B 端刷新令牌表
--    只存 sha256 摘要，原始 token 只在签发时返回给前端
--    每次刷新删除旧记录写入新记录，旧 token 立即失效
CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    admin_id   INT          NOT NULL,
    token_hash CHAR(64)     NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    create_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin (admin_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. 帖子下架申请表（一级管理员提交，二级及以上审批）
--    status: 0 待处理 / 1 处理完成（帖子已下架） / 2 已驳回（帖子保留）
--            3 已撤销（申请人自己撤回） / 4 申诉中（申请人对驳回结果申诉）
--    pending_post_id 是生成列：status=0 时等于 post_id，否则为 NULL
--    配合唯一索引 uk_pending_post，保证同一帖子最多一条待处理申请
CREATE TABLE IF NOT EXISTS post_offline_applications (
    id              INT          PRIMARY KEY AUTO_INCREMENT,
    post_id         INT          NOT NULL,
    applicant_id    INT          NOT NULL,
    apply_reason    VARCHAR(50)  NOT NULL,
    status          TINYINT      NOT NULL DEFAULT 0,
    handle_by       INT          DEFAULT NULL,
    handle_reason   VARCHAR(50)  DEFAULT NULL,
    handle_at       DATETIME     DEFAULT NULL,
    appeal_reason        VARCHAR(50) DEFAULT NULL,
    appeal_at            DATETIME    DEFAULT NULL,
    appeal_handle_by     INT         DEFAULT NULL,
    appeal_handle_reason VARCHAR(50) DEFAULT NULL,
    appeal_handle_at     DATETIME    DEFAULT NULL,
    create_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    pending_post_id INT GENERATED ALWAYS AS (IF(status = 0, post_id, NULL)) STORED,
    UNIQUE KEY uk_pending_post (pending_post_id),
    INDEX idx_post (post_id),
    INDEX idx_applicant (applicant_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
