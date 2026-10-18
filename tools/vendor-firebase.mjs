/* Copies the Firebase browser files from node_modules into web/vendor/firebase/.
 *
 * Why: the app must open with no internet and inside the .exe and the Android app, so it can't load
 * Firebase from Google's website. Firebase's files import each other from https://www.gstatic.com/...,
 * so this script points those imports at the local copies instead.
 *
 * Run after installing or updating Firebase:  npm run vendor:firebase
 */
import fs from 'node:fs';

const FILES = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'];
const from = new URL('../node_modules/firebase/', import.meta.url);
const to = new URL('../web/vendor/firebase/', import.meta.url);
const { version } = JSON.parse(fs.readFileSync(new URL('package.json', from), 'utf8'));

fs.mkdirSync(to, { recursive: true });
for (const name of FILES) {
  let src = fs.readFileSync(new URL(name, from), 'utf8');
  src = src.replaceAll(`https://www.gstatic.com/firebasejs/${version}/`, './'); // load each other from this folder
  src = src.replace(/\/\/# sourceMappingURL=.*$/m, ''); // the .map files aren't copied
  if (src.includes('www.gstatic.com/firebasejs')) throw new Error(`${name} still loads from gstatic.com`);
  fs.writeFileSync(new URL(name, to), `/* Firebase ${version}, copied by tools/vendor-firebase.mjs */\n` + src);
  console.log(`web/vendor/firebase/${name}  (${Math.round(src.length / 1024)} KB)`);
}
