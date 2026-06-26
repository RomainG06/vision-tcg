const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'HuntLaunchPanel.jsx');

// Read file with UTF-8 encoding
let content = fs.readFileSync(filePath, 'utf8');

// Replace 1: Update getFriendlyScrapeError() with new ultra-prudent cases
const oldError1 = `  if (/Still rate limited after.*post-CAPTCHA cooldown/i.test(text)) {
    return 'Leboncoin impose un cooldown actif même après résolution du CAPTCHA. Attends 5-10 minutes puis relance avec LBC seul en mode Prudent (2 résultats max).';
  }`;

const newError1 = `  if (/Rate limit persists after 90s post-CAPTCHA cooldown/i.test(text)) {
    return 'Le Bon Coin bloque très agressivement. Le système a attendu 90 secondes post-CAPTCHA mais LBC continue à bloquer. Attends au minimum 30-60 minutes. Évite LBC pour les prochaines sessions et utilise uniquement Vinted.';
  }
  if (/Still rate limited after.*post-CAPTCHA cooldown/i.test(text)) {
    return 'Leboncoin impose un cooldown sévère même après résolution du CAPTCHA (jusqu\'à 90 secondes). Le système a limité à 1 seule annonce pour cette session. Attends 30 minutes avant de relancer en mode LBC seul très prudent.';
  }`;

content = content.replace(oldError1, newError1);

// Replace 2: Update LbcCaptchaAssistModal with new ultra-prudent strategy
const oldModal = `          <li>Ne ferme pas Chrome : le scan reprend automatiquement après validation.</li>
          <li><strong>Cooldown automatique :</strong> Après résolution du CAPTCHA, le système attend 5-7 secondes puis vérifie si LBC impose un délai supplémentaire (jusqu'à 30s si nécessaire).</li>
        </ol>
        <div style={styles.lbcModalNote}>
          🛡️ <strong>Stratégie conservative :</strong> LBC est plus restrictif que Vinted. Le système utilise des délais plus longs (3-6s entre annonces), des retries avec backoff exponentiel (3s → 6s → 12s), et un cooldown post-CAPTCHA pour éviter les blocages permanents.
        </div>`;

const newModal = `          <li>Ne ferme pas Chrome : le scan reprend automatiquement après validation avec cooldown de 90 secondes.</li>
          <li><strong>Stratégie ultra-prudente :</strong> Après résolution du CAPTCHA, le système attend 90 secondes (LBC impose un cooldown très long), puis fetche UNIQUEMENT 1 seule annonce pour minimiser l'exposition. Tu peux relancer un scan normal 30+ minutes plus tard.</li>
        </ol>
        <div style={styles.lbcModalNote}>
          🛡️ <strong>Stratégie ultra-prudente post-CAPTCHA:</strong> Le Bon Coin est très agressif après validation du CAPTCHA. Le système utilise un cooldown de 90 secondes puis ne fetche qu'1 seule annonce. Si LBC bloque encore, attends 30-60 minutes avant de relancer. Sans CAPTCHA, délais normaux 3-6s. Retries avec backoff exponentiel (3s → 6s → 12s) si blocage détecté.
        </div>`;

content = content.replace(oldModal, newModal);

// Write file back with UTF-8 encoding
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ HuntLaunchPanel.jsx mis à jour avec stratégie ultra-prudente post-CAPTCHA !');
console.log('   - Cooldown augmenté à 90s');
console.log('   - Fetch limité à 1 listing après CAPTCHA');
console.log('   - Messages utilisateur mis à jour');
