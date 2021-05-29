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

  try {
    if (
      (await page.isHidden(
        "text=Bitte beachten Sie, dass aufgrund der hohen Nachfrage und aktuell begrenzter Imp"
      )) ||
      (await page.isVisible(
        "#booking-content .booking-availabilities .availabilities-day"
      ))
    ) {
      const message = `🚨 There might be spots avaliable at ${text}: ${url}`;
      console.log(message);
      try {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${message}`
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log(`No spots avaliable at ${text}: ${url}!`);
    }
  } catch {
    const errorMessage = `Error occured. Could not check spots for ${text}: ${url}`;
    console.log(errorMessage);
    try {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${errorMessage}`
      );
    } catch (error) {
      console.error(error);
    }
  }
  await page.close();
  await context.close();
};

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 1000 });
  for (const location of vaccinationLocations) {
    await checkLocation(location, browser);
  }
  await browser.close();
})();
