const knex = require("knex")(require("./knexfile").development);
const google = require("googlethis");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function searchImage(query) {
  try {
    const results = await google.image(query, { safe: false });
    if (results && results.length > 0) {
      const validUrl = results.find((r) => r.url && r.url.match(/\.(jpeg|jpg|png|webp)/i));
      return validUrl ? validUrl.url : results[0].url;
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
    timeout: 8000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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
        const query = `${prop.title} exterior cladire`;
        console.log(`Searching for: ${query}`);
        const imageUrl = await searchImage(query);
        
        if (imageUrl) {
          console.log(`Found URL: ${imageUrl}`);
          const extMatch = imageUrl.match(/\.(jpeg|jpg|png|webp)/i);
          const ext = extMatch ? extMatch[1] : "jpg";
          const filename = `property-${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
          const filepath = path.join(__dirname, "uploads", filename);
          
          await downloadImage(imageUrl, filepath);
          console.log(`Downloaded to ${filepath}`);
          
          // Update the DB
          const relativePath = `uploads/${filename}`;
          
          const existingImage = await knex("images").where({ property_id: prop.id }).first();
          if (existingImage) {
            await knex("images").where({ id: existingImage.id }).update({ path: relativePath });
          } else {
            await knex("images").insert({ property_id: prop.id, path: relativePath });
          }
          console.log(`Updated DB for property ${prop.id}`);
        } else {
          console.log("No image found for this property.");
        }
      } catch (err) {
        console.error(`Error processing property ${prop.id}:`, err.message);
      }
      
      // Delay to avoid rate limiting
      await new Promise((res) => setTimeout(res, 3000));
    }
  } catch (error) {
    console.error("Script error:", error);
  } finally {
    knex.destroy();
  }
}

run();
