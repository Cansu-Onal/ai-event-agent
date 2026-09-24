const form = document.getElementById("eventForm");
const resultBox = document.getElementById("result");
const output = document.getElementById("output");

function safe(value, fallback = "-") {
  return value !== undefined && value !== null && value !== "" ? value : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scoreClass(score) {
  const value = Number(score || 0);

  if (value >= 80) return "score-high";
  if (value >= 55) return "score-mid";
  return "score-low";
}

function renderSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return `
      <div class="info-panel">
        <h4>Kaynaklar</h4>
        <p>Kaynak bulunamadı.</p>
      </div>
    `;
  }

  return `
    <div class="info-panel">
      <h4>Detay Araştırma Kaynakları</h4>
      <div class="source-grid">
        ${sources
          .slice(0, 4)
          .map((source, index) => {
            const title = escapeHtml(safe(source.title, `Kaynak ${index + 1}`));
            const link = source.link ? escapeHtml(source.link) : "";

            return `
              ${
                link
                  ? `<a class="source-item" href="${link}" target="_blank" rel="noreferrer">${title}</a>`
                  : `<div class="source-item">${title}</div>`
              }
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderMatchReasons(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return `
      <div class="info-panel">
        <h4>Uygunluk Nedenleri</h4>
        <div class="tag-list">
          <span>Temel mekan bilgilerine göre değerlendirildi</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="info-panel">
      <h4>Uygunluk Nedenleri</h4>
      <div class="tag-list">
        ${reasons
          .slice(0, 8)
          .map((reason) => `<span>${escapeHtml(reason)}</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function renderAveragePrice(venue) {
  if (!venue.average_price_estimate) {
    return `
      <div class="detail-row">
        <span>💸 Ortalama Fiyat</span>
        <strong>Fiyat tahmini yapılamadı</strong>
      </div>
    `;
  }

  return `
    <div class="detail-row">
      <span>💸 Ortalama Fiyat</span>
      <strong>${escapeHtml(venue.average_price_estimate)}</strong>
    </div>
    <p class="note">
      Bu fiyat webde bulunan menü/fiyat ifadelerinden çıkarılan yaklaşık aralıktır.
      Güncel fiyat için mekanla iletişime geçilmelidir.
    </p>
  `;
}

function renderParsedRequirements(req) {
  return `
    <div class="parsed-card">
      <div class="parsed-item">
        <span>Etkinlik</span>
        <strong>${escapeHtml(safe(req.event_type))}</strong>
      </div>
      <div class="parsed-item">
        <span>Aktivite</span>
        <strong>${escapeHtml(safe(req.activity))}</strong>
      </div>
      <div class="parsed-item">
        <span>Konum</span>
        <strong>${escapeHtml(safe(req.district))} / ${escapeHtml(safe(req.city))}</strong>
      </div>
      <div class="parsed-item">
        <span>Kişi</span>
        <strong>${escapeHtml(safe(req.guest_count))}</strong>
      </div>
      <div class="parsed-item">
        <span>Bütçe</span>
        <strong>${escapeHtml(safe(req.budget))} TL</strong>
      </div>
      <div class="parsed-item">
        <span>Mekan Tipi</span>
        <strong>${escapeHtml(safe(req.venue_type))}</strong>
      </div>
      <div class="parsed-item">
        <span>Ulaşım</span>
        <strong>${escapeHtml(safe(req.transportation))}</strong>
      </div>
      <div class="parsed-item">
        <span>Yemek</span>
        <strong>${req.catering === true ? "Evet" : req.catering === false ? "Hayır" : "-"}</strong>
      </div>
      <div class="parsed-item">
        <span>Müzik</span>
        <strong>${req.music === true ? "Evet" : req.music === false ? "Hayır" : "-"}</strong>
      </div>
    </div>
  `;
}

function renderVenueCard(venue, index) {
  const score = safe(venue.suitability_score, 0);

  return `
    <article class="venue-card">
      <div class="venue-top">
        <div>
          <div class="rank-badge">${index + 1}</div>
          <h3>${escapeHtml(safe(venue.name, "Mekan adı yok"))}</h3>
          <p class="venue-address">📍 ${escapeHtml(safe(venue.address, "Adres bilgisi bulunamadı"))}</p>
        </div>

        <div class="score-badge ${scoreClass(score)}">
          <strong>${score}</strong>
          <span>/100</span>
        </div>
      </div>

      <div class="quick-info">
        <div>
          <span>⭐ Rating</span>
          <strong>${venue.rating ? escapeHtml(venue.rating) : "Yok"}</strong>
        </div>
        <div>
          <span>💬 Yorum</span>
          <strong>${escapeHtml(safe(venue.review_count, "Yok"))}</strong>
        </div>
        <div>
          <span>☎️ Telefon</span>
          <strong>${escapeHtml(safe(venue.phone, "Yok"))}</strong>
        </div>
      </div>

      <div class="detail-list">
        <div class="detail-row">
          <span>🍽️ Menü / Fiyat</span>
          <strong>${escapeHtml(
            safe(
              venue.menu_price_status || venue.price_info_status,
              "Menü/fiyat bilgisi bulunamadı."
            )
          )}</strong>
        </div>

        ${renderAveragePrice(venue)}

        <div class="detail-row">
          <span>👥 Kapasite</span>
          <strong>${escapeHtml(safe(venue.capacity_status, "Kapasite bilgisi bulunamadı."))}</strong>
        </div>

        <div class="detail-row">
          <span>🍷 İçki / Alkol</span>
          <strong>${escapeHtml(
            safe(venue.alcohol_status, "İçkili mekan olduğuna dair açık bilgi bulunamadı.")
          )}</strong>
        </div>

        <div class="detail-row">
          <span>🌿 Açık Alan</span>
          <strong>${escapeHtml(safe(venue.outdoor_status, "Açık alan bilgisi bulunamadı."))}</strong>
        </div>

        <div class="detail-row">
          <span>🎵 Canlı Müzik</span>
          <strong>${escapeHtml(safe(venue.live_music_status, "Canlı müzik bilgisi bulunamadı."))}</strong>
        </div>

        <div class="detail-row">
          <span>🚌 Ulaşım</span>
          <strong>${escapeHtml(
            safe(venue.transportation_status, "Ulaşım/otopark bilgisi webde net bulunamadı.")
          )}</strong>
        </div>
      </div>

      <div class="bio-box">
        <h4>Instagram / Konsept</h4>
        <p>
          ${venue.instagram_bio ? escapeHtml(venue.instagram_bio) : "Instagram bio bilgisi bulunamadı."}
        </p>
        <div class="tag-list">
          ${
            Array.isArray(venue.instagram_concepts) && venue.instagram_concepts.length > 0
              ? venue.instagram_concepts
                  .map((concept) => `<span>${escapeHtml(concept)}</span>`)
                  .join("")
              : "<span>Net konsept bilgisi bulunamadı</span>"
          }
        </div>
      </div>

      <p class="description">
        ${escapeHtml(safe(venue.description, "Açıklama bilgisi bulunamadı."))}
      </p>

      ${renderMatchReasons(venue.match_reasons)}
      ${renderSources(venue.detail_sources)}

      <div class="links">
        ${venue.website ? `<a href="${escapeHtml(venue.website)}" target="_blank" rel="noreferrer">Website</a>` : ""}
        ${venue.instagram_url ? `<a href="${escapeHtml(venue.instagram_url)}" target="_blank" rel="noreferrer">Instagram</a>` : ""}
        ${venue.directions ? `<a href="${escapeHtml(venue.directions)}" target="_blank" rel="noreferrer">Yol Tarifi</a>` : ""}
      </div>
    </article>
  `;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const activity = document.getElementById("activity").value;
  const transportation = document.getElementById("transportation").value;

  const requestText = `
Etkinlik türü: ${document.getElementById("eventType").value}
Şehir: ${document.getElementById("city").value}
İlçe: ${document.getElementById("district").value}
Kişi sayısı: ${document.getElementById("guestCount").value}
Bütçe: ${document.getElementById("budget").value} TL
Mekan tipi: ${document.getElementById("venueType").value}
Yemek: ${document.getElementById("catering").value}
Müzik: ${document.getElementById("music").value}
Aktivite: ${activity}
Ulaşım tercihi: ${transportation}
Ek tercihler: ${document.getElementById("preferences").value}
`;

  resultBox.classList.remove("hidden");
  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });

  output.innerHTML = `
    <div class="loading-box">
      <div class="loader"></div>
      <h3>Agent sistemi çalışıyor...</h3>
      <p>Kullanıcı isteği analiz ediliyor, web araştırması yapılıyor ve mekanlar puanlanıyor.</p>

      <div class="steps">
        <span>Requirement Parsing</span>
        <span>Web Research</span>
        <span>Detail Research</span>
        <span>Scoring</span>
        <span>Recommendation</span>
      </div>
    </div>
  `;

  try {
    const response = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request: requestText }),
    });

    const data = await response.json();

    if (!data.success) {
      output.innerHTML = `
        <div class="error-box">
          <h3>Bir hata oluştu</h3>
          <p>${escapeHtml(safe(data.details || data.error, "Backend hatası"))}</p>
        </div>
      `;
      return;
    }

    const venues = Array.isArray(data.scoredVenues)
      ? data.scoredVenues
          .sort((a, b) => Number(b.suitability_score || 0) - Number(a.suitability_score || 0))
          .slice(0, 3)
      : [];

    if (venues.length === 0) {
      output.innerHTML = `
        <div class="error-box">
          <h3>Mekan bulunamadı</h3>
          <p>Arama sonucunda uygun mekan bulunamadı. SerpAPI kotasını veya arama kriterlerini kontrol et.</p>
        </div>
      `;
      return;
    }

    output.innerHTML = `
      <div class="result-intro">
        <h3>İstek Analizi</h3>
        <p>Model kullanıcının isteğini yapılandırılmış verilere çevirdi.</p>
      </div>

      ${renderParsedRequirements(data.parsedRequirements || {})}

      <div class="result-intro">
        <h3>En Uygun 3 Mekan</h3>
        <p>Mekanlar konum, aktivite, bütçe, ulaşım, puan ve web kaynaklarına göre sıralandı.</p>
      </div>

      <div class="venue-list">
        ${venues.map((venue, index) => renderVenueCard(venue, index)).join("")}
      </div>
    `;
  } catch (error) {
    output.innerHTML = `
      <div class="error-box">
        <h3>Bağlantı hatası</h3>
        <p>Backend çalışıyor mu kontrol et. Terminalde <b>node server.js</b> çalışmalı.</p>
      </div>
    `;
  }
});