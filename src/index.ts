import { chromium, Page } from "playwright";
import axios from "axios";
import { getEnvVar } from "./utils";

const check = async (text: string, page: Page): Promise<void> => {
  await page.click(`text=${text}`);
  await page.waitForTimeout(2000);
  const url = await page.url();
  try {
    if (
      (await page.isHidden(
        "text=Bitte beachten Sie, dass aufgrund der hohen Nachfrage und aktuell begrenzter Imp"
      )) ||
      (await page.isVisible(
        "#booking-content .booking-availabilities .availabilities-day"
      ))
    ) {
      const message = `🚨 There might be spots avaliable at ${text}: ${url}!`;
      await axios.post(
        `https://api.telegram.org/bot${getEnvVar(
          "TELEGRAM_BOT_TOKEN"
        )}/sendMessage?chat_id=${getEnvVar("TELEGRAM_CHAT_ID")}&text=${message}`
      );
      console.log(message);
    } else {
      console.log(`No spots avaliable at ${text}: ${url}!`);
    }
  } catch {
    console.log(`Error occured. Could not check spots for ${text}: ${url}!`);
  }
};

(async () => {
  await axios.post(
    `https://api.telegram.org/bot${getEnvVar(
      "TELEGRAM_BOT_TOKEN"
    )}/sendMessage?chat_id=${getEnvVar(
      "TELEGRAM_CHAT_ID"
    )}&text=${"Checking Corona vaccination slots..."}`
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await context.newPage();
  await page.goto("https://www.doctolib.de/institut/berlin/ciz-berlin-berlin");

  await check("Arena Berlin", page);
  await check("Messe Berlin/ Halle 21", page);
  await check("Erika-Heß-Eisstadion", page);
  await check("Velodrom Berlin", page);
  await check("Flughafen Tegel", page);
  await check("Flughafen Tempelhof (Moderna)", page);
  await check("Flughafen Tegel (Moderna)", page);

  await page.close();
  await context.close();
  await browser.close();

  await axios.post(
    `https://api.telegram.org/bot${getEnvVar(
      "TELEGRAM_BOT_TOKEN"
    )}/sendMessage?chat_id=${getEnvVar("TELEGRAM_CHAT_ID")}&text=${"Done."}`
  );
})();
