const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log("Navigating to master login page...");
    await page.goto('http://localhost:5173/master-admin/login', { waitUntil: 'networkidle2' });

    console.log("Typing credentials...");
    await page.type('input[type="text"]', 'master');
    await page.type('input[type="password"]', 'master123');

    console.log("Clicking submit...");
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 5000));

    console.log("URL after login:", page.url());

    const html = await page.content();
    console.log("HTML length:", html.length);
    require('fs').writeFileSync('output.html', html);

    await browser.close();
})();
