import { prisma } from "../lib/prisma.js";

const PERFIS_VALIDOS = ["USER", "ADMIN"];

export async function listar(req, res) {
  const usuarios = await prisma.user.findMany({ orderBy: { id: "asc" } });
  res.json(usuarios);
}

export async function alterarPerfil(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  const { role } = req.body ?? {};
  if (!PERFIS_VALIDOS.includes(role)) {
    return res.status(400).json({ erro: `Perfil inválido. Use: ${PERFIS_VALIDOS.join(", ")}.` });
  }

  const existe = await prisma.user.findUnique({ where: { id } });
  if (!existe) {
    return res.status(404).json({ erro: "Usuário não encontrado." });
  }

  const atualizado = await prisma.user.update({ where: { id }, data: { role } });
  res.json(atualizado);
}
