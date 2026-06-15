import { Logger, type ILogObj } from "tslog";

export const logger: Logger<ILogObj> = new Logger({
  name: "AlcaTeams",
  minLevel: process.env.NODE_ENV === "production" ? 3 : 0,
  hideLogPositionForProduction: true,
});
