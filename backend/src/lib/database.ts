import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.config";
import { PrismaClient } from "../generated/prisma/client";

const pgAdapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const database = new PrismaClient({ adapter: pgAdapter });
