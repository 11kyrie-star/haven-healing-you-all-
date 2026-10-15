const joi = require("joi")

const username = joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(16).required()
const password = joi.string().min(6).max(20).required()

module.exports.login = {
    body: {
        username,
        password,
    },
}
