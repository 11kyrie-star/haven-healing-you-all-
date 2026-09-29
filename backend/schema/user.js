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
