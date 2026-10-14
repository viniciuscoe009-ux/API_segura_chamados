import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { gerarToken } from "../lib/jwt.js";

const CUSTO_BCRYPT = 10;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Hash falso: o login gasta o mesmo tempo mesmo quando o e-mail não existe.
const HASH_FALSO = bcrypt.hashSync("senha-falsa-para-igualar-o-tempo", CUSTO_BCRYPT);

export async function registrar(req, res) {
  const { nome, email, password } = req.body ?? {};

  if (typeof nome !== "string" || !nome.trim()) {
    return res.status(400).json({ erro: "Nome é obrigatório." });
  }
  if (typeof email !== "string" || !EMAIL_VALIDO.test(email.trim())) {
    return res.status(400).json({ erro: "E-mail inválido." });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
  }
  // O bcrypt só considera os 72 primeiros bytes da senha.
  if (Buffer.byteLength(password) > 72) {
    return res.status(400).json({ erro: "A senha deve ter no máximo 72 bytes." });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const existente = await prisma.user.findUnique({ where: { email: emailNormalizado } });
  if (existente) {
    return res.status(409).json({ erro: "E-mail já cadastrado." });
  }

  const hash = await bcrypt.hash(password, CUSTO_BCRYPT);

  // role não vem do body: todo cadastro público nasce USER (padrão do schema).
  const usuario = await prisma.user.create({
    data: { nome: nome.trim(), email: emailNormalizado, password: hash },
  });

  res.status(201).json(usuario); // password não sai (omit global)
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ erro: "Informe e-mail e senha." });
  }

  const usuario = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    omit: { password: false }, // aqui a senha (hash) é necessária
  });

  const senhaConfere = await bcrypt.compare(password, usuario?.password ?? HASH_FALSO);

  // Mesma mensagem para e-mail inexistente e senha errada (não revela qual falhou).
  if (!usuario || !senhaConfere) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  const token = gerarToken(usuario);
  res.json({ token, tipo: "Bearer", expiraEm: process.env.JWT_EXPIRES_IN ?? "1h" });
}

export async function me(req, res) {
  const usuario = await prisma.user.findUnique({ where: { id: req.usuario.id } });
  if (!usuario) {
    return res.status(401).json({ erro: "Usuário do token não existe mais." });
  }
  res.json(usuario);
}
