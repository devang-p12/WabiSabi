import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { globalSearchController } from "./search.controller.js";

const router = Router();

router.get("/", authenticate, globalSearchController);

export default router;
