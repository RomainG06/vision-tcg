import { generateToken } from './src/api/auth.js';

// Generate a development token valid for 7 days
const devToken = generateToken({
    userId: 'dev-user',
    role: 'admin',
    email: 'dev@visiontcg.local'
}, '7d');

console.log('\n=== Token de développement généré ===\n');
console.log('Valide pour : 7 jours');
console.log('User ID : dev-user');
console.log('Role : admin\n');
console.log('Token :');
console.log(devToken);
console.log('\n=== Utilisation ===\n');
console.log('Copiez ce token et utilisez-le dans vos requêtes :');
console.log(`Authorization: Bearer ${devToken}\n`);
console.log('Exemple curl :');
console.log(`curl -X POST http://localhost:3001/api/scrape/start \\`);
console.log(`  -H "Authorization: Bearer ${devToken}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"profile":"wizards-fr","sources":["vinted"],"maxResults":10}'\n`);
