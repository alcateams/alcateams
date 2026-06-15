import app from "./app";
import { logger } from "./config/logger.config";
import { prisma } from "./infrastructure/database/prisma.client";
import { rainbowClient } from "./infrastructure/rainbow/rainbowClient";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Connected to database");

    await rainbowClient.start();

    // MeiliSearch connect...

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error occurred while starting the server", error);
    if (prisma) {
      await prisma.$disconnect();
    }
    process.exit(1);
  }
}

bootstrap();
