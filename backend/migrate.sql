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
    avatar      VARCHAR(500)
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
    create_at     DATETIME(3)   DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
