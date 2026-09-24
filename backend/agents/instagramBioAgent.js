const axios = require("axios");

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function extractConcepts(text) {
  const normalized = normalizeText(text);

  const concepts = [];

  const conceptKeywords = [
    { key: "doğum günü", words: ["dogum gunu", "birthday", "parti", "party"] },
    { key: "nişan", words: ["nisan", "engagement"] },
    { key: "söz", words: ["soz"] },
    { key: "kına", words: ["kina"] },
    { key: "nikah", words: ["nikah"] },
    { key: "düğün", words: ["dugun", "wedding"] },
    { key: "organizasyon", words: ["organizasyon", "event"] },
    { key: "çocuk dostu", words: ["cocuk", "oyun", "kids"] },
    { key: "yemekli", words: ["yemek", "menu", "menü", "restaurant", "restoran"] },
  ];

  for (const item of conceptKeywords) {
    if (item.words.some((word) => normalized.includes(word))) {
      concepts.push(item.key);
    }
  }

  return [...new Set(concepts)];
}

function extractCapacity(text) {
  const normalized = normalizeText(text);

  const patterns = [
    /(\d+)\s*kisilik/g,
    /(\d+)\s*kisi/g,
    /(\d+)\s*kişilik/g,
    /(\d+)\s*kişi/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(normalized);
    if (match && match[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

async function getInstagramBioForVenue(venue, requirements) {
  try {
    const city = requirements.city || "";
    const district = requirements.district || "";

    const query = `${venue.name} instagram ${district} ${city}`;

    console.log("Instagram bio search:", query);

    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        hl: "tr",
        gl: "tr",
        api_key: process.env.SERPAPI_KEY,
      },
    });

    const results = response.data.organic_results || [];

    const instagramResult = results.find((item) => {
      const link = item.link || "";
      return link.includes("instagram.com");
    });

    if (!instagramResult) {
      return {
        instagram_url: null,
        instagram_bio: null,
        concepts: [],
        capacity: null,
      };
    }

    const bioText = [
      instagramResult.title,
      instagramResult.snippet,
      instagramResult.rich_snippet?.top?.detected_extensions
        ? JSON.stringify(instagramResult.rich_snippet.top.detected_extensions)
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      instagram_url: instagramResult.link || null,
      instagram_bio: bioText || null,
      concepts: extractConcepts(bioText),
      capacity: extractCapacity(bioText),
    };
  } catch (error) {
    console.error(
      "Instagram bio agent error:",
      error.response?.data || error.message
    );

    return {
      instagram_url: null,
      instagram_bio: null,
      concepts: [],
      capacity: null,
    };
  }
}

async function enrichVenuesWithInstagramBio(venues, requirements) {
  const enriched = [];

  for (const venue of venues.slice(0, 5)) {
    const instagramData = await getInstagramBioForVenue(venue, requirements);

    enriched.push({
      ...venue,
      instagram_url: instagramData.instagram_url,
      instagram_bio: instagramData.instagram_bio,
      instagram_concepts: instagramData.concepts,
      instagram_capacity: instagramData.capacity,
    });
  }

  const remaining = venues.slice(5);

  return [...enriched, ...remaining];
}

module.exports = { enrichVenuesWithInstagramBio };