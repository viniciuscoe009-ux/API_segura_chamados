import express from "express";
import { authRoutes } from "./routes/auth.routes.js";
import { chamadosRoutes } from "./routes/chamados.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { rotaNaoEncontrada, tratarErros } from "./middlewares/erros.js";

export const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensagem: "API Chamados de Suporte no ar." });
});

app.use("/auth", authRoutes);
app.use("/chamados", chamadosRoutes);
app.use("/users", usersRoutes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);
