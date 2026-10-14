import { Router } from "express";
import { listar, alterarPerfil } from "../controllers/users.controller.js";
import { autenticar } from "../middlewares/autenticar.js";
import { autorizar } from "../middlewares/autorizar.js";

export const usersRoutes = Router();

// Ordem importa: primeiro autenticar (401), depois autorizar (403).
usersRoutes.use(autenticar, autorizar("ADMIN"));

usersRoutes.get("/", listar);
usersRoutes.patch("/:id/role", alterarPerfil);
