import { Router } from "express";
import {
    register,
    login,
    getCurrentUser,
    refresh,
    logout
} from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", logout);
router.post("/refresh", refresh);

export default router;