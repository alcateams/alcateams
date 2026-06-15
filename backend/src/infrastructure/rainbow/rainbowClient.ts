import RainbowSDK from "rainbow-node-sdk";
import { logger } from "../../config/logger.config";

class RainbowClient {
  private static instance: RainbowClient;
  private sdk: any;
  private isConnected: boolean = false;

  private constructor() {
    const options = {
      rainbow: {
        host: process.env.RAINBOW_HOST || "sandbox",
      },
      application: {
        appID: process.env.OPENRAINBOW_APPLICATION_ID || "",
        appSecret: process.env.OPENRAINBOW_APPLICATION_SECRET || "",
      },
      logs: {
        enableConsoleLogs: false,
        enableFileLogs: false,
        color: true,
        level: "info",
      },
      im: {
        sendReadReceipt: true,
      },
    };

    this.sdk = new RainbowSDK(options);
    this.setupListeners();
  }

  public static getInstance(): RainbowClient {
    if (!RainbowClient.instance) {
      RainbowClient.instance = new RainbowClient();
    }
    return RainbowClient.instance;
  }

  private setupListeners(): void {
    this.sdk.events.on("rainbow_onready", () => {
      this.isConnected = true;
      logger.info("[RainbowClient] Rainbow SDK is connected and ready.");
    });

    this.sdk.events.on("rainbow_onstopped", () => {
      this.isConnected = false;
      logger.info("[RainbowClient] Rainbow SDK has stopped.");
    });

    this.sdk.events.on("rainbow_onerror", (err: any) => {
      logger.error("[RainbowClient] Rainbow SDK Error:", err);
    });
  }

  public async start(): Promise<void> {
    if (this.isConnected) {
      logger.info("[RainbowClient] Rainbow SDK is already connected.");
      return;
    }

    logger.info("[RainbowClient] Starting Rainbow SDK...");
    return new Promise((resolve, reject) => {
      const onReady = () => {
        this.sdk.events.removeListener("rainbow_onerror", onError);
        resolve();
      };

      const onError = (err: any) => {
        this.sdk.events.removeListener("rainbow_onready", onReady);
        reject(err);
      };

      this.sdk.events.once("rainbow_onready", onReady);
      this.sdk.events.once("rainbow_onerror", onError);

      try {
        this.sdk.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): void {
    if (!this.isConnected) return;
    this.sdk.stop();
  }

  public getSDK(): any {
    return this.sdk;
  }
}

export const rainbowClient = RainbowClient.getInstance();
