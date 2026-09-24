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

function includesAny(text, words) {
  const normalized = normalizeText(text);
  return words.some((word) => normalized.includes(normalizeText(word)));
}

function detectDetails(text) {
  const normalized = normalizeText(text);

  return {
    menu_price_found: includesAny(normalized, [
      "menü",
      "menu",
      "fiyat",
      "price",
      "₺",
      "tl",
      "kahve",
      "latte",
      "americano",
      "cappuccino",
      "espresso",
      "çay",
      "cay",
      "tatlı",
      "tatli",
      "pasta",
      "burger",
      "pizza",
      "makarna",
    ]),

    capacity_found: includesAny(normalized, [
      "kişilik",
      "kisilik",
      "kişi",
      "kisi",
      "kapasite",
      "oturma kapasitesi",
    ]),

    alcohol_info_found: includesAny(normalized, [
      "alkol",
      "alkollü",
      "alkollu",
      "içki",
      "icki",
      "bar",
      "wine",
      "şarap",
      "sarap",
      "bira",
      "kokteyl",
      "cocktail",
    ]),

    outdoor_info_found: includesAny(normalized, [
      "bahçe",
      "bahce",
      "teras",
      "açık alan",
      "acik alan",
      "açık mekan",
      "acik mekan",
      "dış mekan",
      "dis mekan",
    ]),

    live_music_info_found: includesAny(normalized, [
      "canlı müzik",
      "canli muzik",
      "fasıl",
      "fasil",
      "müzikli",
      "muzikli",
      "dj",
    ]),

    public_transport_found: includesAny(normalized, [
      "durak",
      "otobüs",
      "otobus",
      "minibüs",
      "minibus",
      "metro",
      "tramvay",
      "marmaray",
      "toplu taşıma",
      "toplu tasima",
      "yürüme mesafesi",
      "yurume mesafesi",
      "merkez",
    ]),

    parking_found: includesAny(normalized, [
      "otopark",
      "vale",
      "park yeri",
      "araç park",
      "arac park",
      "otoparklı",
      "otoparkli",
    ]),
  };
}

function extractPrices(text) {
  const normalized = normalizeText(text)
    .replace(/\./g, "")
    .replace(/,/g, ".");

  const prices = [];

  const patterns = [
    /(\d{2,5})\s*tl/g,
    /(\d{2,5})\s*₺/g,
    /₺\s*(\d{2,5})/g,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(normalized)) !== null) {
      const value = Number(match[1]);

      if (value >= 20 && value <= 5000) {
        prices.push(value);
      }
    }
  }

  return [...new Set(prices)].sort((a, b) => a - b);
}

function estimateAveragePrice(text, requirements) {
  const normalized = normalizeText(text);
  const prices = extractPrices(text);

  if (prices.length === 0) return null;

  const activity = normalizeText(requirements.activity);

  let activityKeywords = ["menü", "menu", "fiyat"];

  if (activity.includes("kahve")) {
    activityKeywords = ["kahve", "latte", "americano", "cappuccino", "espresso", "çay", "cay"];
  }

  if (activity.includes("tatli")) {
    activityKeywords = ["tatlı", "tatli", "pasta", "cheesecake", "waffle", "magnolia", "sufle"];
  }

  if (activity.includes("yemek")) {
    activityKeywords = ["yemek", "burger", "pizza", "makarna", "tavuk", "et", "kahvaltı", "kahvalti"];
  }

  const activityMatch = activityKeywords.some((word) =>
    normalized.includes(normalizeText(word))
  );

  if (!activityMatch) return null;

  const usefulPrices = prices.filter((price) => {
    if (activity.includes("kahve")) return price >= 30 && price <= 400;
    if (activity.includes("tatli")) return price >= 50 && price <= 600;
    if (activity.includes("yemek")) return price >= 100 && price <= 1500;

    return price >= 50 && price <= 1500;
  });

  if (usefulPrices.length === 0) return null;

  const min = usefulPrices[0];
  const max = usefulPrices[Math.min(usefulPrices.length - 1, 4)];

  if (min === max) return `Yaklaşık ${min} TL`;

  return `Yaklaşık ${min} - ${max} TL`;
}

async function googleSearch(query) {
  const response = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google",
      q: query,
      hl: "tr",
      gl: "tr",
      api_key: process.env.SERPAPI_KEY,
    },
  });

  return response.data.organic_results || [];
}

function buildQueries(venue, requirements) {
  const city = requirements.city || "";
  const district = requirements.district || "";
  const activity = normalizeText(requirements.activity);
  const transportation = normalizeText(requirements.transportation);

  const base = `${venue.name} ${district} ${city}`.trim();

  let queries = [];

  if (activity.includes("kahve")) {
    queries = [
      `${base} cafe`,
      `${base} kahve`,
      `${base} menü`,
      `${base} menu`,
      `${base} kahve fiyat`,
      `${base} latte americano fiyat`,
      `${base} çalışma saatleri`,
      `${base} instagram`,
    ];
  } else if (activity.includes("tatli")) {
    queries = [
      `${base} tatlı`,
      `${base} pastane`,
      `${base} menü`,
      `${base} tatlı fiyat`,
      `${base} pasta waffle cheesecake fiyat`,
      `${base} instagram`,
    ];
  } else if (activity.includes("yemek")) {
    queries = [
      `${base} restoran`,
      `${base} restaurant`,
      `${base} menü`,
      `${base} yemek fiyat`,
      `${base} burger pizza makarna fiyat`,
      `${base} instagram`,
    ];
  } else if (activity.includes("toplanti")) {
    queries = [
      `${base} toplantı salonu`,
      `${base} meeting room`,
      `${base} kapasite`,
      `${base} çalışma alanı`,
      `${base} instagram`,
    ];
  } else if (activity.includes("kutlama")) {
    queries = [
      `${base} kutlama`,
      `${base} doğum günü`,
      `${base} menü fiyat`,
      `${base} kapasite`,
      `${base} instagram`,
    ];
  } else {
    queries = [
      `${base} menü fiyat`,
      `${base} instagram`,
    ];
  }

  if (requirements.venue_type === "outdoor") {
    queries.push(`${base} bahçe teras açık alan`);
  }

  if (requirements.music === true) {
    queries.push(`${base} canlı müzik`);
  }

  if (requirements.music === false) {
    queries.push(`${base} sakin cafe`);
  }

  if (transportation.includes("toplu")) {
    queries.push(`${base} toplu taşıma durak merkez`);
  }

  if (transportation.includes("ozel") || transportation.includes("arac")) {
    queries.push(`${base} otopark vale park yeri`);
  }

  return queries
    .map((q) => q.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function filterBadDetailSources(sources, requirements) {
  const activity = normalizeText(requirements.activity);

  if (!activity.includes("kahve") && !activity.includes("tatli")) {
    return sources;
  }

  return sources.filter((source) => {
    const text = normalizeText(`
      ${source.title || ""}
      ${source.snippet || ""}
      ${source.link || ""}
    `);

    const badSignals = [
      "wedding",
      "dugun",
      "düğün",
      "organizasyon",
      "nisan",
      "nişan",
      "kina",
      "kına",
      "nikah",
      "davet salonu",
      "kır bahçesi",
      "kir bahcesi",
    ];

    const goodSignals = [
      "cafe",
      "kafe",
      "kahve",
      "coffee",
      "latte",
      "americano",
      "tatli",
      "tatlı",
      "pasta",
      "pastane",
      "waffle",
      "cheesecake",
    ];

    if (includesAny(text, badSignals) && !includesAny(text, goodSignals)) {
      return false;
    }

    return true;
  });
}

async function researchVenueDetails(venue, requirements) {
  try {
    const queries = buildQueries(venue, requirements);

    let sources = [];

    for (const query of queries) {
      console.log("Detail research query:", query);

      const results = await googleSearch(query);

      for (const result of results.slice(0, 3)) {
        sources.push({
          title: result.title || "",
          link: result.link || "",
          snippet: result.snippet || "",
        });
      }
    }

    sources = filterBadDetailSources(sources, requirements);

    const combinedText = sources
      .map((s) => `${s.title} ${s.snippet} ${s.link}`)
      .join(" ");

    const detected = detectDetails(combinedText);
    const averagePrice = estimateAveragePrice(combinedText, requirements);

    let transportationStatus = "Ulaşım/otopark bilgisi webde net bulunamadı.";

    if (normalizeText(requirements.transportation).includes("toplu")) {
      transportationStatus = detected.public_transport_found
        ? "Toplu taşıma / durak / merkez yakınlığıyla ilgili bilgi bulunmuş olabilir."
        : "Toplu taşıma veya durak yakınlığı bilgisi webde net bulunamadı.";
    }

    if (
      normalizeText(requirements.transportation).includes("ozel") ||
      normalizeText(requirements.transportation).includes("arac")
    ) {
      transportationStatus = detected.parking_found
        ? "Otopark / vale / araç park bilgisi bulunmuş olabilir."
        : "Otopark veya araç park bilgisi webde net bulunamadı.";
    }

    return {
      ...venue,

      detail_research_text: combinedText.slice(0, 900),

      menu_price_status: detected.menu_price_found
        ? "Menü veya fiyat bilgisi web sonuçlarında bulunmuş olabilir. Kaynak kontrol edilmeli."
        : "Menü/fiyat bilgisi webde bulunamadı. Fiyat uydurulmadı, mekanla iletişime geçilmeli.",

      average_price_estimate: averagePrice,

      capacity_status: detected.capacity_found
        ? "Kapasiteyle ilgili bilgi web sonuçlarında bulunmuş olabilir."
        : "Kapasite bilgisi webde açık şekilde bulunamadı.",

      alcohol_status: detected.alcohol_info_found
        ? "İçki/alkol bilgisi web sonuçlarında geçiyor olabilir. Kaynak kontrol edilmeli."
        : "İçkili mekan olduğuna dair açık bilgi bulunamadı.",

      outdoor_status: detected.outdoor_info_found
        ? "Açık alan / bahçe / teras bilgisi bulunmuş olabilir."
        : "Açık alan bilgisi webde net bulunamadı.",

      live_music_status: detected.live_music_info_found
        ? "Canlı müzik / fasıl / DJ bilgisi bulunmuş olabilir."
        : "Canlı müzik bilgisi webde net bulunamadı.",

      transportation_status: transportationStatus,

      detail_sources: sources.slice(0, 5),
    };
  } catch (error) {
    console.error(
      "Detail research agent error:",
      error.response?.data || error.message
    );

    return {
      ...venue,
      menu_price_status:
        "Menü/fiyat bilgisi aranırken hata oluştu. Fiyat uydurulmadı.",
      average_price_estimate: null,
      capacity_status: "Kapasite bilgisi aranırken hata oluştu.",
      alcohol_status: "İçki/alkol bilgisi aranırken hata oluştu.",
      outdoor_status: "Açık alan bilgisi aranırken hata oluştu.",
      live_music_status: "Canlı müzik bilgisi aranırken hata oluştu.",
      transportation_status: "Ulaşım bilgisi aranırken hata oluştu.",
      detail_sources: [],
    };
  }
}

async function enrichVenuesWithDetails(venues, requirements) {
  const enriched = [];

  for (const venue of venues.slice(0, 5)) {
    const detailedVenue = await researchVenueDetails(venue, requirements);
    enriched.push(detailedVenue);
  }

  return [...enriched, ...venues.slice(5)];
}

module.exports = { enrichVenuesWithDetails };