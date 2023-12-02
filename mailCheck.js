const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
const mailCheck = async (res, emails, ua) => {
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
  const page = await browser.newPage();
  await page.setUserAgent(ua);

  const navigationPromise = page.waitForNavigation();

  await page.goto("https://accounts.google.com/");

  await navigationPromise;

  let msg = "{}";
  msg = JSON.parse(msg);

  for (const email of emails) {
    console.log("Email:" + email);
    await page.waitForSelector('input[type="email"]');
    console.log("clear input value");
    await page.$eval('input[type="email"]', (input) => (input.value = ""));
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', email);

    const [button] = await page.$x("//span[contains(., 'Next')]");

    if (button) {
      await Promise.all([navigationPromise, button.click()]);
    }

    try {
      await page.waitForSelector('[aria-label*="@gmail.com"]', {
        visible: true,
        timeout: 10000,
      });
      // Check if the URL contains a specific string
      if (page.url().includes("challenge")) {
        msg[email] = "verify";
      } else if (page.url().includes("rejected")) {
        msg[email] = "disabled";
      } else {
        msg[email] = "not exists";
      }
      console.log(page.url());
      res.send(msg);
      await browser.close();
    } catch (error) {}
  }
};

module.exports = { mailCheck };
