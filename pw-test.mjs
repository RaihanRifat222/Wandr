import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const errors = [];
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => errors.push(e.message));

await page.goto('http://localhost:3000/trips/new', { waitUntil: 'networkidle', timeout: 15000 });
console.log('Final URL:', page.url());

const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 1000));
console.log('Body HTML snippet:', bodyHTML);

if (errors.length) console.log('JS Errors:', errors);
if (logs.length) console.log('Console:', logs.slice(0, 10).join('\n'));

await browser.close();
