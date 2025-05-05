import puppeteer from "puppeteer";
import type { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (url)
    return puppeteer
      .launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      .then(async (browser) => {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        await page.waitForSelector("#media");
        const element = await page.$("#media");
        if (element) {
          const buffer = await element.screenshot({
            type: "png",
          });

          await browser.close();

          return new Response(buffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-store",
            },
          });
        } else {
          page.close();
          browser.close();
          return new Response("This page is not a valid media page", {
            status: 404,
          });
        }
      })
      .catch((error) => {
        console.error("[Screenshot error]", error);
        return new Response("Failed to take screenshot", { status: 500 });
      });

  return new Response('Missing "url" query parameter', { status: 400 });
};
