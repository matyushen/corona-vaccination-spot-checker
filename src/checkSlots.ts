import { Browser, chromium, Page } from "playwright";
import { getEnvVar } from "./utils";
import { formatISO } from "date-fns";
import { createReadStream } from "fs";
const telegram = require("telegram-bot-api");

const client = new telegram({
  token: getEnvVar("TELEGRAM_BOT_TOKEN"),
});

type VaccinationLocations = {
  url: string;
  text: string;
};

const vaccinationLocations: VaccinationLocations[] = [
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28BioNTech-Pfizer%29-1779-impfung-covid-19-1779&placeId=practice-158431&specialityId=1779",
    text: "Arena Berlin",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28BioNTech-Pfizer%29-1779-impfung-covid-19-1779&placeId=practice-158434&specialityId=1779",
    text: "Messe Berlin/ Halle 21",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28Moderna%29-1779-impfung-covid-19-1779&placeId=practice-158437&specialityId=1779",
    text: "Erika-Heß-Eisstadion",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28BioNTech-Pfizer%29-1779-impfung-covid-19-1779&placeId=practice-158435&specialityId=1779",
    text: "Velodrom Berlin",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28BioNTech-Pfizer%29-1779-impfung-covid-19-1779&placeId=practice-158436&specialityId=1779",
    text: "Flughafen Tegel",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28Moderna%29-1779-impfung-covid-19-1779&placeId=practice-191611&specialityId=1779",
    text: "Flughafen Tempelhof (Moderna)",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin/booking/availabilities?motiveKey=Erstimpfung%20Covid-19%20%28Moderna%29-1779-impfung-covid-19-1779&placeId=practice-191612&specialityId=1779",
    text: "Flughafen Tegel (Moderna)",
  },
];

const sendMessage = async (message: string, page: Page): Promise<void> => {
  const path = `artifacts/screenshots/screenshot-${formatISO(new Date())}.png`;
  await page.screenshot({
    path,
    fullPage: true,
  });

  client
    .sendPhoto({
      chat_id: getEnvVar("TELEGRAM_CHAT_ID"),
      caption: message,
      photo: createReadStream(path),
    })
    .then(() => {
      console.log(message);
    })
    .catch(console.error);
};

const checkLocation = async (
  { url, text }: VaccinationLocations,
  browser: Browser
): Promise<void> => {
  const context = await browser.newContext({
    viewport: {
      width: 375,
      height: 812,
    },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.click(
    '[aria-label="Unsere Datenverarbeitung akzeptieren und schließen"]'
  );

  await page.waitForTimeout(4000);

  const cards = await page.$$(".dl-availabilities-card");

  try {
    if (cards.length > 0) {
      await sendMessage(
        `🚨 There might be slots avaliable at ${text}: ${url}`,
        page
      );
    } else {
      console.log(`No slots avaliable at ${text}: ${url}!`);
    }
  } catch {
    await sendMessage(
      `Error occured. Could not check slots for ${text}: ${url}`,
      page
    );
  }
  await page.close();
  await context.close();
};

export const checkSlots = async () => {
  const browser = await chromium.launch({ headless: true });
  for (const location of vaccinationLocations) {
    await checkLocation(location, browser);
  }
  await browser.close();
};
