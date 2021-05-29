import { formatISO } from "date-fns";
import { Page } from "playwright";

export const getEnvVar = (key: string) => {
  const value = process.env[key];
  if (!value) throw Error(`Missing environment variable ${key}!`);
  return value;
};

export const makePageScreenShot = async (page: Page) => {
  console.log("Saving screenshot...");
  await page.screenshot({
    path: `artifacts/screenshots/screenshot-${formatISO(new Date())}.png`,
  });
};
