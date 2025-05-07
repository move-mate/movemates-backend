import { PrismaClient } from '../generated/prisma'; // adjust path if needed
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@movemates.co.za';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      phone: '1234567890',
    },
  });

  console.log('Admin user created:', adminUser);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });