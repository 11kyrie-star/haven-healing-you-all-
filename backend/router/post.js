const express = require("express")
const functions = require("../handle_router/post")
const aiFunctions = require("../handle_router/ai")
const expressjoi = require("../middleware/express-joi")
const auth = require("../auth_jwt")
const rule = require("../schema/post")

const router = express.Router()

// 图片上传 (需登录)
router.post("/upload-image", auth, functions.uploadImage)

// 帖子 CRUD
router.post("/post/create", auth, expressjoi(rule.create_post), functions.createPost)
router.get("/post/list", auth, functions.postList)
router.get("/post/list/help", auth, functions.helpPostList)
router.get("/post/list/text", auth, functions.textPostList)
router.get("/post/list/daily", auth, functions.dailyPostList)
router.get("/post/list/mine", auth, functions.myPostList)
router.get("/post/list/liked", auth, functions.likedPostList)
router.get("/post/list/hot", auth, functions.hotPostList)
router.get("/search/history", auth, functions.searchHistory)
router.post("/search/history", auth, functions.addSearchHistory)
router.delete("/search/history", auth, functions.clearSearchHistory)
router.delete("/search/history/:keyword", auth, functions.deleteSearchHistory)
router.get("/search/hot", auth, functions.hotSearchKeywords)
router.get("/search/associate", auth, functions.searchAssociate)
router.get("/search/hot/post", auth, functions.hotSearchPostList)
router.get("/post/detail/:id", auth, functions.postDetail)
router.post("/post/:id/view", auth, functions.incrementView)
router.put("/post/:id", auth, functions.updatePost)
router.put("/post/:id/visibility", auth, functions.setPostVisibility)
router.delete("/post/:id", auth, functions.deletePost)
router.post("/post/:id/like", auth, functions.likePost)
router.post("/post/:id/unlike", auth, functions.unlikePost)
router.post("/post/:id/message", auth, expressjoi(rule.create_message), functions.createMessage)
router.post("/post/:id/report", auth, functions.reportPost)
router.put("/post/:id/audit", functions.updatePostAuditStatus)

router.get("/message/mine", auth, functions.myMessageList)
router.get("/message/to-me", auth, functions.messageToMeList)
router.get("/notification/list", auth, functions.notificationList)
router.put("/notification/read", auth, functions.markNotificationsRead)
router.put("/notification/read/:id", auth, functions.markNotificationRead)
router.delete("/notification", auth, functions.clearNotifications)
router.delete("/notification/:id", auth, functions.deleteNotification)

// 评论
router.post("/comment/create", auth, expressjoi(rule.create_comment), functions.createComment)
router.get("/comment/list/:postId", auth, functions.commentList)
router.get("/comment/mine", auth, functions.myCommentList)
router.post("/comment/:id/like", auth, functions.likeComment)
router.post("/comment/:id/unlike", auth, functions.unlikeComment)

// 回复
router.post("/reply/create", auth, expressjoi(rule.create_reply), functions.createReply)
router.get("/reply/list/:parent_id", auth, functions.replyList)

router.get("/sensitive-words", functions.getSensitiveWords)

// 站点统计（公开，无需登录）
router.get("/stats", functions.getStats)

// AI 聊天（流式 SSE）
router.post("/ai/chat", auth, aiFunctions.aiChat)

router.get("/tags", functions.getTags)

router.get("/user/tags", auth, functions.getUserTags)
router.put("/user/tags", auth, functions.updateUserTags)

module.exports = router
