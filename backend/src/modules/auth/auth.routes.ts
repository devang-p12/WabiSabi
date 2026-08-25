import { Router } from "express";
import {
    register,
    login,
    getCurrentUser,
    refresh
} from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.post("/refresh", refresh);

export default router;