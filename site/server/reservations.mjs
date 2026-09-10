/**
 * GIOIA — Serveur de développement + API de réservation
 * -----------------------------------------------------
 * Zéro dépendance. Sert les fichiers statiques du site et expose une petite
 * API de réservation qui écrit dans `server/reservations.json`.
 *
 *   node server/reservations.mjs            → http://localhost:4173
 *   node server/reservations.mjs --port 8080
 *
 * Pour brancher le formulaire sur cette API, ajoutez avant
 * `assets/js/reservation.js` dans `reservation.html` :
 *
 *   <script>window.GIOIA_BOOKING_ENDPOINT = '/api/reservations';</script>
 *
 * En production, remplacez le stockage fichier par votre base de données ou
 * par l'API de votre logiciel de réservation (TheFork, Zenchef, SevenRooms…),
 * et ajoutez l'envoi de l'e-mail de confirmation.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STORE = join(__dirname, 'reservations.json');

const portFlag = process.argv.indexOf('--port');
const PORT = Number(portFlag > -1 ? process.argv[portFlag + 1] : process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

/* ----------------------------- Jours d'ouverture -------------------------- */
/* Service continu de 12h à 22h30, sept jours sur sept ; dernière table à 22h.
   Doit rester aligné sur assets/js/reservation.js. */
const BOOKABLE = [['12:00', '22:00']];
const CLOSED_DAYS = [];   /* 0 = dimanche … 6 = samedi */

function servicesForDay(day) {
  return CLOSED_DAYS.includes(day) ? [] : BOOKABLE;
}

const MAX_PARTY = 8;
const SEATS_PER_SLOT = 14;

async function readStore() {
  if (!existsSync(STORE)) { return []; }
  try {
    return JSON.parse(await readFile(STORE, 'utf8'));
  } catch {
    return [];
  }
}

async function writeStore(list) {
  await mkdir(dirname(STORE), { recursive: true });
  await writeFile(STORE, JSON.stringify(list, null, 2), 'utf8');
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store'
  });
  res.end(payload);
}

function minutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

function isOpen(dateISO, time) {
  const [y, mo, d] = String(dateISO).split('-').map(Number);
  const day = new Date(y, mo - 1, d).getDay();
  const ranges = servicesForDay(day);
  const t = minutes(time);
  return ranges.some(([from, to]) => t >= minutes(from) && t <= minutes(to));
}

function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) { out += chars[Math.floor(Math.random() * chars.length)]; }
  return `GIO-${out}`;
}

function validate(body, existing) {
  const errors = [];
  const required = ['date', 'time', 'party', 'firstName', 'lastName', 'email', 'phone'];

  for (const key of required) {
    if (!body[key] && body[key] !== 0) { errors.push(`Champ manquant : ${key}`); }
  }
  if (errors.length) { return errors; }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) { errors.push('Date invalide.'); }
  if (!/^\d{2}:\d{2}$/.test(body.time)) { errors.push('Heure invalide.'); }
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(body.email)) { errors.push('E-mail invalide.'); }
  if (String(body.phone).replace(/\D/g, '').length < 9) { errors.push('Téléphone invalide.'); }

  const party = Number(body.party);
  if (!Number.isInteger(party) || party < 1 || party > MAX_PARTY) {
    errors.push(`Le nombre de couverts doit être compris entre 1 et ${MAX_PARTY}.`);
  }
  if (errors.length) { return errors; }

  if (new Date(`${body.date}T${body.time}:00`) < new Date()) {
    errors.push('Ce créneau est déjà passé.');
  }
  if (!isOpen(body.date, body.time)) {
    errors.push('Le restaurant est fermé à cet horaire.');
  }

  const booked = existing
    .filter((r) => r.date === body.date && r.time === body.time && r.status !== 'annulee')
    .reduce((sum, r) => sum + Number(r.party), 0);

  if (booked + party > SEATS_PER_SLOT) {
    errors.push('Ce créneau est complet, merci d’en choisir un autre.');
  }

  return errors;
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/reservations' && req.method === 'GET') {
    const list = await readStore();
    const date = url.searchParams.get('date');
    return json(res, 200, date ? list.filter((r) => r.date === date) : list);
  }

  if (url.pathname === '/api/reservations' && req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 64 * 1024) { return json(res, 413, { error: 'Requête trop volumineuse.' }); }
    }

    let body;
    try { body = JSON.parse(raw || '{}'); }
    catch { return json(res, 400, { error: 'JSON invalide.' }); }

    const list = await readStore();
    const errors = validate(body, list);
    if (errors.length) { return json(res, 422, { error: errors[0], errors }); }

    const record = {
      reference: makeReference(),
      status: 'confirmee',
      party: Number(body.party),
      date: body.date,
      time: body.time,
      service: body.service ||
        (minutes(body.time) < 15 * 60 ? 'dejeuner'
          : minutes(body.time) < 18 * 60 ? 'apresmidi' : 'diner'),
      area: body.area || 'indifferent',
      occasion: body.occasion || '',
      firstName: String(body.firstName).slice(0, 80),
      lastName: String(body.lastName).slice(0, 80),
      email: String(body.email).slice(0, 160),
      phone: String(body.phone).slice(0, 40),
      notes: String(body.notes || '').slice(0, 800),
      newsletter: Boolean(body.newsletter),
      createdAt: new Date().toISOString()
    };

    list.push(record);
    await writeStore(list);

    // C'est ici que vous brancheriez l'envoi de l'e-mail de confirmation.
    console.log(`→ Réservation ${record.reference} · ${record.date} ${record.time} · ${record.party} couverts`);

    return json(res, 201, record);
  }

  return json(res, 404, { error: 'Route inconnue.' });
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) { pathname += 'index.html'; }

  const filePath = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Interdit');
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1><p>Page introuvable — <a href="/">retour à l’accueil</a>.</p>');
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      await serveStatic(req, res, url);
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) { json(res, 500, { error: 'Erreur serveur.' }); }
  }
}).listen(PORT, () => {
  console.log(`GIOIA — site servi sur http://localhost:${PORT}`);
  console.log(`API réservations : POST http://localhost:${PORT}/api/reservations`);
});
