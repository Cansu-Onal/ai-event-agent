require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { parseRequirements } = require("./agents/requirementAgent");
const { searchVenues } = require("./agents/webResearchAgent");
const {
  enrichVenuesWithInstagramBio,
} = require("./agents/instagramBioAgent");
const {
  enrichVenuesWithDetails,
} = require("./agents/detailResearchAgent");
const { scoreVenues } = require("./agents/scoringAgent");
const { generateRecommendations } = require("./agents/recommendationAgent");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Event Agent Backend Running");
});

app.post("/analyze", async (req, res) => {
  try {
    const userRequest = req.body.request;

    if (!userRequest) {
      return res.status(400).json({
        success: false,
        error: "Request text required",
      });
    }

    console.log("=================================");
    console.log("Yeni analiz isteği geldi");
    console.log("=================================");

    console.log("1. Requirement Parsing Agent çalışıyor...");
    const requirements = await parseRequirements(userRequest);

    console.log("Parsed requirements:", requirements);

    console.log("2. Web Research Agent çalışıyor...");
    const venues = await searchVenues(requirements);

    if (!venues || venues.length === 0) {
      return res.json({
        success: false,
        error: "Mekan bulunamadı.",
        parsedRequirements: requirements,
        foundVenues: [],
        instagramEnrichedVenues: [],
        detailedVenues: [],
        scoredVenues: [],
        recommendations: null,
      });
    }

    console.log(`${venues.length} mekan bulundu.`);

    console.log("3. Instagram Bio Agent çalışıyor...");
    const instagramEnrichedVenues = await enrichVenuesWithInstagramBio(
      venues,
      requirements
    );

    console.log("4. Detail Research Agent çalışıyor...");
    const detailedVenues = await enrichVenuesWithDetails(
      instagramEnrichedVenues,
      requirements
    );

    console.log("5. Scoring Agent çalışıyor...");
    const scoredVenues = scoreVenues(detailedVenues, requirements);

    const topVenues = scoredVenues.slice(0, 3);

    console.log("Top 3 mekan:");
    topVenues.forEach((venue, index) => {
      console.log(
        `${index + 1}. ${venue.name} - ${venue.suitability_score}/100`
      );
    });

    console.log("6. Recommendation Agent çalışıyor...");
    const recommendations = await generateRecommendations(
      requirements,
      scoredVenues
    );

    res.json({
      success: true,
      parsedRequirements: requirements,
      foundVenues: venues,
      instagramEnrichedVenues,
      detailedVenues,
      scoredVenues,
      topVenues,
      recommendations,
    });
  } catch (error) {
    console.error("Backend error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "AI agent process failed",
      details: error.response?.data || error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});