const https = require("https");

const SECTOR_COORDS = {
  "Sector 1": [44.4700000, 26.0600000],
  "Sector 2": [44.4500000, 26.1300000],
  "Sector 3": [44.4200000, 26.1600000],
  "Sector 4": [44.3800000, 26.1100000],
  "Sector 5": [44.4000000, 26.0600000],
  "Sector 6": [44.4300000, 26.0100000],
  "DEFAULT": [44.4323000, 26.1063000], // Centrul Bucureștiului (Piața Universității)
};

/**
 * Geocodează o adresă folosind OpenStreetMap Nominatim API.
 * Dacă API-ul eșuează sau nu găsește adresa, folosește coordonatele de centru ale sectorului.
 * @param {string} address - Adresa introdusă (ex: Calea Floreasca 246B)
 * @param {string} sector - Sectorul selectat (ex: Sector 1)
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
async function geocodeAddress(address = "", sector = "") {
  return new Promise((resolve) => {
    // Coordonatele de fallback bazate pe sector
    const fallback = SECTOR_COORDS[sector] || SECTOR_COORDS.DEFAULT;
    const fallbackResult = {
      latitude: fallback[0],
      longitude: fallback[1],
    };

    if (!address || address.trim() === "") {
      return resolve(fallbackResult);
    }

    // Construim query-ul pentru Nominatim
    let query = address.trim();
    if (!query.toLowerCase().includes("bucuresti") && !query.toLowerCase().includes("bucurești")) {
      query += ", București";
    }
    if (!query.toLowerCase().includes("romania") && !query.toLowerCase().includes("românia")) {
      query += ", România";
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;

    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "SANTA-Imobiliare-App/1.0 (contact@santa-imobiliare.ro)",
          "Accept-Language": "ro, en",
        },
        timeout: 4000, // Timeout rapid de 4 secunde pentru a nu bloca salvarea
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            if (res.statusCode === 200) {
              const json = JSON.parse(data);
              if (Array.isArray(json) && json.length > 0 && json[0].lat && json[0].lon) {
                const lat = parseFloat(json[0].lat);
                const lng = parseFloat(json[0].lon);
                console.log(`>>> [Geocoder] Adresă găsită pentru "${address}": lat=${lat}, lng=${lng}`);
                return resolve({
                  latitude: parseFloat(lat.toFixed(7)),
                  longitude: parseFloat(lng.toFixed(7)),
                });
              }
            }
            console.warn(`>>> [Geocoder] Nu s-au găsit coordonate exacte pentru "${address}". Se folosește fallback pentru ${sector || "București"}.`);
            resolve(fallbackResult);
          } catch (e) {
            console.error(">>> [Geocoder] Eroare la parsarea JSON Nominatim:", e.message);
            resolve(fallbackResult);
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error(">>> [Geocoder] Eroare rețea Nominatim:", err.message);
      resolve(fallbackResult);
    });

    req.on("timeout", () => {
      req.destroy();
      console.warn(">>> [Geocoder] Timeout la apelul Nominatim. Se folosește fallback.");
      resolve(fallbackResult);
    });
  });
}

module.exports = { geocodeAddress };
