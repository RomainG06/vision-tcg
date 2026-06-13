module.paths.unshift('/tmp/puppeteer/node_modules');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

const CHROMIUM = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0 Safari/537.36';

async function searchBing(page, query){
  const url = 'https://www.bing.com/search?q=' + encodeURIComponent(query) + '&count=20&setlang=fr';
  await page.goto(url, {waitUntil:'networkidle2', timeout:30000});
  await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(r=>setTimeout(r,1000)));
  const links = await page.$$eval('li.b_algo h2 a', as => as.map(a=>a.href));
  return links.slice(0,20);
}

async function extractFromPage(page, url){
  try{
    await page.goto(url, {waitUntil:'networkidle2', timeout:30000});
  }catch(e){
    try{ await page.goto(url, {waitUntil:'domcontentloaded', timeout:30000}); }catch(e2){
      return {url, error: 'load_failed'};
    }
  }
  const html = await page.content();
  if(html.includes('captcha-delivery') || html.includes('Error Page | eBay') || html.includes('Please enable JavaScript')){
    return {url, error: 'bot_protection'};
  }
  const info = await page.evaluate(()=>{
    const getText = sel => { const el = document.querySelector(sel); return el?el.innerText.trim():'' };
    const title = document.title || getText('h1') || getText('h2') || '';
    const body = document.body.innerText || '';
    const locMatch = body.match(/(Nice|Cannes|Antibes|Monaco|Vence|Grasse|Nice \(06\)|Alpes-Maritimes)/i);
    const vf = /édition française|texte en français|français|\bVF\b/i.test(body+title);
    const numMatch = body.match(/(\d{1,4})\s+cartes/);
    const ncartes = numMatch?parseInt(numMatch[1],10):null;
    const priceMatch = body.match(/\b\d{1,4}[\s\u00A0]?€\b/);
    const price = priceMatch?priceMatch[0]:'';
    return {title, price, location: locMatch?locMatch[0]:null, french: vf, ncartes};
  });
  return Object.assign({url}, info);
}

(async ()=>{
  const browser = await puppeteer.launch({executablePath:CHROMIUM, args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'], headless:true});
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.setExtraHTTPHeaders({'Accept-Language':'fr-FR,fr;q=0.9'});

  const targets = [
    'site:ebay.fr "lot cartes Pokémon" "édition française"',
    'site:leboncoin.fr "lot cartes Pokémon" Nice'
  ];
  const found = [];
  for(const q of targets){
    const links = await searchBing(page, q);
    for(const l of links){
      if(found.length>=50) break;
      if(!(l.includes('ebay.fr')||l.includes('leboncoin.fr')||l.includes('vinted')||l.includes('facebook.com/marketplace'))) continue;
      const res = await extractFromPage(page, l);
      found.push(res);
    }
  }
  await browser.close();
  fs.writeFileSync('results.json', JSON.stringify(found, null, 2));
  console.log('saved', found.length);
})();
