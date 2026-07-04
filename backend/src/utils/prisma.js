import { PrismaClient } from "@prisma/client";

// A single shared Prisma instance for the whole app, so we don't open a
// new database connection pool on every request.
const prisma = new PrismaClient();

export default prisma;
