import { Browser, chromium, Page } from "playwright";
import axios from "axios";

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

const sendMessage = async (message: string): Promise<void> => {
  console.log(message);
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }
    );
  } catch (error) {
    console.error(error);
  }
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
  });

  const page = await context.newPage();
  await page.goto(url);
  await page.waitForTimeout(1000);

  try {
    if (
      (await page.isHidden(
        "text=Bitte beachten Sie, dass aufgrund der hohen Nachfrage und aktuell begrenzter Imp"
      )) ||
      (await page.isVisible(
        "#booking-content .booking-availabilities .availabilities-day"
      ))
    ) {
      await sendMessage(`🚨 There might be slots avaliable at ${text}: ${url}`);
    } else {
      console.log(`No slots avaliable at ${text}: ${url}!`);
    }
  } catch {
    await sendMessage(
      `Error occured. Could not check slots for ${text}: ${url}`
    );
  }
  await page.close();
  await context.close();
};

export const checkSlots = async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 1000 });
  for (const location of vaccinationLocations) {
    await checkLocation(location, browser);
  }
  await browser.close();
};
