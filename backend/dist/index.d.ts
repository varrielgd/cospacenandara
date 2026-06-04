import { PrismaClient } from '@prisma/client';
import winston from 'winston';
declare const app: import("express-serve-static-core").Express;
declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare const logger: winston.Logger;
export { app, prisma, logger };
//# sourceMappingURL=index.d.ts.map