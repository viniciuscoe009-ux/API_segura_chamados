import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });

// omit global: o campo password NUNCA sai nas consultas (R9).
// Só o login pede a senha explicitamente, com omit: { password: false }.
export const prisma = new PrismaClient({
  adapter,
  omit: { user: { password: true } },
});
