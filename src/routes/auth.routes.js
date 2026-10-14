import { Router } from "express";
import { registrar, login, me } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/autenticar.js";

export const authRoutes = Router();

authRoutes.post("/register", registrar);
authRoutes.post("/login", login);
authRoutes.get("/me", autenticar, me);
