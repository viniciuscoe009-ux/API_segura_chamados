import { Router } from "express";
import { listar, criar, atualizar, remover } from "../controllers/chamados.controller.js";
import { autenticar } from "../middlewares/autenticar.js";

export const chamadosRoutes = Router();

chamadosRoutes.use(autenticar); // todas as rotas de chamados exigem login

chamadosRoutes.get("/", listar);
chamadosRoutes.post("/", criar);
chamadosRoutes.put("/:id", atualizar);
chamadosRoutes.delete("/:id", remover);
