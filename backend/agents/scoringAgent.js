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

function statusPositive(status) {
  const text = normalizeText(status);

  return (
    text.includes("bulunmus olabilir") ||
    text.includes("bulundu") ||
    text.includes("geciyor olabilir")
  );
}

function statusNegative(status) {
  const text = normalizeText(status);

  return (
    text.includes("bulunamadi") ||
    text.includes("net bulunamadi") ||
    text.includes("hata olustu") ||
    text.includes("acik sekilde bulunamadi")
  );
}

function getWrongCategoryPenalty(text, requirements) {
  const activity = normalizeText(requirements.activity);
  let penalty = 0;

  const weddingWords = [
    "wedding",
    "dugun",
    "dugun salonu",
    "organizasyon",
    "nisan",
    "soz",
    "kina",
    "nikah",
    "davet salonu",
    "event hall",
    "salon"
  ];

  if (activity.includes("kahve")) {
    if (includesAny(text, weddingWords)) penalty -= 45;

    if (!includesAny(text, ["cafe", "kafe", "kahve", "coffee", "espresso", "latte", "americano"])) {
      penalty -= 30;
    }
  }

  if (activity.includes("tatli")) {
    if (includesAny(text, weddingWords)) penalty -= 30;

    if (!includesAny(text, ["cafe", "kafe", "tatli", "pasta", "waffle", "cheesecake", "sufle"])) {
      penalty -= 20;
    }
  }

  return penalty;
}

function getActivityScore(text, requirements) {
  const activity = normalizeText(requirements.activity);
  let score = 0;

  if (activity.includes("kahve")) {
    if (includesAny(text, ["kahve", "coffee", "latte", "americano", "cappuccino", "espresso"])) {
      score += 35;
    }

    if (includesAny(text, ["cafe", "kafe"])) {
      score += 30;
    }

    if (includesAny(text, ["sakin", "alkolsuz", "aile ortami", "sessiz"])) {
      score += 12;
    }
  }

  if (activity.includes("tatli")) {
    if (includesAny(text, ["tatli", "pasta", "waffle", "cheesecake", "magnolia", "sufle"])) {
      score += 35;
    }

    if (includesAny(text, ["cafe", "kafe"])) {
      score += 15;
    }
  }

  if (activity.includes("yemek")) {
    if (includesAny(text, ["restaurant", "restoran", "yemek", "menu", "burger", "pizza", "makarna", "kahvalti"])) {
      score += 35;
    }
  }

  if (activity.includes("kutlama")) {
    if (includesAny(text, ["kutlama", "dogum gunu", "parti", "organizasyon"])) {
      score += 25;
    }
  }

  if (activity.includes("toplanti")) {
    if (includesAny(text, ["toplanti", "meeting", "calisma alani", "coworking"])) {
      score += 30;
    }
  }

  return score;
}

function getPreferenceScore(text, requirements) {
  let score = 0;

  const preferences = Array.isArray(requirements.preferences)
    ? requirements.preferences.map(normalizeText).join(" ")
    : normalizeText(requirements.preferences);

  if (preferences.includes("alkolsuz")) {
    if (includesAny(text, ["alkolsuz", "cafe", "kafe", "kahve"])) score += 10;
    if (includesAny(text, ["alkol", "icki", "bar", "pub", "meyhane"])) score -= 25;
  }

  if (preferences.includes("sakin")) {
    if (includesAny(text, ["sakin", "sessiz", "aile ortami"])) score += 12;
    if (includesAny(text, ["canli muzik", "dj", "parti", "dugun", "organizasyon"])) score -= 15;
  }

  if (requirements.catering === true) {
    if (includesAny(text, ["yemek", "menu", "restaurant", "restoran", "servis"])) {
      score += 10;
    }
  }

  if (requirements.venue_type === "outdoor") {
    if (includesAny(text, ["acik", "bahce", "teras", "dis mekan"])) {
      score += 12;
    }
  }

  if (requirements.venue_type === "indoor") {
    if (includesAny(text, ["kapali", "ic mekan", "iceride", "salon"])) {
      score += 8;
    }
  }

  if (requirements.music === false) {
    if (includesAny(text, ["sakin", "sessiz", "aile ortami"])) score += 8;
    if (includesAny(text, ["canli muzik", "dj", "fasil"])) score -= 12;
  }

  if (requirements.music === true) {
    if (includesAny(text, ["canli muzik", "dj", "fasil", "muzikli"])) score += 10;
  }

  return score;
}

function getTransportationScore(venue, requirements) {
  const transportation = normalizeText(requirements.transportation);

  if (!transportation || transportation.includes("fark")) return 0;

  let score = 0;

  const text = normalizeText(`
    ${venue.transportation_status || ""}
    ${venue.detail_research_text || ""}
    ${venue.description || ""}
    ${venue.address || ""}
  `);

  if (transportation.includes("toplu")) {
    if (
      includesAny(text, [
        "toplu tasima",
        "durak",
        "otobus",
        "minibus",
        "metro",
        "tramvay",
        "yurume mesafesi",
        "merkez",
      ])
    ) {
      score += 15;
    }

    if (statusNegative(venue.transportation_status)) score -= 6;
  }

  if (
    transportation.includes("ozel") ||
    transportation.includes("arac")
  ) {
    if (
      includesAny(text, [
        "otopark",
        "vale",
        "park yeri",
        "arac park",
        "otoparkli",
      ])
    ) {
      score += 15;
    }

    if (statusNegative(venue.transportation_status)) score -= 6;
  }

  return score;
}

function getCapacityScore(venue, requirements) {
  if (!requirements.guest_count) return 0;

  const needed = Number(requirements.guest_count);
  const capacity = venue.instagram_capacity ? Number(venue.instagram_capacity) : null;

  if (!capacity) return -3;

  if (capacity >= needed) return 12;
  return -20;
}

function getPriceScore(venue, requirements) {
  let score = 0;

  if (venue.average_price_estimate) score += 10;
  if (statusPositive(venue.menu_price_status)) score += 6;
  if (statusNegative(venue.menu_price_status)) score -= 4;

  if (requirements.budget && venue.average_price_estimate) {
    const numbers = String(venue.average_price_estimate).match(/\d+/g);

    if (numbers && numbers.length > 0) {
      const maxPrice = Math.max(...numbers.map(Number));
      const guestCount = Number(requirements.guest_count || 1);
      const estimatedTotal = maxPrice * guestCount;

      if (estimatedTotal <= Number(requirements.budget)) {
        score += 10;
      } else {
        score -= 15;
      }
    }
  }

  return score;
}

function getDetailResearchScore(venue, requirements) {
  let score = 0;

  if (statusPositive(venue.capacity_status)) score += 4;
  if (statusNegative(venue.capacity_status)) score -= 3;

  if (requirements.venue_type === "outdoor") {
    if (statusPositive(venue.outdoor_status)) score += 10;
    if (statusNegative(venue.outdoor_status)) score -= 6;
  }

  if (requirements.music === true) {
    if (statusPositive(venue.live_music_status)) score += 8;
    if (statusNegative(venue.live_music_status)) score -= 3;
  }

  if (requirements.music === false) {
    if (statusPositive(venue.live_music_status)) score -= 10;
  }

  if (statusNegative(venue.alcohol_status)) score -= 2;
  if (statusNegative(venue.transportation_status)) score -= 2;

  return score;
}

function getAlcoholScore(venue, requirements) {
  const preferences = Array.isArray(requirements.preferences)
    ? requirements.preferences.map(normalizeText).join(" ")
    : normalizeText(requirements.preferences);

  let score = 0;
  const alcoholPositive = statusPositive(venue.alcohol_status);

  if (preferences.includes("alkolsuz") || preferences.includes("ickisiz")) {
    if (alcoholPositive) score -= 20;
    else score += 5;
  }

  if (preferences.includes("alkollu") || preferences.includes("ickili")) {
    if (alcoholPositive) score += 10;
  }

  return score;
}

function getCompletenessPenalty(venue) {
  let missing = 0;

  if (statusNegative(venue.menu_price_status)) missing++;
  if (statusNegative(venue.capacity_status)) missing++;
  if (statusNegative(venue.alcohol_status)) missing++;
  if (statusNegative(venue.outdoor_status)) missing++;
  if (statusNegative(venue.live_music_status)) missing++;
  if (statusNegative(venue.transportation_status)) missing++;

  return missing * -4;
}

function getMatchReasons(venue, requirements, text) {
  const reasons = [];

  if (venue.location_match) reasons.push("Konum eşleşiyor");
  if (venue.rating) reasons.push(`Rating ${venue.rating}`);
  if (venue.review_count) reasons.push(`${venue.review_count} yorum`);

  if (venue.instagram_url) reasons.push("Instagram bilgisi incelendi");

  if (Array.isArray(venue.instagram_concepts) && venue.instagram_concepts.length > 0) {
    reasons.push(`Instagram konseptleri: ${venue.instagram_concepts.join(", ")}`);
  }

  if (normalizeText(requirements.activity).includes("kahve")) {
    if (includesAny(text, ["cafe", "kafe", "kahve", "coffee", "latte", "americano"])) {
      reasons.push("Kahve/cafe isteğine uygun sinyal bulundu");
    }

    if (includesAny(text, ["wedding", "dugun", "organizasyon", "nisan", "kina", "nikah", "davet salonu"])) {
      reasons.push("Uyarı: Düğün/organizasyon mekanı sinyali bulunduğu için puanı düşürüldü");
    }
  }

  if (statusPositive(venue.menu_price_status)) reasons.push("Menü/fiyat bilgisi için kaynak bulundu");
  if (venue.average_price_estimate) reasons.push(`Yaklaşık fiyat aralığı: ${venue.average_price_estimate}`);
  if (statusPositive(venue.capacity_status)) reasons.push("Kapasite bilgisi için kaynak bulundu");
  if (statusPositive(venue.outdoor_status)) reasons.push("Açık alan bilgisi bulundu");
  if (statusPositive(venue.live_music_status)) reasons.push("Canlı müzik bilgisi bulundu");
  if (statusPositive(venue.alcohol_status)) reasons.push("İçki/alkol bilgisi kaynaklarda geçiyor");
  if (statusPositive(venue.transportation_status)) reasons.push("Ulaşım/otopark bilgisi için kaynak bulundu");

  if (reasons.length === 0) {
    reasons.push("Temel mekan bilgileri üzerinden değerlendirildi");
  }

  return reasons;
}

function scoreVenues(venues, requirements) {
  return venues
    .map((venue) => {
      let score = 20;

      const instagramConcepts = Array.isArray(venue.instagram_concepts)
        ? venue.instagram_concepts.join(" ")
        : "";

      const detailSourceText = Array.isArray(venue.detail_sources)
        ? venue.detail_sources.map((s) => `${s.title} ${s.snippet}`).join(" ")
        : "";

      const text = normalizeText(`
        ${venue.name || ""}
        ${venue.title || ""}
        ${venue.address || ""}
        ${venue.description || ""}
        ${venue.instagram_bio || ""}
        ${instagramConcepts}
        ${venue.detail_research_text || ""}
        ${detailSourceText}
        ${venue.menu_price_status || ""}
        ${venue.average_price_estimate || ""}
        ${venue.transportation_status || ""}
      `);

      if (requirements.district && text.includes(normalizeText(requirements.district))) {
        score += 16;
      }

      if (requirements.city && text.includes(normalizeText(requirements.city))) {
        score += 10;
      }

      score += getWrongCategoryPenalty(text, requirements);
      score += getActivityScore(text, requirements);
      score += getPreferenceScore(text, requirements);
      score += getTransportationScore(venue, requirements);
      score += getCapacityScore(venue, requirements);
      score += getPriceScore(venue, requirements);
      score += getDetailResearchScore(venue, requirements);
      score += getAlcoholScore(venue, requirements);
      score += getCompletenessPenalty(venue);

      if (venue.rating) {
        score += Number(venue.rating) * 3;
      }

      if (venue.review_count && Number(venue.review_count) > 50) {
        score += 5;
      }

      if (venue.website) score += 3;
      if (venue.phone) score += 3;
      if (venue.instagram_url) score += 4;

      return {
        ...venue,
        suitability_score: Math.max(0, Math.min(Math.round(score), 100)),
        match_reasons: getMatchReasons(venue, requirements, text),
      };
    })
    .sort((a, b) => b.suitability_score - a.suitability_score);
}

module.exports = { scoreVenues };