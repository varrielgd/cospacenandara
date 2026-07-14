export default {
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '',
  },
};