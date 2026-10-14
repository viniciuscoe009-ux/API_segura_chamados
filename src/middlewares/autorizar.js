// Responde "o que você pode fazer?". Precisa rodar DEPOIS de autenticar.
// Falha de permissão é 403 (a pessoa é conhecida, mas não pode).
export function autorizar(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.role)) {
      return res
        .status(403)
        .json({ erro: "Acesso negado: seu perfil não tem permissão." });
    }
    next();
  };
}
