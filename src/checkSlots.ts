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
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158431",
    text: "Arena Berlin",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158434",
    text: "Messe Berlin/ Halle 21",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158437",
    text: "Erika-Heß-Eisstadion",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435",
    text: "Velodrom Berlin",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158436",
    text: "Flughafen Tegel",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-191611",
    text: "Flughafen Tempelhof (Moderna)",
  },
  {
    url: "https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-191612",
    text: "Flughafen Tegel (Moderna)",
  },
];

const sendMessage = async (message: string, page: Page): Promise<void> => {
  const path = `artifacts/screenshots/screenshot-${formatISO(new Date())}.png`;
  await page.screenshot({
    path,
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
      width: 1440,
      height: 900,
    },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.click(
    '[aria-label="Unsere Datenverarbeitung akzeptieren und schließen"]'
  );

  await page.waitForTimeout(5000);

  const warningTextVisible = await page.isVisible(
    ".booking-message.booking-message-warning"
  );

  try {
    if (!warningTextVisible) {
      await sendMessage(
        `🚨 There might be slots avaliable at ${text}: ${url}`,
        page
      );
    } else {
      console.log(`No slots avaliable at ${text}...`);
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
  const browser = await chromium.launch({
    headless: getEnvVar("HEADLESS") === "true",
  });
  for (const location of vaccinationLocations) {
    await checkLocation(location, browser);
  }
  await browser.close();
};
