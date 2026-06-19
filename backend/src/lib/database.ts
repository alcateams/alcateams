import "./dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pgAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
export const database = new PrismaClient({ adapter: pgAdapter });
