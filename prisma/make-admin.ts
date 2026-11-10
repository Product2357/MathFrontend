import { emitKeypressEvents } from "node:readline";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/server/passwords";

const email = process.argv[2]?.trim().toLowerCase();
const connectionString = process.env.DATABASE_URL;

function promptHidden(label: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Run this command in an interactive terminal to enter the admin password securely.");
  }

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdout.write(label);

  return new Promise<string>((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("keypress", onKeypress);
      process.stdout.write("\n");
    };

    const onKeypress = (character: string, key: { name?: string; ctrl?: boolean; meta?: boolean }) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Password entry cancelled"));
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(value);
      } else if (key.name === "backspace") {
        value = Array.from(value).slice(0, -1).join("");
      } else if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

async function main() {
  if (!email || !connectionString) {
    throw new Error("Usage: npm run db:make-admin -- user@example.com (DATABASE_URL is also required)");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please provide a valid email address.");
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });

    let passwordHash = existingUser?.passwordHash;
    if (!existingUser || !passwordHash) {
      const password = await promptHidden("Set admin password (minimum 10 characters): ");
      const confirmation = await promptHidden("Confirm admin password: ");
      if (password.length < 10 || password.length > 128) {
        throw new Error("Password must be between 10 and 128 characters.");
      }
      if (password !== confirmation) {
        throw new Error("Passwords do not match.");
      }
      passwordHash = await hashPassword(password);
    }

    const user = existingUser
      ? await db.user.update({
          where: { id: existingUser.id },
          data: { role: "ADMIN", ...(existingUser.passwordHash ? {} : { passwordHash }) },
          select: { email: true, role: true },
        })
      : await db.user.create({
          data: { email, role: "ADMIN", passwordHash },
          select: { email: true, role: true },
        });

    console.log(`${existingUser ? "Granted" : "Created"} ${user.role} account for ${user.email}`);
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});