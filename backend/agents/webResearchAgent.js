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

function hasLocationMatch(venue, requirements) {
  const text = normalizeText(
    `${venue.title || ""} ${venue.address || ""} ${venue.description || ""} ${venue.name || ""}`
  );

  const city = normalizeText(requirements.city);
  const district = normalizeText(requirements.district);

  if (district && text.includes(district)) return true;
  if (city && text.includes(city)) return true;

  return false;
}

function hasPriceOrMenuInfo(venue) {
  const text = normalizeText(
    `${venue.name || ""} ${venue.address || ""} ${venue.description || ""} ${venue.website || ""}`
  );

  return (
    text.includes("menu") ||
    text.includes("menü") ||
    text.includes("fiyat") ||
    text.includes("price") ||
    text.includes("tl") ||
    text.includes("₺")
  );
}

function convertPlaceToVenue(place, requirements) {
  const venue = {
    name: place.title || "Mekan adı bulunamadı",
    address: place.address || "Adres bilgisi bulunamadı",
    rating: place.rating || null,
    review_count: place.reviews || null,
    phone: place.phone || null,
    website: place.website || place.links?.website || null,
    directions: place.directions || place.links?.directions || null,
    description:
      place.description ||
      place.type ||
      (Array.isArray(place.categories) ? place.categories.join(", ") : "") ||
      "",
    source: "SerpAPI Google Local",
  };

  return {
    ...venue,
    location_match: hasLocationMatch(venue, requirements),
    price_info_status: hasPriceOrMenuInfo(venue)
      ? "Menü/fiyat bilgisi bulunmuş olabilir."
      : "Fiyat bilgisi bulunamadı.",
  };
}

async function serpLocalSearch(query) {
  const response = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_local",
      q: query,
      hl: "tr",
      gl: "tr",
      api_key: process.env.SERPAPI_KEY,
    },
  });

  return response.data.local_results || [];
}

function getActivityQueries(baseLocation, requirements) {
  const activity = normalizeText(requirements.activity);
  const transportation = normalizeText(requirements.transportation);
  const venueType = requirements.venue_type;
  const prefs = normalizeText(requirements.preferences);

  let queries = [];

  // KAHVE
  if (activity.includes("kahve")) {
    queries = [
      `${baseLocation} cafe`,
      `${baseLocation} kahve`,
      `${baseLocation} coffee shop`,
      `${baseLocation} kafe`,
      `${baseLocation} sakin cafe`,
      `${baseLocation} kahveci`,
    ];

    if (venueType === "outdoor") {
      queries.push(`${baseLocation} bahçeli cafe`);
      queries.push(`${baseLocation} teras cafe`);
    }

    if (transportation.includes("toplu")) {
      queries.push(`${baseLocation} merkez cafe`);
      queries.push(`${baseLocation} toplu taşıma yakın cafe`);
    }

    if (transportation.includes("ozel") || transportation.includes("arac")) {
      queries.push(`${baseLocation} otoparklı cafe`);
    }

    if (prefs.includes("alkolsuz")) {
      queries.push(`${baseLocation} aile cafe`);
    }

    return queries;
  }

  // YEMEK
  if (activity.includes("yemek")) {
    queries = [
      `${baseLocation} restaurant`,
      `${baseLocation} restoran`,
      `${baseLocation} yemek`,
      `${baseLocation} lokanta`,
    ];

    return queries;
  }

  // TATLI
  if (activity.includes("tatli")) {
    queries = [
      `${baseLocation} tatlıcı`,
      `${baseLocation} pastane`,
      `${baseLocation} waffle cafe`,
      `${baseLocation} dessert cafe`,
    ];

    return queries;
  }

  // TOPLANTI
  if (activity.includes("toplanti")) {
    queries = [
      `${baseLocation} toplantı salonu`,
      `${baseLocation} meeting room`,
      `${baseLocation} coworking`,
    ];

    return queries;
  }

  // KUTLAMA
  if (activity.includes("kutlama")) {
    queries = [
      `${baseLocation} doğum günü mekanı`,
      `${baseLocation} kutlama cafe`,
      `${baseLocation} parti mekanı`,
    ];

    return queries;
  }

  return [
    `${baseLocation} cafe`,
    `${baseLocation} restaurant`,
  ];
}

async function searchVenues(requirements) {
  const city = requirements.city || "";
  const district = requirements.district || "";
  const baseLocation = `${district} ${city}`.trim();

  const queries = getActivityQueries(baseLocation, requirements);

  let allResults = [];

  for (const query of queries) {
    console.log("SerpAPI query:", query);

    try {
      const results = await serpLocalSearch(query);
      allResults = [...allResults, ...results];
    } catch (error) {
      console.error("SerpAPI error:", error.response?.data || error.message);
    }
  }

  const seen = new Set();
  const uniqueResults = [];

  for (const place of allResults) {
    const key = place.place_id || place.title || place.address;

    if (!key || seen.has(key)) continue;

    seen.add(key);
    uniqueResults.push(place);
  }

  let venues = uniqueResults.map((place) =>
    convertPlaceToVenue(place, requirements)
  );

  const locationMatched = venues.filter((venue) => venue.location_match);

  if (locationMatched.length >= 3) {
    venues = locationMatched;
  }

  return venues.slice(0, 10);
}

module.exports = { searchVenues };