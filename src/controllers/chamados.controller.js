import { prisma } from "../lib/prisma.js";

const STATUS_VALIDOS = ["ABERTO", "EM_ANDAMENTO", "FECHADO"];

const textoValido = (valor) => typeof valor === "string" && valor.trim().length > 0;

// Regra do dono: busca o chamado e confere se quem pede é o dono ou ADMIN.
// Ordem: 400 (id ruim) -> 404 (não existe) -> 403 (existe, mas não é seu).
// Devolve o chamado, ou null depois de já ter respondido o erro.
async function buscarComPermissao(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erro: "ID inválido." });
    return null;
  }

  const chamado = await prisma.chamado.findUnique({ where: { id } });
  if (!chamado) {
    res.status(404).json({ erro: "Chamado não encontrado." });
    return null;
  }

  const ehDono = chamado.donoId === req.usuario.id; // id vem do TOKEN
  const ehAdmin = req.usuario.role === "ADMIN";
  if (!ehDono && !ehAdmin) {
    res.status(403).json({ erro: "Você não é o dono deste chamado." });
    return null;
  }
  return chamado;
}

export async function listar(req, res) {
  const filtro = req.usuario.role === "ADMIN" ? {} : { donoId: req.usuario.id };
  const chamados = await prisma.chamado.findMany({
    where: filtro,
    include: { dono: { select: { id: true, nome: true, email: true } } },
    orderBy: { id: "asc" },
  });
  res.json(chamados);
}

export async function criar(req, res) {
  const { titulo, descricao } = req.body ?? {};
  if (!textoValido(titulo) || !textoValido(descricao)) {
    return res.status(400).json({ erro: "Título e descrição são obrigatórios." });
  }

  // donoId vem do token. Qualquer "donoId" enviado no body é ignorado.
  const chamado = await prisma.chamado.create({
    data: {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      donoId: req.usuario.id,
    },
  });
  res.status(201).json(chamado);
}

export async function atualizar(req, res) {
  const chamado = await buscarComPermissao(req, res);
  if (!chamado) return;

  const { titulo, descricao, status } = req.body ?? {};
  const dados = {};

  if (titulo !== undefined) {
    if (!textoValido(titulo)) return res.status(400).json({ erro: "Título inválido." });
    dados.titulo = titulo.trim();
  }
  if (descricao !== undefined) {
    if (!textoValido(descricao)) return res.status(400).json({ erro: "Descrição inválida." });
    dados.descricao = descricao.trim();
  }
  if (status !== undefined) {
    // Só ADMIN muda o status (ex.: fechar o chamado).
    if (req.usuario.role !== "ADMIN") {
      return res.status(403).json({ erro: "Apenas ADMIN altera o status." });
    }
    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(", ")}.` });
    }
    dados.status = status;
  }
  if (Object.keys(dados).length === 0) {
    return res.status(400).json({ erro: "Nenhum campo para atualizar." });
  }

  const atualizado = await prisma.chamado.update({ where: { id: chamado.id }, data: dados });
  res.json(atualizado);
}

export async function remover(req, res) {
  const chamado = await buscarComPermissao(req, res);
  if (!chamado) return;

  await prisma.chamado.delete({ where: { id: chamado.id } });
  res.status(204).send();
}
