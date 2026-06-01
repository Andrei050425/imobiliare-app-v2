/**
 * Utilitar pentru obținerea cursului valutar EUR/RON de la Banca Națională a României.
 * Sursa oficială: https://www.bnr.ro/nbrfxrates.xml (cursul zilei).
 * Implementează un cache simplu în memorie (pe zi) și o valoare de rezervă.
 */
const axios = require("axios");

const BNR_URL = "https://www.bnr.ro/nbrfxrates.xml";
const FALLBACK_RATE = 4.976; // valoare de rezervă dacă serviciul BNR e indisponibil

let cache = { date: null, rate: null };

/**
 * Returnează cursul EUR/RON (number, 4 zecimale).
 */
async function getEurRonRate() {
  const today = new Date().toISOString().slice(0, 10);
  if (cache.date === today && cache.rate) {
    return cache.rate;
  }

  try {
    const res = await axios.get(BNR_URL, { timeout: 5000 });
    const xml = res.data;
    // Extragem <Rate currency="EUR">4.9760</Rate> fără parser XML extern
    const match = xml.match(/<Rate currency="EUR"[^>]*>([\d.]+)<\/Rate>/);
    if (match && match[1]) {
      const rate = parseFloat(parseFloat(match[1]).toFixed(4));
      cache = { date: today, rate };
      return rate;
    }
    throw new Error("Cursul EUR nu a fost găsit în răspunsul BNR.");
  } catch (err) {
    console.error("[BNR] Eroare la obținerea cursului:", err.message);
    // Folosim ultima valoare cunoscută sau valoarea de rezervă
    return cache.rate || FALLBACK_RATE;
  }
}

module.exports = { getEurRonRate, FALLBACK_RATE };
