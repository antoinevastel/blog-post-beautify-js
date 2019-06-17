const fs = require('fs');
const crypto = require('crypto');
const beautify = require('js-beautify').js
const puppeteer = require('puppeteer');

function convertURLToFileName(url) {
  return crypto.createHash('md5').update(url).digest("hex");
}

(async () => {

  const urls = [
    'https://antoinevastel.com/bots',
    'https://antoinevastel.com',
  ];

  const browser = await puppeteer.launch();

  for (const url of urls) {
    console.log(`Crawling ${url}`);
    const page = await browser.newPage();
    const beautifiedFilePromises = [];
    page.on('requestfinished', async (interceptedRequest) => {
      if(interceptedRequest.resourceType() === 'script') {
        beautifiedFilePromises.push(new Promise(async (resolve) => {
          let redirectChain = interceptedRequest.redirectChain();
          if(redirectChain.length === 0) {
            let response = await interceptedRequest.response();
            const fileName = convertURLToFileName(interceptedRequest.url());
            if (response !== null) {
              let contentRequest = await response.text();
              const scriptBeautified = beautify(contentRequest, { 
                indent_size: 2, 
                space_in_empty_paren: true 
              });

              fs.writeFile(`files/${fileName}.js`, scriptBeautified, 'utf8', (err) => {
                if (err !== null) {
                  console.error(`Could not save the beautified file: ${err.message}`);
                }
                resolve();
              });
            }
          }
        })); 
      }
    });

    await page.goto(url);
    await Promise.all(beautifiedFilePromises);
    await page.close();
  }

  await browser.close();
})();