
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Define users
  const users = [
    {
      email: "nandaranusamontierra@gmail.com",
      password: "test123", // Change this to actual password later!
      firstName: "Nandara",
      lastName: "Nusamontierra",
      role: "ADMIN",
      isVerified: true,
    },
    {
      email: "nandalatifanibudiarti97@gmail.com",
      password: "test123", // Change this too!
      firstName: "Nanda",
      lastName: "Latifani",
      role: "ADMIN",
      isVerified: true,
    },
  ];

  for (const userData of users) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      console.log(`User ${userData.email} already exists, skipping...`);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
    console.log(`Created user: ${user.email}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
