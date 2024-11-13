import Tinypng from "./core";
import { initI18next } from "./shared/i18next";

async function bootstrap() {
  await initI18next();
  const tinypng = new Tinypng();
  tinypng.init();
}

bootstrap()