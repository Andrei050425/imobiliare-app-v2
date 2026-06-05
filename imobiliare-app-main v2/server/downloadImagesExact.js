const knex = require("knex")(require("./knexfile").development);
const google = require("googlethis");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const exactQueries = {
  43: "Promenada Mall Bucuresti exterior",
  44: "Baneasa Shopping City Bucuresti exterior",
  45: "Victoria Business Park Bucuresti exterior",
  46: "Bucharest Business Park exterior",
  47: "Mega Mall Bucuresti exterior",
  48: "Veranda Mall Bucuresti exterior",
  49: "Pipera Business Tower exterior",
  50: "Floreasca Park Bucuresti exterior",
  51: "ParkLake Shopping Center Bucuresti exterior",
  52: "Bucuresti Mall Vitan exterior",
  53: "Titan Shopping Center Bucuresti exterior",
  54: "Pallady Business Center Bucuresti exterior",
  55: "Sun Plaza Bucuresti exterior",
  56: "Grand Arena Mall Bucuresti exterior",
  57: "City Offices Bucuresti exterior",
  58: "Timpuri Noi Square Bucuresti exterior",
  59: "Liberty Center Mall Bucuresti exterior",
  60: "Vulcan Value Centre Bucuresti exterior",
  61: "AFI Tech Park Bucuresti exterior",
  62: "The One Cotroceni Park Bucuresti exterior",
  63: "AFI Cotroceni Mall Bucuresti exterior",
  64: "Plaza Romania Bucuresti exterior",
  65: "West Gate Business Park Bucuresti exterior",
  66: "Sema Park Bucuresti exterior"
};

async function searchImage(query) {
  try {
    const results = await google.image(query, { safe: false });
    if (results && results.length > 0) {
      // Find a valid image link that does not look like a logo or tiny thumbnail
      const validUrls = results.filter((r) => r.url && r.url.match(/\.(jpeg|jpg|png|webp)(\?.*)?$/i) && !r.url.includes('logo') && !r.url.includes('icon'));
      // Return the first valid one, else the first result
      return validUrls.length > 0 ? validUrls[0].url : results[0].url;
    }
    return null;
  } catch (err) {
    console.error("GoogleThis Error:", err);
    return null;
  }
}

async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function run() {
  try {
    const properties = await knex("properties").where("id", ">=", 43).orderBy("id", "asc");
    console.log(`Found ${properties.length} properties.`);

    for (const prop of properties) {
      console.log(`Processing property ${prop.id}: ${prop.title}`);
      
      try {
        const query = exactQueries[prop.id];
        if (!query) {
           console.log("No exact query mapped.");
           continue;
        }

        console.log(`Searching for: ${query}`);
        let imageUrl = await searchImage(query);
        
        // If it fails downloading the first image, try the next
        if (imageUrl) {
          console.log(`Found URL: ${imageUrl}`);
          const extMatch = imageUrl.match(/\.(jpeg|jpg|png|webp)/i);
          const ext = extMatch ? extMatch[1] : "jpg";
          const filename = `property-real-${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
          const filepath = path.join(__dirname, "uploads", filename);
          
          let downloaded = false;
          try {
            await downloadImage(imageUrl, filepath);
            downloaded = true;
          } catch(e) {
            console.log(`Failed to download ${imageUrl}, trying again with another result if possible...`);
            // Attempt to get second result
            const results = await google.image(query, { safe: false });
            if (results && results.length > 1) {
              const secondUrl = results[1].url;
              await downloadImage(secondUrl, filepath);
              downloaded = true;
              imageUrl = secondUrl;
            }
          }

          if (downloaded) {
             console.log(`Downloaded to ${filepath}`);
             const relativePath = `uploads/${filename}`;
             
             const existingImage = await knex("images").where({ property_id: prop.id }).first();
             if (existingImage) {
               await knex("images").where({ id: existingImage.id }).update({ path: relativePath });
             } else {
               await knex("images").insert({ property_id: prop.id, path: relativePath });
             }
             console.log(`Updated DB for property ${prop.id}`);
          }
        } else {
          console.log("No image found for this property.");
        }
      } catch (err) {
        console.error(`Error processing property ${prop.id}:`, err.message);
      }
      
      await new Promise((res) => setTimeout(res, 2000));
    }
  } catch (error) {
    console.error("Script error:", error);
  } finally {
    knex.destroy();
  }
}

run();
