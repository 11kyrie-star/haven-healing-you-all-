const db = require("../db/index")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const secretkey = require("../config").secretkey

// B 端管理员登录
module.exports.login = (req, res) => {
    const { username, password } = req.body
    const sql = `SELECT a.id, a.username, a.password, a.nickname, a.avatar, a.email, a.status,
                        a.role_id, r.role_name, r.role_level
                 FROM admins a
                 LEFT JOIN admin_roles r ON a.role_id = r.id
                 WHERE a.username = ?`
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("管理员登录查询失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        // 账号不存在与密码错误统一提示，避免泄露账号是否存在
        if (results.length !== 1) {
            return req.cc("用户名或密码错误")
        }
        const admin = results[0]
        const compareResult = bcrypt.compareSync(password, admin.password)
        if (!compareResult) {
            return req.cc("用户名或密码错误")
        }
        if (admin.status !== 1) {
            return req.cc("该账号已被禁用", 1, 403)
        }

        // 查询该角色拥有的权限，供前端做动态路由与按钮级权限控制
        const permSql = `SELECT p.perm_code, p.perm_name, p.type
                         FROM admin_role_permissions rp
                         JOIN admin_permissions p ON rp.perm_id = p.id
                         WHERE rp.role_id = ?
                         ORDER BY p.id`
        db.query(permSql, [admin.role_id], (err2, perms) => {
            if (err2) {
                console.error("查询管理员权限失败:", err2)
                return req.cc("服务器异常", 1, 500)
            }
            const permissions = perms.map((p) => p.perm_code)

            const tokenPayload = {
                id: admin.id,
                username: admin.username,
                role_id: admin.role_id,
                role_level: admin.role_level,
                scope: "admin",
            }
            const tokenstr = jwt.sign(tokenPayload, secretkey, { expiresIn: "8h" })

            // 记录最后登录时间与 IP（失败不影响登录结果）
            db.query(
                "UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?",
                [req.ip || null, admin.id],
                (err3) => { if (err3) console.error("更新管理员登录信息失败:", err3) }
            )

            res.send({
                status: 0,
                msg: "登录成功",
                token: tokenstr,
                data: {
                    id: admin.id,
                    username: admin.username,
                    nickname: admin.nickname || admin.username,
                    avatar: admin.avatar || null,
                    email: admin.email || null,
                    role_id: admin.role_id,
                    role_name: admin.role_name || "",
                    role_level: admin.role_level,
                    permissions,
                    permission_details: perms,
                },
            })
        })
    })
}
