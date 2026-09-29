const joi = require("joi")

// 帖子内容 (HTML 字符串)
const content = joi.string().max(50000).required()
// 图片列表 (JSON 数组)
const images = joi.array().items(joi.string().uri()).max(9).optional()

module.exports.create_post = {
    body: {
        content,
        images,
        is_public: joi.number().valid(0, 1).default(1),
        is_anonymous: joi.number().valid(0, 1).default(0),
    },
}

module.exports.update_post = {
    body: {
        content: joi.string().max(50000).optional(),
        images: joi.array().items(joi.string().uri()).max(9).optional(),
        is_public: joi.number().valid(0, 1).optional(),
        is_anonymous: joi.number().valid(0, 1).optional(),
    },
}
// 给作者留言
module.exports.create_message = {
    body: {
        content: joi.string().max(10000).required(),
        images: joi.array().items(joi.string().uri()).max(9).optional(),
    },
}

// 评论
module.exports.create_comment = {
    body: {
        post_id: joi.number().integer().required(),
        parent_id: joi.number().integer().optional(),
        content: joi.string().max(10000).required(),
        images: joi.array().items(joi.string().uri()).max(9).optional(),
    },
}

// 回复
module.exports.create_reply = {
    body: {
        parent_id: joi.number().integer().required(),
        content: joi.string().max(10000).required(),
        images: joi.array().items(joi.string().uri()).max(9).optional(),
    },
}
