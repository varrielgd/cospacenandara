import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Querying current importers in database...');
  try {
    const total = await prisma.importer.count();
    console.log('Total Importers:', total);

    const importers = await prisma.importer.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        website: true
      },
      take: 20
    });
    console.log('Importers list:', importers);
  } catch (error) {
    console.error('Error querying importers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
