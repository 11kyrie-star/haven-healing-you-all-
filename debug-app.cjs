const express = require('express')
const cors = require('cors')
const joi = require('joi')

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Debug: log all incoming requests
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`)
    next()
})

// Try loading the router - print what's happening
console.log('Loading router...')
try {
    const router = require('./router/user')
    console.log('Router loaded successfully')
    console.log('Router stack:', router.stack ? router.stack.map(s => s.route ? `${Object.keys(s.route.methods)} ${s.route.path}` : 'middleware') : 'no stack')
    app.use('/haven', router)
    console.log('Router mounted at /haven')
} catch(err) {
    console.error('Failed to load router:', err.message)
    console.error(err.stack)
}

app.use(function(err, req, res, next) {
    console.log('[ERROR HANDLER]', err.name, err.message)
    if (err.name == 'UnauthorizedError') {
        return res.status(401).json({ status: 1, msg: '身份认证失败' })
    }
    if (err instanceof joi.ValidationError) {
        return res.json({ status: 1, msg: err.message })
    }
    next(err)
})

app.listen(3009, () => {
    console.log('Debug server runs at http://127.0.0.1:3009')
})
