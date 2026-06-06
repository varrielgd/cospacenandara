import { DiscoveryService } from './src/services/discovery.service';
import dotenv from 'dotenv';
import { prisma } from './src/prisma';

dotenv.config();

async function test() {
  console.log('Testing REAL AI discovery...');
  try {
    const results = await DiscoveryService.discoverImporters('Coffee importers in Germany');
    console.log('Discovery Results:', results);
  } catch (error) {
    console.error('Discovery Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
