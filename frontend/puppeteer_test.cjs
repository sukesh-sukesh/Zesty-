const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log("Navigating to login page...");
    try {
        await page.goto('http://localhost:5173/support/login', { waitUntil: 'networkidle2' });
    } catch (e) {
        console.log("FAILED GOTO", e);
    }

    console.log("Typing credentials...");
    await page.type('input[type="text"]', 'chennai_l1_1');
    await page.type('input[type="password"]', 'password123');

    console.log("Clicking submit...");
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 5000));

    console.log("URL after login:", page.url());

    const html = await page.content();
    console.log("HTML length:", html.length);
    require('fs').writeFileSync('output.html', html);

    await browser.close();
})();
