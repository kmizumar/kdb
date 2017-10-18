const puppeteer = require('puppeteer');
const fs = require('fs');

const KDB_STOCKS = 'http://k-db.com/stocks/';
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

const headless = true;
const downloadPath = './download';

const session_suffix = {
  morning() { return '/a'; },
  afternoon() { return '/b'; },
  all() { return ''; }
};

async function isDownloadComplete(path, filename) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                if (files.length === 0) {
                    resolve(false);
                    return;
                }
                for (let file of files) {
                    if (/.*\.crdownload$/.test(file)) {
                        resolve(false);
                        return;
                    }
                    if (file === filename) {
                        resolve(true);
                        return;
                    }
                }
                resolve(false);
            }
        });
    });
}

async function waitDownloadComplete(path, filename, waitTimeSpanMs = 1000, timeoutMs = 60 * 1000) {
    return new Promise((resolve, reject) => {
        const wait = (waitTimeSpanMs, totalWaitTimeMs) => setTimeout(
            () => isDownloadComplete(path, filename).then(
                (completed) => {
                    if (completed) {
                        resolve();
                    }
                    else {
                        const nextTotalTime = totalWaitTimeMs + waitTimeSpanMs;
                        if (nextTotalTime >= timeoutMs) {
                            reject('timeout');
                        }
                        const nextSpan = Math.min(
                            waitTimeSpanMs,
                            timeoutMs - nextTotalTime
                        );
                        wait(nextSpan, nextTotalTime);
                    }
                }
            ).catch(
                (err) => { reject(err); }
            ),
            waitTimeSpanMs
        );
        wait(waitTimeSpanMs, 0);
    });
}

async function get_csv(browser, date, session) {
    function session_page(date, session) {
        return KDB_STOCKS + date + session_suffix[session]();
    }
    function filename(date, session) {
        return 'stocks_' + date + session_suffix[session] + '.csv';
    }

    const page = await browser.newPage();
    await page._client.send(
        'Page.setDownloadBehavior',
        {behavior : 'allow', downloadPath: downloadPath}
    );
    await page.goto(session_page(date, session), {waitUntil: 'networkidle'});

    const DOWNLOAD_LINK = '#downloadlink > a';
    await page.waitForSelector(DOWNLOAD_LINK, {visible: true});
    await page.click(DOWNLOAD_LINK, {delay: 200});
    await waitDownloadComplete(downloadPath, filename(date, session))
        .catch((err) => console.error(err));
    await page.close();
    return true;
}

(async () => {
    const argv = require('minimist')(process.argv.slice(2));
    // console.dir(argv);

    const browser = await puppeteer.launch({
        headless: headless
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
