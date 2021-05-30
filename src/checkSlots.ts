import { Browser, chromium } from "playwright";
import axios from "axios";
import { getEnvVar, makePageScreenShot } from "./utils";

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

const sendMessage = async (message: string): Promise<void> => {
  console.log(message);
  try {
    await axios.post(
      `https://api.telegram.org/bot${getEnvVar(
        "TELEGRAM_BOT_TOKEN"
      )}/sendMessage`,
      {
        chat_id: getEnvVar("TELEGRAM_CHAT_ID"),
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
      width: 375,
      height: 812,
    },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForTimeout(5000);

  try {
    if (await page.isVisible("text=Wählen Sie einen ersten Termin aus")) {
      await makePageScreenShot(page);
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
  const browser = await chromium.launch({ headless: true });
  for (const location of vaccinationLocations) {
    await checkLocation(location, browser);
  }
  await browser.close();
};
