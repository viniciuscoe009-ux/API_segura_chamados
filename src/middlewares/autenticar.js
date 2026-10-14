import { verificarToken, TokenExpiredError } from "../lib/jwt.js";

// Responde "quem é você?". Qualquer falha aqui é 401.
export function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;

  // 401 tipo 1: token ausente
  if (!cabecalho) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  // 401 tipo 2: formato errado (esperado: "Bearer <token>")
  const [esquema, token, ...sobra] = cabecalho.split(" ");
  if (esquema !== "Bearer" || !token || sobra.length > 0) {
    return res
      .status(401)
      .json({ erro: "Formato inválido. Use: Authorization: Bearer <token>" });
  }

  // 401 tipo 3: assinatura inválida, token adulterado ou expirado
  try {
    const payload = verificarToken(token);
    req.usuario = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (erro) {
    const mensagem =
      erro instanceof TokenExpiredError ? "Token expirado." : "Token inválido.";
    return res.status(401).json({ erro: mensagem });
  }
}
