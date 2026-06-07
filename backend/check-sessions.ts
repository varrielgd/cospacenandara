import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Querying recent discovery sessions...');
  try {
    const sessions = await prisma.discoverySession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Recent sessions:', JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error querying sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
