#!/usr/bin/env node
/**
 * Interactive CAPTCHA resolver
 * Opens browser, waits for manual CAPTCHA resolution, then saves cookies
 */

import { LeboncoinFetcher } from './src/fetchers/leboncoin.js';
import { logger } from './src/utils/logger.js';
import readline from 'readline';

process.env.LOG_LEVEL = 'info';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function resolveCaptcha() {
  console.log('\n🔐 **CAPTCHA Resolver Interactif**\n');
  console.log('Ce script va:');
  console.log('1. Ouvrir un navigateur Chrome');
  console.log('2. Naviguer vers Leboncoin');
  console.log('3. Attendre que TU résolved le CAPTCHA manuellement');
  console.log('4. Sauvegarder les cookies pour les réutiliser\n');
  
  const fetcher = new LeboncoinFetcher();
  
  try {
    logger.info('🚀 Initialisation du navigateur...');
    await fetcher.init();
    
    logger.info('🌐 Navigation vers Leboncoin homepage...');
    await fetcher.page.goto('https://www.leboncoin.fr', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await fetcher.randomDelay(2000, 3000);
    
    logger.info('🔍 Navigation vers page de recherche...');
    const searchUrl = fetcher.buildSearchUrl('pokemon cartes wizards', { radius: 50 });
    await fetcher.page.goto(searchUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('\n⚠️  **ACTION REQUISE**\n');
    console.log('📌 Si un CAPTCHA apparaît dans le navigateur:');
    console.log('   1. Résous-le manuellement');
    console.log('   2. Attends que la page de résultats se charge');
    console.log('   3. Reviens ici et appuie sur ENTRÉE\n');
    console.log('📌 Si PAS de CAPTCHA:');
    console.log('   → Appuie directement sur ENTRÉE\n');
    
    await ask('Appuie sur ENTRÉE quand c\'est terminé... ');
    
    logger.info('💾 Sauvegarde des cookies...');
    const saved = await fetcher.saveCookiesAfterCaptcha();
    
    if (saved) {
      console.log('\n✅ **SUCCÈS !**');
      console.log('Les cookies ont été sauvegardés dans backend/cookies/');
      console.log('Les prochains scraping utiliseront ces cookies automatiquement.');
      console.log('\n🚀 Tu peux maintenant lancer:');
      console.log('   npm run scrape:test\n');
    } else {
      console.log('\n❌ Échec de la sauvegarde des cookies');
    }
    
  } catch (error) {
    logger.error('Erreur:', error);
  } finally {
    await fetcher.close();
    rl.close();
  }
}

resolveCaptcha().catch(console.error);
