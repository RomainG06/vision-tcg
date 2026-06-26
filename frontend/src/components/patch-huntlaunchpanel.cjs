const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'HuntLaunchPanel.jsx');

// Lire le fichier avec encodage UTF-8
let content = fs.readFileSync(filePath, 'utf8');

// Remplacement 1: Améliorer getFriendlyScrapeError()
const oldError = `  if (/accès temporairement restreint|acces temporairement restreint|temporarily restricted|IPPOLL_REASONCODE/i.test(text)) {
    return 'Leboncoin a temporairement restreint l'accès après le challenge. Stoppe LBC pour maintenant, attends un moment, puis relance en mode LBC seul très prudent.';
  }
  if (/captcha|datadome|blocked|forbidden|403/i.test(text)) {
    return 'Vinted semble bloquer le scan. Réessaie plus tard, réduis la sensibilité ou résous le challenge si une fenêtre s'ouvre.';
  }`;

const newError = `  if (/Still rate limited after.*post-CAPTCHA cooldown/i.test(text)) {
    return 'Leboncoin impose un cooldown actif même après résolution du CAPTCHA. Attends 5-10 minutes puis relance avec LBC seul en mode Prudent (2 résultats max).';
  }
  if (/accès temporairement restreint|acces temporairement restreint|temporarily restricted|IPPOLL_REASONCODE/i.test(text)) {
    return 'Leboncoin a temporairement restreint l'accès. Attends 10-15 minutes, puis relance en mode LBC seul très prudent (Sensibilité: Prudent, uniquement LBC).';
  }
  if (/\\[LBC\\].*Rate limited.*max retries/i.test(text)) {
    return 'Leboncoin bloque temporairement les requêtes. Le système a déjà tenté 3 fois avec délais progressifs. Attends 15 minutes puis relance.';
  }
  if (/captcha.*not resolved/i.test(text)) {
    return 'CAPTCHA non résolu dans le délai imparti. Relance le scan et résous le CAPTCHA rapidement dans la fenêtre Chrome ouverte.';
  }
  if (/captcha|datadome|blocked|forbidden|403/i.test(text)) {
    return 'Challenge anti-bot détecté. Si Vinted: réduis la sensibilité. Si LBC: une fenêtre Chrome devrait s'ouvrir pour résolution manuelle.';
  }`;

content = content.replace(oldError, newError);

// Remplacement 2: Mettre à jour LbcCaptchaAssistModal()
const oldModal = `          <li>Ne ferme pas Chrome : le scan reprend automatiquement après validation ou à la fin du délai.</li>
        </ol>
        <div style={styles.lbcModalNote}>
          Impossible d'embarquer Chrome directement dans le dashboard web sans composant desktop/noVNC. Cette modal sert donc de copilote pendant que la vraie fenêtre Chrome reste interactive.
        </div>`;

const newModal = `          <li>Ne ferme pas Chrome : le scan reprend automatiquement après validation.</li>
          <li><strong>Cooldown automatique :</strong> Après résolution du CAPTCHA, le système attend 5-7 secondes puis vérifie si LBC impose un délai supplémentaire (jusqu'à 30s si nécessaire).</li>
        </ol>
        <div style={styles.lbcModalNote}>
          🛡️ <strong>Stratégie conservative :</strong> LBC est plus restrictif que Vinted. Le système utilise des délais plus longs (3-6s entre annonces), des retries avec backoff exponentiel (3s → 6s → 12s), et un cooldown post-CAPTCHA pour éviter les blocages permanents.
        </div>`;

content = content.replace(oldModal, newModal);

// Écrire le fichier avec encodage UTF-8
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ HuntLaunchPanel.jsx mis à jour avec succès !');
