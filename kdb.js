const puppeteer = require('puppeteer');

const KDB_STOCKS = 'http://k-db.com/stocks/';
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

function session_page(date, session) {
    let tail = {
        morning() { return '/a'; },
        afternoon() { return '/b'; },
        all() { return ''; }
    };
    return KDB_STOCKS + date + tail[session]();
}

async function get_csv(browser, date, session) {
    const page = await browser.newPage();
    await page.goto(session_page(date, session), {waitUntil: 'networkidle'});

    const DOWNLOAD_LINK = '#downloadlink > a';
    await page.waitForSelector(DOWNLOAD_LINK, {visible: true});
    await page.click(DOWNLOAD_LINK, {delay: 200});
    await page.waitForNavigation({waitUntil: 'networkidle'});
    await page.close();
    return true;
}

(async () => {
    const argv = require('minimist')(process.argv.slice(2));
    console.dir(argv);

    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    // Option:
    //   -l [date]    List all the available dates on k-db.com after [date]
    if (argv['l']) {
        await page.goto(KDB_STOCKS, {waitUntil: 'networkidle'});
        await page.click('select#selectdate');
        await page.waitForSelector('#selectdate');

        const dates = await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll('option'));
            return options.map(option => option.textContent);
        });

        const from =
            (typeof(argv['l']) === 'string' && argv['l'].match(RE_DATE) ?
                argv['l'] : '');
        for (let date of dates) {
            if (date.match(RE_DATE) && date > from) {
                console.log(date);
            }
        }
    }

    // Option:
    //   -d <date>    Retrieve the csv data of the <date>
    if (typeof(argv['d']) === 'string' && argv['d'].match(RE_DATE)) {
        for (let session of ['morning', 'afternoon', 'all']) {
            await get_csv(browser, argv['d'], session);
        }
    }

    await browser.close();
})();
