export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: "Rota não encontrada." });
}

// Express 5 encaminha erros de funções async para cá automaticamente.
export function tratarErros(erro, req, res, next) {
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
  }
  if (erro.code === "P2002") {
    return res.status(409).json({ erro: "Registro já existe." });
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor." });
}
