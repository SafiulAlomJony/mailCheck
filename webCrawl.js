const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
require("dotenv").config();

const webCrawl = async (res, email, ua) => {
  const browser = await puppeteer.launch({
    args: [
      `--disable-setuid-sandbox`,
      `--no-sandbox`,
      `--single-process`,
      `--no-zygote`,
      `--window-size=1920,1080`,
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    headless: "new",
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    const navigationPromise = page.waitForNavigation();
    const url = "https://accounts.google.com/v3/signin/identifier?continue=https://myaccount.google.com?service=accountsettings&flowName=GlifWebSignIn";
    await page.goto(url);
    await navigationPromise;
    await page.waitForSelector('input[type="email"]');
    // Clear the existing value in the email input field
    await page.$eval('input[type="email"]', (input) => (input.value = ""));
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', email);
    const [button] = await page.$x("//span[contains(., 'Next')]");
    if (button) {
      // Click the button
      await Promise.all([navigationPromise, button.click()]);
    }

    try {
      await page.waitForSelector('[aria-label*="@gmail.com"]', {
        visible: true,
        timeout: 10000,
      });
    } catch (e) {
      console.log(e);
    }

    let msg = "{}";
    msg = JSON.parse(msg);

     if (page.url().includes("challenge")) {
        msg[email] = "verify";
      } else if (page.url().includes("rejected")) {
        msg[email] = "disabled";
      } else {
        msg[email] = "not exists";
      }

    console.log(page.url());
    res.send(msg);
  } catch (e) {
    console.log(e);
    let result = `{"error":${JSON.stringify(e)},"body":""}`;
    res.send(JSON.parse(result));
  } finally {
    await browser.close();
  }
};

module.exports = { webCrawl };
