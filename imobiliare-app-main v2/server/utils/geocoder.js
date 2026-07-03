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

function fetchPhoton(query) {
  return new Promise((resolve) => {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "SANTA-Imobiliare-App/2.0",
          "Accept-Language": "ro, en",
        },
        timeout: 4000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            if (res.statusCode === 200) {
              const json = JSON.parse(data);
              if (
                json &&
                json.features &&
                json.features.length > 0 &&
                json.features[0].geometry &&
                json.features[0].geometry.coordinates
              ) {
                const [lng, lat] = json.features[0].geometry.coordinates;
                return resolve({
                  latitude: parseFloat(lat.toFixed(7)),
                  longitude: parseFloat(lng.toFixed(7)),
                  source: "Photon OSM",
                  name: json.features[0].properties?.name || json.features[0].properties?.street || query,
                });
              }
            }
            resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function fetchNominatim(query) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "SANTA-Imobiliare-App/2.0 (contact@santa-imobiliare.ro)",
          "Accept-Language": "ro, en",
        },
        timeout: 4000,
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
                return resolve({
                  latitude: parseFloat(lat.toFixed(7)),
                  longitude: parseFloat(lng.toFixed(7)),
                  source: "Nominatim OSM",
                  name: query,
                });
              }
            }
            resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocodează o adresă folosind Photon + OpenStreetMap Nominatim API.
 * Asigură găsirea coordonatelor în zona generală a adresei / străzii.
 */
async function geocodeAddress(address = "", sector = "") {
  const fallback = SECTOR_COORDS[sector] || SECTOR_COORDS.DEFAULT;
  const fallbackResult = {
    latitude: fallback[0],
    longitude: fallback[1],
  };

  if (!address || address.trim() === "") {
    return fallbackResult;
  }

  const raw = address.trim();
  
  // Clean up address to remove existing city/country or sector strings for cleaner query building
  let clean = raw
    .replace(/,\s*Bucure[sș]ti/gi, "")
    .replace(/,\s*Rom[aâ]nia/gi, "")
    .replace(/Sector\s*\d/gi, "")
    .replace(/nr\.\s*/gi, "")
    .replace(/nr\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^,|,$/g, "")
    .trim();

  // 1. Încercăm Photon (foarte rapid, precis, rezistent la greșeli)
  const photonQueries = [
    `${clean}, București`,
    `${clean.replace(/\b\d+[a-zA-Z]?(-?\d+)?\b/g, "").trim()}, București`
  ];

  for (const pq of photonQueries) {
    if (!pq || pq === ", București" || pq.length < 4) continue;
    const res = await fetchPhoton(pq);
    if (res) {
      console.log(`>>> [Geocoder] Adresă găsită pentru "${address}" (${res.source} - ${res.name}): lat=${res.latitude}, lng=${res.longitude}`);
      return { latitude: res.latitude, longitude: res.longitude };
    }
  }

  // 2. Dacă Photon eșuează, încercăm Nominatim cu fallback în lanț
  let candidates = [
    `${raw}, București, România`,
    `${clean}, București, România`,
    `${clean.replace(/\b(\d+)[a-zA-Z]\b/g, "$1").replace(/\b(\d+)-\d+\b/g, "$1")}, București, România`,
    `${clean.replace(/\b\d+[a-zA-Z]?(-?\d+)?\b/g, "").replace(/\s+/g, " ").trim().replace(/^,|,$/g, "").trim()}, București, România`
  ];

  let expanded = candidates.map(c => c
    .replace(/\bBd\b\.?/gi, "Bulevardul")
    .replace(/\bSos\b\.?/gi, "Șoseaua")
    .replace(/\bStr\b\.?/gi, "Strada")
    .replace(/\bSpl\b\.?/gi, "Splaiul")
    .replace(/\bCal\b\.?/gi, "Calea")
  );
  candidates = [...new Set([...candidates, ...expanded])];

  for (let i = 0; i < candidates.length; i++) {
    const q = candidates[i];
    if (!q || q === ", București, România" || q.length < 5) continue;

    if (i > 0) await sleep(300);

    const res = await fetchNominatim(q);
    if (res) {
      console.log(`>>> [Geocoder] Adresă găsită pentru "${address}" (${res.source} - candidat: "${q}"): lat=${res.latitude}, lng=${res.longitude}`);
      return { latitude: res.latitude, longitude: res.longitude };
    }
  }

  console.warn(`>>> [Geocoder] Nu s-au găsit coordonate pentru "${address}". Se folosește fallback pentru ${sector || "București"}.`);
  return fallbackResult;
}

module.exports = { geocodeAddress };

