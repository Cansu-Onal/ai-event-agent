const axios = require("axios");

async function generateRecommendations(requirements, scoredVenues) {
  const topVenues = scoredVenues
    .sort((a, b) => b.suitability_score - a.suitability_score)
    .slice(0, 3);

  const prompt = `
Sen bir AI venue recommendation agent'sın.

Kullanıcının ihtiyacına göre en uygun 3 mekanı kısa, net ve sunumluk şekilde açıkla.

ÇOK ÖNEMLİ KURALLAR:
- Fiyat uydurma.
- Menü/fiyat bilgisi yoksa "Menü/fiyat bilgisi webde bulunamadı" de.
- average_price_estimate varsa bunu "yaklaşık web menü aralığı" olarak belirt.
- average_price_estimate yoksa tahmin yapma.
- İçki/alkol bilgisi yoksa "İçkili olduğuna dair açık bilgi bulunamadı" de.
- Ulaşım bilgisi yoksa "Ulaşım bilgisi webde net bulunamadı" de.
- Gereksiz uzun yazma.
- Türkçe cevap ver.
- Her mekan için maksimum 5 kısa madde yaz.

Kullanıcı gereksinimleri:
${JSON.stringify(requirements, null, 2)}

En yüksek puanlı mekan adayları:
${JSON.stringify(topVenues, null, 2)}

Çıktı formatı:

1. Mekan adı
Uygunluk puanı:
Neden önerildi:
Menü/Fiyat:
Ulaşım:
Dikkat edilmesi gerekenler:
Link:
`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "Sen kısa, güvenilir ve kaynak verisine bağlı kalan bir mekan öneri agentısın. Veri yoksa tahmin yapmazsın.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    topVenues,
    recommendationText: response.data.choices[0].message.content,
  };
}

module.exports = { generateRecommendations };