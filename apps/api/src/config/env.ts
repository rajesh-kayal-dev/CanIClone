import dotenv from "dotenv";

export function loadApiEnvironment(): void {
  dotenv.config({
    path: "../../.env",
  });

  dotenv.config({
    path: "../../packages/database/.env",
  });
}
