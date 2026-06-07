import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  try {
    const targetId = '8ab27199-0f0e-4380-9500-4a520e3ee41a';
    const imp = await prisma.importer.findUnique({
      where: { id: targetId }
    });
    console.log('Target Importer:', imp);

    const emptyEmails = await prisma.importer.findMany({
      where: { email: '' }
    });
    console.log('Importers with empty email string:', emptyEmails.length);
    if (emptyEmails.length > 0) {
      console.log('First 5:', emptyEmails.slice(0, 5));
    }

    const nullEmails = await prisma.importer.findMany({
      where: { email: null }
    });
    console.log('Importers with null email:', nullEmails.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
