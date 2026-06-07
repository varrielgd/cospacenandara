import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up empty strings in database...');
  try {
    // Update Importers where email is empty string to NULL
    const emailUpdate = await prisma.importer.updateMany({
      where: { email: '' },
      data: { email: null }
    });
    console.log(`Updated ${emailUpdate.count} importers with empty email to NULL.`);

    // Update Importers where website is empty string to NULL
    const websiteUpdate = await prisma.importer.updateMany({
      where: { website: '' },
      data: { website: null }
    });
    console.log(`Updated ${websiteUpdate.count} importers with empty website to NULL.`);

    // Check if there are other unique fields like phone or linkedin that might be empty strings
    const phoneUpdate = await prisma.importer.updateMany({
      where: { phone: '' },
      data: { phone: null }
    });
    console.log(`Updated ${phoneUpdate.count} importers with empty phone to NULL.`);

    const linkedinUpdate = await prisma.importer.updateMany({
      where: { linkedin: '' },
      data: { linkedin: null }
    });
    console.log(`Updated ${linkedinUpdate.count} importers with empty linkedin to NULL.`);

  } catch (error) {
    console.error('Database cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
