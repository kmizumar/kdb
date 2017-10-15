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

    for (var date of dates) {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log(date);
        }
    }

    await browser.close();
})();
