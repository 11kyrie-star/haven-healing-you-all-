const Joi = require("joi")

const expressJoi = function (schemas, options = { strict: false }) {
    if (!options.strict) {
        options = { allowUnknown: true, stripUnknown: true, ...options }
    }
    delete options.strict

    return function (req, res, next) {
        const keys = ["body", "query", "params"]
        for (const key of keys) {
            if (!schemas[key]) continue
            const schema = Joi.object(schemas[key])
            const { error, value } = schema.validate(req[key], options)
            if (error) {
                return next(error)
            }
            req[key] = value
        }
        next()
    }
}

module.exports = expressJoi
