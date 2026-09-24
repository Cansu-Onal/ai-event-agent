# AI Event & Venue Recommendation Agent

AI Event & Venue Recommendation Agent is an AI-powered web application that recommends the three most suitable venues based on the user’s activity, location, group size, budget, and personal preferences.

The application searches real web results for activities such as having coffee, dining, eating dessert, organizing a celebration, or holding a meeting. It evaluates the available venues and presents the best matches with suitability scores and detailed information.

## Features

* Venue research based on event and activity type
* City and district-based location filtering
* Group size and budget evaluation
* Indoor and outdoor venue preferences
* Catering and live music options
* Public transportation and private vehicle preferences
* Menu and approximate price research
* Instagram profile and venue concept discovery
* Capacity, outdoor area, alcohol, live music, and parking research
* Rule-based venue scoring
* Three personalized venue recommendations
* Direct links to websites, Instagram profiles, and directions
* Responsive user interface

## How It Works

The application uses a six-stage agent pipeline:

1. **Requirement Agent:** Converts the user’s request into structured data, including the activity, location, budget, group size, and preferences.
2. **Web Research Agent:** Searches Google Local results through SerpAPI to discover relevant venues.
3. **Instagram Bio Agent:** Searches for Instagram profiles and extracts available concept and capacity information.
4. **Detail Research Agent:** Researches menu prices, transportation, parking, outdoor areas, live music, alcohol information, and other venue details.
5. **Scoring Agent:** Scores venues according to the user’s activity, budget, transportation choice, capacity requirements, and additional preferences.
6. **Recommendation Agent:** Selects the three highest-scoring venues and generates concise explanations for each recommendation.

The system avoids inventing unavailable prices or venue details. Missing information is clearly indicated in the results.

## Technologies

### Backend

* Node.js
* Express.js
* Axios
* CORS
* dotenv

### Frontend

* HTML5
* CSS3
* JavaScript
* Responsive web design

### AI and Search Services

* Groq API
* Llama 3.1 8B Instant
* SerpAPI
* Google Search results
* Google Local results

## Project Structure

```text
ai-event-agent/
├── backend/
│   ├── agents/
│   │   ├── requirementAgent.js
│   │   ├── webResearchAgent.js
│   │   ├── instagramBioAgent.js
│   │   ├── detailResearchAgent.js
│   │   ├── scoringAgent.js
│   │   └── recommendationAgent.js
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── frontend/
    ├── index.html
    ├── script.js
    └── style.css
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Cansu-Onal/ai-event-agent.git
cd ai-event-agent
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` directory:

```env
GROQ_API_KEY=your_groq_api_key
SERPAPI_KEY=your_serpapi_key
```

Never commit your real API keys to GitHub.

### 4. Start the backend server

```bash
node server.js
```

The backend will run at:

```text
http://localhost:5000
```

You can visit `http://localhost:5000` in your browser to verify that the server is running.

### 5. Start the frontend

Open `frontend/index.html` with the **Live Server** extension in Visual Studio Code.

The frontend sends analysis requests to:

```text
http://localhost:5000/analyze
```

## API Usage

### Analyze a venue request

```http
POST /analyze
Content-Type: application/json
```

Example request:

```json
{
  "request": "We are looking for a quiet, alcohol-free café in Kadıköy for four people within our budget."
}
```

The API returns the parsed requirements, discovered venues, detailed research results, suitability scores, and the three highest-ranking recommendations.

## Evaluation Criteria

Venues are evaluated according to:

* Activity compatibility
* City and district match
* Group capacity
* Estimated total cost
* Menu and price availability
* Indoor or outdoor preference
* Live music preference
* Alcohol preference
* Public transportation or parking availability
* Additional user preferences
* Completeness of available web information

## Notes

* Venue information may change because the results are based on current web search data.
* Approximate prices are extracted from price-related information found in web results.
* Users should contact venues directly for current prices, availability, capacity, and reservation details.
* API keys must only be stored in the backend `.env` file.

## Developer

**Cansu Önal**

* GitHub: [Cansu-Onal](https://github.com/Cansu-Onal)
