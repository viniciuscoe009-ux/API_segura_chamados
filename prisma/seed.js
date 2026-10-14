import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const SENHA_PADRAO = "Senha@123";
const hash = await bcrypt.hash(SENHA_PADRAO, 10);

const usuario = (nome, email, role) =>
  prisma.user.upsert({
    where: { email },
    update: { nome, role, password: hash },
    create: { nome, email, role, password: hash },
  });

await prisma.chamado.deleteMany();

await usuario("Administrador", "admin@suporte.com", "ADMIN");
const ana = await usuario("Ana Souza", "ana@suporte.com", "USER");
const bruno = await usuario("Bruno Lima", "bruno@suporte.com", "USER");

await prisma.chamado.createMany({
  data: [
    { titulo: "Impressora sem toner", descricao: "A impressora do laboratório 2 não imprime.", donoId: ana.id },
    { titulo: "Sem acesso ao Wi-Fi", descricao: "Não consigo conectar à rede da escola.", donoId: ana.id, status: "EM_ANDAMENTO" },
    { titulo: "Projetor não liga", descricao: "O projetor da sala 5 não dá sinal.", donoId: bruno.id },
  ],
});

console.log("Seed concluído. Senha de todos os usuários:", SENHA_PADRAO);
await prisma.$disconnect();
