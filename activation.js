/* =====================================================================
   MedQCM — activation.js  (activation par code d'accès)
   ---------------------------------------------------------------------
   Ce fichier gère TOUT ce qui concerne l'activation :
     • la liste des codes valides (sous forme d'empreintes, pas en clair)
     • la vérification d'un code
     • la mémorisation de l'activation sur l'appareil
     • la désactivation ("Changer de code"), cachée pour le moment

   COMMENT AJOUTER / RETIRER DES CODES ?
     1. Ouvrez le fichier  outils/generer-codes.html  dans votre navigateur.
     2. Générez des codes (ou collez les vôtres) : l'outil calcule les
        "empreintes" correspondantes.
     3. Collez ces empreintes dans VALID_CODE_HASHES ci-dessous.
     4. Donnez les codes (et seulement les codes) à vos clients.
     Ne mettez JAMAIS la liste des codes en clair sur GitHub.

   Les 3 premières empreintes ci-dessous correspondent à 3 codes de TEST
   (ceux que vous m'avez donnés en exemple). Supprimez-les de la liste
   avant de vendre l'accès.

   ⚠️  LIMITE IMPORTANTE
   Tout ce qui tourne dans le navigateur peut être contourné par une
   personne technique. Cette activation empêche l'accès "par simple
   curiosité" ou par simple partage du lien, mais ce n'est PAS une
   protection forte du contenu. Pour une vraie protection (codes à usage
   unique, révocation, contenu privé), il faudra brancher un serveur :
   voir verifyCode() ci-dessous, c'est le seul endroit à remplacer.
   ===================================================================== */
const MedQCMActivation = (function () {
  'use strict';

  /* -------------------------------------------------------------------
     RÉGLAGES
     ------------------------------------------------------------------- */
  const CONFIG = {
    // Clé de sauvegarde de l'activation. Volontairement DIFFÉRENTE de celle
    // de la progression (medqcm_data_v1) : l'une n'efface jamais l'autre.
    STORAGE_KEY: 'medqcm_activation_v1',

    // Sert à calculer les empreintes. Si vous le changez, il faut
    // régénérer TOUTES les empreintes avec l'outil.
    SALT: 'medqcm-access-v1|',

    // Empreintes (SHA-256) des codes valides — pas les codes eux-mêmes.
    VALID_CODE_HASHES: [
      'c8311e34e926426d1e18fda27462e13706f9ce7e63f170b6b43009b511500429', // code de test 1
      'cb1cc537df58b3486f1f45108480bb0c7ce62e0416803c956887f5f28db2df51', // code de test 2
      'aecb32a6e7a8d7eec1d4f7c6d4a9cd5319309ed879004b8f3a52a1a932c9b293'  // code de test 3
    ],

    // true  : si un code est retiré de la liste, les appareils qui l'utilisaient
    //         redeviennent non activés à leur prochaine ouverture.
    // false : une fois activé, un appareil reste activé quoi qu'il arrive.
    REVALIDATE_STORED_CODE: true,

    // Affiche un bouton discret "Changer de code" en bas de l'application.
    // Caché pour l'instant : passez à true pour le rendre visible.
    SHOW_CHANGE_CODE_BUTTON: false,

    // Anti-essais répétés (simple frein) : après MAX_ATTEMPTS erreurs,
    // nouvelle tentative possible après LOCK_SECONDS secondes.
    MAX_ATTEMPTS: 5,
    LOCK_SECONDS: 20
  };

  const CODE_FORMAT = /^MED[A-Z0-9]{8}$/;

  let failedAttempts = 0;
  let lockedUntil = 0;
  let memoryRecord = null; // secours si le navigateur refuse localStorage

  /* -------------------------------------------------------------------
     OUTILS : normalisation du code et empreinte SHA-256
     ------------------------------------------------------------------- */

  // "med-abcd-1234", " MED ABCD 1234 " ou "ABCD1234" → "MEDABCD1234"
  function normalizeCode(raw) {
    let code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length === 8) code = 'MED' + code; // "MED-" oublié
    return code;
  }

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  // SHA-256 en JavaScript pur : fonctionne partout (même hors HTTPS, hors ligne).
  function sha256(message) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    // Texte → octets (les codes sont en ASCII : A-Z, 0-9)
    const bytes = [];
    for (let i = 0; i < message.length; i++) bytes.push(message.charCodeAt(i) & 0xff);

    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLength / 0x100000000);
    const lo = bitLength >>> 0;
    bytes.push((hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff);
    bytes.push((lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff);

    const W = new Array(64);
    for (let off = 0; off < bytes.length; off += 64) {
      for (let i = 0; i < 16; i++) {
        W[i] = ((bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) |
                (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(function (x) { return ('00000000' + x.toString(16)).slice(-8); }).join('');
  }

  // Empreinte d'un code déjà normalisé.
  function hashCode(normalizedCode) {
    return sha256(CONFIG.SALT + normalizedCode);
  }

  /* -------------------------------------------------------------------
     VÉRIFICATION D'UN CODE
     -------------------------------------------------------------------
     ★ C'EST LE SEUL ENDROIT À REMPLACER pour brancher un serveur. ★
     La fonction doit renvoyer une promesse qui donne :
        { ok: true,  codeHash: "identifiant-du-code" }
        { ok: false, reason: 'invalid' | 'empty' | 'locked' | 'error', retryIn: secondes }

     Exemple futur avec un serveur :
        const res = await fetch('https://votre-serveur/api/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: normalizeCode(rawCode) })
        });
        const json = await res.json();
        return json.valid ? { ok: true, codeHash: json.token } : { ok: false, reason: 'invalid' };
     ------------------------------------------------------------------- */
  async function verifyCode(rawCode) {
    const now = Date.now();
    if (lockedUntil > now) {
      return { ok: false, reason: 'locked', retryIn: Math.ceil((lockedUntil - now) / 1000) };
    }

    const code = normalizeCode(rawCode);
    if (!code) return { ok: false, reason: 'empty' };

    const hash = hashCode(code);
    if (CODE_FORMAT.test(code) && CONFIG.VALID_CODE_HASHES.indexOf(hash) !== -1) {
      failedAttempts = 0;
      return { ok: true, codeHash: hash };
    }

    failedAttempts += 1;
    if (failedAttempts >= CONFIG.MAX_ATTEMPTS) {
      failedAttempts = 0;
      lockedUntil = now + CONFIG.LOCK_SECONDS * 1000;
    }
    return { ok: false, reason: 'invalid' };
  }

  /* -------------------------------------------------------------------
     ÉTAT D'ACTIVATION (mémorisé sur l'appareil)
     ------------------------------------------------------------------- */
  function readRecord() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (raw) {
        const rec = JSON.parse(raw);
        if (rec && rec.activated === true) return rec;
        return null;
      }
    } catch (err) { /* stockage indisponible : on regarde le secours mémoire */ }
    return memoryRecord;
  }

  // "isActivated = true" : l'appareil a-t-il déjà été activé ?
  function isActivated() {
    const rec = readRecord();
    if (!rec) return false;
    if (CONFIG.REVALIDATE_STORED_CODE) {
      return typeof rec.codeHash === 'string' && CONFIG.VALID_CODE_HASHES.indexOf(rec.codeHash) !== -1;
    }
    return true;
  }

  // Enregistre l'activation (ne touche JAMAIS à la progression des QCM).
  function activate(codeHash) {
    const rec = { activated: true, codeHash: codeHash, activatedAt: Date.now(), version: 1 };
    memoryRecord = rec;
    try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(rec)); } catch (err) { /* ignoré */ }
  }

  // "Changer de code" : retire l'activation seulement (la progression est conservée).
  function deactivate() {
    memoryRecord = null;
    try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (err) { /* ignoré */ }
  }

  return {
    isActivated: isActivated,
    verifyCode: verifyCode,
    activate: activate,
    deactivate: deactivate,
    normalizeCode: normalizeCode,
    hashCode: hashCode,
    storageKey: CONFIG.STORAGE_KEY,
    showChangeCodeButton: CONFIG.SHOW_CHANGE_CODE_BUTTON
  };
})();
