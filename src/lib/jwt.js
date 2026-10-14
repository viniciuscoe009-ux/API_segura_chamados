import jwt from "jsonwebtoken";

export function gerarToken(usuario) {
  // sub = id do usuário, role = perfil. Nada de senha/e-mail no payload.
  return jwt.sign({ role: usuario.role }, process.env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    algorithm: "HS256",
  });
}

export function verificarToken(token) {
  // Fixar o algoritmo evita aceitar tokens com alg "none" ou trocado.
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
}

export const { TokenExpiredError } = jwt;
