const axios = require("axios");

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("JSON bulunamadı");
  }
}

function normalizeBoolean(value) {
  if (value === true || value === "true" || value === "yes" || value === "evet") {
    return true;
  }

  if (value === false || value === "false" || value === "no" || value === "hayır") {
    return false;
  }

  return null;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value) {
    return [String(value)];
  }

  return [];
}

async function parseRequirements(userRequest) {
  const prompt = `
Sen bir JSON dönüştürme agentısın.

Görevin:
Kullanıcının organizasyon / mekan / cafe isteğini analiz edip SADECE JSON döndürmek.

Kesin kurallar:
- Açıklama yazma.
- Markdown yazma.
- Kod bloğu yazma.
- Sadece geçerli JSON objesi döndür.
- Bilinmeyen alanlara null yaz.
- preferences alanı array olmalı.

JSON şeması:
{
  "event_type": "string veya null",
  "activity": "kahve içmek | yemek yemek | tatlı yemek | kutlama | toplantı | fark etmez | null",
  "city": "string veya null",
  "district": "string veya null",
  "guest_count": number veya null,
  "venue_type": "indoor | outdoor | both | null",
  "catering": true veya false veya null,
  "music": true veya false veya null,
  "transportation": "toplu taşıma | özel araç | fark etmez | null",
  "budget": number veya null,
  "preferences": ["string"]
}

Alan açıklamaları:
- event_type: doğum günü, nişan, mezuniyet, toplantı, cafe bulma gibi etkinlik türü
- activity: kullanıcının yapmak istediği aktivite. Örnek: kahve içmek, yemek yemek, tatlı yemek, kutlama, toplantı
- city: şehir
- district: ilçe
- guest_count: kişi sayısı
- venue_type: kapalıysa indoor, açıksa outdoor, fark etmezse both
- catering: yemek isteniyorsa true, istenmiyorsa false
- music: canlı müzik isteniyorsa true, istenmiyorsa false
- transportation: toplu taşıma, özel araç veya fark etmez
- budget: maksimum bütçe, sadece sayı
- preferences: aile ortamı, çocuk dostu, alkolsüz mekan, sessiz ortam, ulaşım kolaylığı gibi ek istekler

Kullanıcı isteği:
${userRequest}
`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON extraction engine. Return only valid JSON. No explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      response_format: {
        type: "json_object",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = response.data.choices[0].message.content;

  try {
    const parsed = extractJson(text);

    return {
      event_type: parsed.event_type ?? null,
      activity: parsed.activity ?? null,
      city: parsed.city ?? null,
      district: parsed.district ?? null,
      guest_count:
        parsed.guest_count !== undefined && parsed.guest_count !== null
          ? Number(parsed.guest_count)
          : null,
      venue_type: parsed.venue_type ?? null,
      catering: normalizeBoolean(parsed.catering),
      music: normalizeBoolean(parsed.music),
      transportation: parsed.transportation ?? null,
      budget:
        parsed.budget !== undefined && parsed.budget !== null
          ? Number(parsed.budget)
          : null,
      preferences: normalizeArray(parsed.preferences),
    };
  } catch (error) {
    console.error("Requirement JSON parse error:", text);

    return {
      event_type: null,
      activity: null,
      city: null,
      district: null,
      guest_count: null,
      venue_type: null,
      catering: null,
      music: null,
      transportation: null,
      budget: null,
      preferences: [],
      error: "JSON parse edilemedi",
      raw_text: text,
    };
  }
}

module.exports = { parseRequirements };