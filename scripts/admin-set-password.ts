/**
 * Asigna la contraseña de un usuario administrador.
 *
 * Uso:
 *   npm run admin:password -- <email>          # le pide la contraseña
 *   npm run admin:password -- <email> <pass>   # contraseña por argumento
 *
 * El hash se guarda con scrypt (sin dependencias externas).
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/features/auth/services/password";

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.toLowerCase();
  if (!email) {
    console.error("Uso: npm run admin:password -- <email> [contraseña]");
    process.exit(1);
  }

  let password = args[1];
  if (!password) {
    const rl = createInterface({ input: stdin, output: stdout });
    password = await rl.question("Contraseña (mínimo 8 caracteres): ");
    rl.close();
  }
  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }
  if (password.length > 128) {
    console.error("La contraseña es demasiado larga.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No existe el usuario "${email}".`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (user.role !== "ADMIN") {
    console.error(`El usuario "${email}" no tiene rol ADMIN.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const hash = hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  console.log(`Contraseña configurada para ${email}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});