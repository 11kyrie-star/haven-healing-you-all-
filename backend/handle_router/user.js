﻿const db = require("../db/index")
const fs = require("fs")
const path = require("path")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const secretkey = require("../config").secretkey

// Login
module.exports.login = (req, res) => {
    const sql = "select * from userinfo where username=?"
    db.query(sql, [req.body.username], (err, results) => {
        if (err) {
            console.error("登录查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (results.length !== 1) {
            return req.cc("用户不存在")
        }
        const user = results[0]
        const compareResult = bcrypt.compareSync(req.body.password, user.password)
        if (!compareResult) {
            return req.cc("密码错误")
        }
        // 被管理员封禁的账号不能登录（status: 1 正常 / 0 封禁）
        // 临时封禁到期后自动恢复，永久封禁（ban_until 为空）继续拦截
        if (Number(user.status) !== 1) {
            const banUntil = user.ban_until ? new Date(user.ban_until).getTime() : null
            if (banUntil !== null && banUntil <= Date.now()) {
                db.query(
                    "UPDATE userinfo SET status = 1, ban_reason = NULL, ban_by = NULL, ban_at = NULL, ban_until = NULL WHERE id = ?",
                    [user.id],
                    (e) => { if (e) console.error("自动解封失败:", e) }
                )
            } else {
                return req.cc("该账号已被封禁，请联系管理员")
            }
        }
        const tokenPayload = {
            id: user.id,
            username: user.username,
            avatar: user.avatar || null,
        }
        const tokenstr = jwt.sign(tokenPayload, secretkey, { expiresIn: "10h" })
        res.send({
            status: 0,
            msg: "登录成功",
            token: tokenstr,
            data: {
                username: user.username,
                email: user.email,
                avatar: user.avatar ? (user.avatar.startsWith("http") ? user.avatar : req.protocol + "://" + req.get("host") + user.avatar) : null,
            },
        })
    })
}

// Register
module.exports.register = (req, res) => {
    const checkSql = "select * from userinfo where username=? or email=?"
    db.query(checkSql, [req.body.username, req.body.email], (err, results) => {
        if (err) {
            console.error("注册查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        for (const row of results) {
            if (row.username === req.body.username) {
                return req.cc("用户名已被占用")
            }
            if (row.email === req.body.email) {
                return req.cc("一个邮箱只能注册一个账号")
            }
        }
        const hashedPassword = bcrypt.hashSync(req.body.password, 10)
        const insertSql = "insert into userinfo(username,password,email) values (?,?,?)"
        db.query(insertSql, [req.body.username, hashedPassword, req.body.email], (err2, insertResults) => {
            if (err2) {
                console.error("注册插入失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            if (insertResults.affectedRows !== 1) {
                return req.cc("注册失败")
            }
            res.send({
                status: 0,
                msg: "注册成功",
            })
        })
    })
}

// Forget / Reset password
module.exports.forget = (req, res) => {
    const checkSql = "select * from userinfo where email=?"
    db.query(checkSql, [req.body.email], (err, results) => {
        if (err) {
            console.error("忘记密码查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (results.length !== 1) {
            return req.cc("邮箱未注册")
        }
        const hashedPassword = bcrypt.hashSync(req.body.newpassword, 10)
        const updateSql = "update userinfo set password=? where email=?"
        db.query(updateSql, [hashedPassword, req.body.email], (err2, results2) => {
            if (err2) {
                console.error("密码更新失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            if (results2.affectedRows !== 1) {
                return req.cc("密码修改失败")
            }
            res.send({
                status: 0,
                msg: "密码修改成功",
            })
        })
    })
}

// Upload avatar (base64)
module.exports.avatar = (req, res) => {
    const { avatar } = req.body
    if (!avatar) {
        return req.cc("请提供头像数据")
    }

    const matches = avatar.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,(.+)$/)
    let base64Data, ext
    if (matches) {
        ext = matches[1] === "jpeg" ? "jpg" : matches[1]
        base64Data = matches[2]
    } else {
        ext = "png"
        base64Data = avatar
    }

    const buffer = Buffer.from(base64Data, "base64")
    if (buffer.length === 0) {
        return req.cc("头像数据无效")
    }
    if (buffer.length > 10 * 1024 * 1024) {
        return req.cc("头像大小不能超过10MB")
    }

    const userId = req.user.id
    const filename = "avatar_" + userId + "_" + Date.now() + "." + ext
    const filepath = path.join(__dirname, "..", "uploads", "avatars", filename)

    fs.writeFile(filepath, buffer, (writeErr) => {
        if (writeErr) {
            console.error("头像写入失败:", writeErr)
            return req.cc("头像保存失败")
        }

        const avatarUrl = req.protocol + "://" + req.get("host") + "/uploads/avatars/" + filename
        const updateSql = "update userinfo set avatar=? where id=?"
        db.query(updateSql, [avatarUrl, userId], (dbErr, dbResult) => {
            if (dbErr) {
                console.error("更新头像字段失败:", dbErr)
                return req.cc("服务器异常", 1, 500)
            }
            if (dbResult.affectedRows !== 1) {
                return req.cc("用户不存在")
            }
            res.send({
                status: 0,
                msg: "头像上传成功",
                data: { avatar_url: avatarUrl },
            })
        })
    })
}

// Get current user info
module.exports.userinfo = (req, res) => {
    const sql = "select username, email, avatar from userinfo where id=?"
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("获取用户信息失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (results.length !== 1) {
            return req.cc("用户不存在")
        }
        const token = req.headers.authorization.split(" ")[1]
        res.send({
            status: 0,
            msg: "获取成功",
            data: {
                username: results[0].username,
                email: results[0].email,
                avatar: results[0].avatar ? (results[0].avatar.startsWith("http") ? results[0].avatar : req.protocol + "://" + req.get("host") + results[0].avatar) : null,
                token,
            },
        })
    })
}

// Change password
module.exports.changepwd = (req, res) => {
    const { oldpassword, newpassword } = req.body
    const sql = "select password from userinfo where id=?"
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("修改密码查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (results.length !== 1) {
            return req.cc("用户不存在")
        }
        const compareResult = bcrypt.compareSync(oldpassword, results[0].password)
        if (!compareResult) {
            return req.cc("原密码错误")
        }
        const hashedPassword = bcrypt.hashSync(newpassword, 10)
        const updateSql = "update userinfo set password=? where id=?"
        db.query(updateSql, [hashedPassword, req.user.id], (err2, results2) => {
            if (err2) {
                console.error("密码更新失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            if (results2.affectedRows !== 1) {
                return req.cc("密码修改失败")
            }
            res.send({
                status: 0,
                msg: "密码修改成功",
            })
        })
    })
}

// Change username
module.exports.changeusername = (req, res) => {
    const { username } = req.body
    const checkSql = "select * from userinfo where username=?"
    db.query(checkSql, [username], (err, results) => {
        if (err) {
            console.error("修改用户名查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (results.length > 0) {
            return req.cc("用户名已被占用")
        }
        const updateSql = "update userinfo set username=? where id=?"
        db.query(updateSql, [username, req.user.id], (err2) => {
            if (err2) {
                console.error("用户名更新失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            res.send({
                status: 0,
                msg: "用户名修改成功",
            })
        })
    })
}

// Change email
module.exports.changeemail = (req, res) => {
    const { email } = req.body
    const checkSql = "select * from userinfo where email=?"
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.error("修改邮箱查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (results.length > 0) {
            return req.cc("邮箱已被占用")
        }
        const updateSql = "update userinfo set email=? where id=?"
        db.query(updateSql, [email, req.user.id], (err2) => {
            if (err2) {
                console.error("邮箱更新失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            res.send({
                status: 0,
                msg: "邮箱修改成功",
            })
        })
    })
}

// Change username and email
module.exports.changeprofile = (req, res) => {
    const { username, email } = req.body
    const checkSql = "select * from userinfo where (username=? or email=?) and id<>?"
    db.query(checkSql, [username, email, req.user.id], (err, results) => {
        if (err) {
            console.error("修改资料查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        for (const row of results) {
            if (row.username === username) {
                return req.cc("用户名已被占用")
            }
            if (row.email === email) {
                return req.cc("邮箱已被占用")
            }
        }
        const updateSql = "update userinfo set username=?, email=? where id=?"
        db.query(updateSql, [username, email, req.user.id], (err2) => {
            if (err2) {
                console.error("资料更新失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            res.send({
                status: 0,
                msg: "资料修改成功",
            })
        })
    })
}
