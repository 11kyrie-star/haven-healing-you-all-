const joi = require("joi")

const username = joi.string().pattern(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/).min(2).max(16).required()
const password = joi.string().min(6).max(20).required()
const email = joi.string().email({ tlds: { allow: false } }).required()

module.exports.register = {
    body: {
        username,
        password,
        email,
    },
}

module.exports.login = {
    body: {
        username,
        password,
    },
}

module.exports.forget = {
    body: {
        email,
        newpassword: password,
    },
}

// 封禁申诉：ban_ticket 来自登录失败响应，appeal_reason 最多 50 字
module.exports.appeal = {
    body: {
        ban_ticket: joi.string().required(),
        appeal_reason: joi.string().trim().max(50).required(),
    },
}

module.exports.changepwd = {
    body: {
        oldpassword: password,
        newpassword: password,
    },
}

module.exports.changeusername = {
    body: {
        username,
    },
}

module.exports.changeemail = {
    body: {
        email,
    },
}

module.exports.changeprofile = {
    body: {
        username,
        email,
    },
}
