const puppeteer = require("puppeteer-extra");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
require("dotenv").config();

const mailCheck = async (res, email, ua) => {
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
    if (ua) {
      await page.setUserAgent(ua);
    }

    const url =
      "https://accounts.google.com/v3/signin/identifier?continue=https://myaccount.google.com?service=accountsettings&flowName=GlifWebSignIn";
    const navigationPromise = page.waitForNavigation();
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

    if (page.url().includes("/identifier?")) {
      console.log("Account Not Exits");
    } else if (page.url().includes("/rejected?")) {
      console.log("Account Disabled");
    } else {
      console.log(page.url());
      console.log("wait for selector");
      await page.waitForSelector('[aria-label*="@gmail.com"]', {
        visible: true,
        timeout: 3000,
      });
      console.log("selector found");
      await page.click('[aria-label*="@gmail.com"]');
      console.log("selector clicked");
    }
    await page.waitForTimeout(5000);
    console.log(page.url());
    res.send({ url: page.url() });
  } catch (e) {
    let result = `{"error":${JSON.stringify(e)},"body":""}`;
    res.send(JSON.parse(result));
  } finally {
    await browser.close();
  }
};

module.exports = { mailCheck };
