const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    await page.goto('http://k-db.com/stocks/', {waitUntil: 'networkidle'});
    await page.click('select#selectdate');
    await page.waitForSelector('#selectdate');

    const dates = await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('option'));
        return options.map(option => option.textContent);
    });

    console.log(dates);

    await browser.close();
})();
