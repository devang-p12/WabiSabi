import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getTaskCommentsController, createCommentController, deleteCommentController, } from "./comment.controller.js";
const router = Router();
router.get("/tasks/:taskId/comments", authenticate, getTaskCommentsController);
router.post("/tasks/:taskId/comments", authenticate, createCommentController);
router.delete("/comments/:commentId", authenticate, deleteCommentController);
export default router;
//# sourceMappingURL=comment.routes.js.map