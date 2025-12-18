import puppeteer from "puppeteer";

export async function ScrapeHardware(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // wait until products load
  await page.waitForSelector(".product-thumb"); // change selector to match TMS site

  const products = await page.$$eval(".product-thumb", items =>
    items.map(el => ({
      name: el.querySelector(".caption a")?.textContent?.trim() || null,
      price: el.querySelector(".price")?.textContent?.trim() || null,
      image: el.querySelector("img")?.src || null,
      link: el.querySelector(".caption a")?.href || null
    }))
  );

  await browser.close();
  return products;
}
