const express = require("express")
const functions = require("../handle_router/admin")
const expressjoi = require("../middleware/express-joi")
const rule = require("../schema/admin")
const adminAuth = require("../admin_jwt")
const requirePerm = require("../admin_perm")

const router = express.Router()

// B 端后台登录（公开，无需鉴权）
router.post("/admin/login", expressjoi(rule.login), functions.login)

// 刷新 access token（公开，用 login 下发的 refresh_token 换取新的一对 token）
router.post("/admin/refresh-token", functions.refreshToken)

// B 端动态路由：按当前登录管理员的角色返回可见的路由树（需登录）
router.get("/admin/routes", adminAuth, functions.routes)

// B 端帖子巡查列表（分页，需登录 + post:view 权限）
router.get("/admin/posts", adminAuth, requirePerm("post:view"), functions.postList)

// B 端帖子详情（需登录 + post:view 权限）
router.get("/admin/posts/:id", adminAuth, requirePerm("post:view"), functions.postDetail)

// B 端待处理举报列表（需登录 + report:list 权限）
router.get("/admin/reports", adminAuth, requirePerm("report:list"), functions.pendingReportList)

// C 端用户列表（三级及以上）：被举报次数、风险标签、发帖数、账号状态、最近被举报时间
router.get("/admin/users", adminAuth, requirePerm("user:view"), functions.userList)

// 封禁 / 解封 C 端账号（三级及以上）
router.post("/admin/users/:id/appeal/approve", adminAuth, requirePerm("user:ban"), functions.approveUserAppeal)
router.post("/admin/users/:id/ban", adminAuth, requirePerm("user:ban"), functions.banUser)
router.post("/admin/users/:id/unban", adminAuth, requirePerm("user:ban"), functions.unbanUser)

// 用户详情 / 用户发的帖子（三级及以上）
// 注意：ban-records 必须写在 /:id 之前，否则会被 :id 当成用户 id
router.get("/admin/role-description", adminAuth, functions.roleDescription)
router.get("/admin/dashboard", adminAuth, functions.dashboardOverview)
router.get("/admin/users/ban-records", adminAuth, requirePerm("user:ban"), functions.banRecordList)
router.get("/admin/users/ban-appeals", adminAuth, requirePerm("user:ban"), functions.banAppealList)
router.post("/admin/users/ban-appeals/:id/handle", adminAuth, requirePerm("user:ban"), functions.handleBanAppeal)
router.post("/admin/users/ban-appeals/:id/reject", adminAuth, requirePerm("user:ban"), functions.rejectBanAppeal)
router.delete("/admin/users/ban-records/:id", adminAuth, requirePerm("user:ban"), functions.deleteBanRecord)
router.get("/admin/users/:id", adminAuth, requirePerm("user:view"), functions.userDetail)
router.get("/admin/users/:id/posts", adminAuth, requirePerm("user:view"), functions.userPosts)

// 下架申请列表（一级只看自己的，二级及以上看全部）
router.get("/admin/offline-approvals", adminAuth, requirePerm("post:offline:approve"), functions.pendingOfflineApplicationList)
router.get("/admin/offline-approvals/records", adminAuth, requirePerm("post:offline:approve"), functions.offlineApprovalRecordList)
router.delete("/admin/offline-approvals/records/all", adminAuth, requirePerm("post:offline:approve"), functions.clearOfflineApprovalRecords)
router.delete("/admin/offline-approvals/records", adminAuth, requirePerm("post:offline:approve"), functions.deleteOfflineApprovalRecord)
router.get("/admin/offline-applications", adminAuth, requirePerm("post:view"), functions.offlineApplicationList)

// 一级管理员：提交下架申请（帖子管理页，举报保持待处理）
router.post("/admin/posts/:id/offline-apply", adminAuth, requirePerm("post:offline:apply"), functions.offlineApply)

// 一级管理员：处理举报时提交下架申请（提交即把该帖全部待处理举报置为处理完成）
router.post("/admin/reports/offline-apply", adminAuth, requirePerm("post:offline:apply"), functions.reportOfflineApply)

// 举报处理页：驳回某帖全部待处理举报（内容不违规）
router.post("/admin/reports/reject", adminAuth, requirePerm("report:handle"), functions.rejectPostReports)

// 举报处理记录（只读回看，按帖子聚合）
router.get("/admin/reports/records", adminAuth, requirePerm("report:list"), functions.reportRecordList)

// 删除举报处理记录（软删除，支持批量：单条传 1 个 post_id，删一页传整页 post_ids）
router.delete("/admin/reports/records", adminAuth, requirePerm("report:handle"), functions.deleteReportRecords)

// 清空全部举报处理记录
router.delete("/admin/reports/records/all", adminAuth, requirePerm("report:handle"), functions.clearReportRecords)

// 二级及以上：直接下架帖子（同时把该帖待处理申请标记为处理完成）
router.post("/admin/posts/:id/offline", adminAuth, requirePerm("post:offline"), functions.offlinePost)

// 二级及以上：通过下架申请（下架帖子 + 收尾该帖全部待处理举报）
// 按帖子批准全部待处理下架申请（审批页按帖子操作）
router.post("/admin/offline-applications/approve", adminAuth, requirePerm("post:offline:approve"), functions.approveOfflineApplicationByPost)
router.post("/admin/offline-applications/:id/approve", adminAuth, requirePerm("post:offline:approve"), functions.approveOfflineApplication)

// 二级及以上：驳回下架申请
// 按帖子驳回全部待处理下架申请（审批页按帖子操作）
router.post("/admin/offline-applications/reject", adminAuth, requirePerm("post:offline:approve"), functions.rejectOfflineApplicationByPost)
router.post("/admin/offline-applications/:id/reject", adminAuth, requirePerm("post:offline:approve"), functions.rejectOfflineApplication)

// 申请人本人：撤销待处理的下架申请
router.post("/admin/offline-applications/:id/cancel", adminAuth, requirePerm("post:offline:apply"), functions.cancelOfflineApplication)

// 申请人本人：对已驳回的申请发起申诉（每张申请只能申诉一次）
router.post("/admin/offline-applications/:id/appeal", adminAuth, requirePerm("post:offline:apply"), functions.appealOfflineApplication)

// 更高级别管理员：复核申诉（通过 = 下架帖子，驳回 = 维持原判）
router.post("/admin/offline-applications/:id/appeal/review", adminAuth, requirePerm("post:offline:approve"), functions.reviewAppeal)

module.exports = router
