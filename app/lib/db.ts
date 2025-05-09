// lib/db.ts
import { PrismaClient } from '@/generated/prisma';


// declare global {
//   var prisma: PrismaClient | undefined;
// }

let prisma: PrismaClient | undefined;


// export const db = globalThis.prisma || new PrismaClient();
export const db = prisma || new PrismaClient();


if (process.env.NODE_ENV !== 'production') {
  prisma = db;
}