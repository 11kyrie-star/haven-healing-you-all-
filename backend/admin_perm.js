const db = require("./db/index")

// B 端接口级权限校验中间件
// 用法：router.get("/admin/xxx", adminAuth, requirePerm("post:view"), handler)
// 注意 adminAuth 必须在前，它负责把 req.admin 挂上
// 角色同样实时查库（不取 token 里的 role_id），改权限后立即生效
module.exports = (permCode) => (req, res, next) => {
    const sql = `SELECT 1 FROM admins a
                 JOIN admin_role_permissions rp ON rp.role_id = a.role_id
                 JOIN admin_permissions p ON p.id = rp.perm_id
                 WHERE a.id = ? AND a.status = 1 AND p.perm_code = ?
                 LIMIT 1`
    db.query(sql, [req.admin.id, permCode], (err, rows) => {
        if (err) {
            console.error("权限校验失败:", err)
            return req.cc("服务器异常", 1, 500)
        }
        if (rows.length === 0) {
            return req.cc("无操作权限", 1, 403)
        }
        next()
    })
}
