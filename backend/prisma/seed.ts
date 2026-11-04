import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function seedAdmin(prisma: PrismaClient): Promise<void> {
  const name = requiredEnvironmentVariable('ADMIN_NAME');
  const email = requiredEnvironmentVariable('ADMIN_EMAIL').toLowerCase();
  const password = requiredEnvironmentVariable('ADMIN_PASSWORD');

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }

  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must contain at least 6 characters');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.role !== UserRole.ADMIN) {
      throw new Error('ADMIN_EMAIL is already assigned to a non-admin account');
    }

    console.log(`Admin account already exists for ${email}; no changes were made.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      vendorId: null,
    },
  });

  console.log(`Admin account created for ${email}.`);
}

async function main(): Promise<void> {
  const connectionString = requiredEnvironmentVariable('DATABASE_URL');
  const schema = new URL(connectionString).searchParams.get('schema') ?? 'public';
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });

  try {
    await seedAdmin(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed error';
  console.error(`Admin seed failed: ${message}`);
  process.exitCode = 1;
});
