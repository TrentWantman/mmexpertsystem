# Movie Mood Matcher - Backend

A Node.js/Express backend for the Movie Mood Matcher expert system. This server provides an AI-powered conversational interface that recommends movies based on the user's mood, social context, and preferences.

## Features

- **AI Chat Interface**: Uses Google Gemini to have natural conversations about mood and preferences
- **Expert Rule System**: 15 mood categories with genre mappings, exclusions, and scoring keywords
- **Context-Aware Filtering**: Adjusts recommendations based on social context (alone, date, family, friends)
- **Movie Database**: 1000+ popular movies from TMDB stored in Firebase Firestore
- **Smart Scoring**: Ranks movies based on mood relevance, genre match, popularity, and more

---

## Setup Instructions

### 1. Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- A Firebase project with Firestore enabled
- API keys for TMDB and Google Gemini

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Get API Keys

You'll need three API keys:

#### Firebase (Firestore Database)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the values for `project_id`, `private_key`, and `client_email`

#### TMDB (Movie Data)
1. Go to [TMDB](https://www.themoviedb.org/) and create an account
2. Go to **Settings** > **API**
3. Request an API key (choose "Developer" option)
4. Copy your API Key (v3 auth)

#### Google Gemini (AI Chat)
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the generated key

### 4. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Firebase Service Account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# TMDB API Key
TMDB_API_KEY=your_tmdb_api_key

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key
```

**Note**: The `FIREBASE_PRIVATE_KEY` must include the `\n` characters and be wrapped in quotes.

### 5. Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in developer mode**

### 6. Seed the Database

(skip this step if using a database already with movies)

Populate the database with movies from TMDB:

```bash
# Quick seed (no trailers, faster) - 1000 movies
npm run seed:quick

# Full seed (with trailers) - 1000 movies
npm run seed

# Custom count
npm run seed:quick -- --count=500
```

---

## Running the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

---

## API Endpoints

### Chat Endpoints (Primary)

#### `POST /api/chat/start`
Start a new chat session.

**Response:**
```json
{
  "sessionId": "uuid-string",
  "message": "Hey there! How are you feeling tonight?",
  "ready": false
}
```

#### `POST /api/chat/message`
Send a message in an existing chat session.

**Request Body:**
```json
{
  "sessionId": "uuid-from-start",
  "message": "I'm feeling stressed and want to watch something with my family"
}
```

**Response (conversation continues):**
```json
{
  "message": "Got it! How much time do you have?",
  "ready": false
}
```

**Response (recommendations ready):**
```json
{
  "message": "Let me find some relaxing family-friendly movies for you!",
  "ready": true,
  "movies": [
    {
      "id": "paddington-2",
      "title": "Paddington 2",
      "year": 2017,
      "genres": ["Family", "Comedy", "Adventure"],
      "vote_average": 7.8,
      "overview": "...",
      "poster_url": "https://image.tmdb.org/...",
      "backdrop_url": "https://image.tmdb.org/...",
      "trailer_url": "https://youtube.com/watch?v=..."
    }
  ]
}
```

#### `POST /api/chat/end`
End a chat session (cleanup).

**Request Body:**
```json
{
  "sessionId": "uuid-from-start"
}
```

### Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/movies` | GET | Query movies directly with filters |
| `/api/genres` | GET | Get list of available genres |
| `/api/recommendations` | GET | Legacy mood+genre endpoint |
| `/api/health` | GET | Health check |

---

## Expert System Rules

### Mood Categories

The system understands 15 moods:

| Mood | Recommended Genres | Excluded Genres |
|------|-------------------|-----------------|
| happy | Comedy, Animation, Family, Romance | Horror, War, Crime |
| excited | Action, Adventure, Sci-Fi, Thriller | Documentary, Drama |
| romantic | Romance, Drama, Comedy | Horror, War, Crime |
| adventurous | Adventure, Fantasy, Sci-Fi, Action | Documentary |
| inspired | Drama, Documentary, History | Horror, Comedy |
| sad | Comedy, Animation, Family, Romance | Horror, War, Thriller |
| stressed | Comedy, Animation, Family | Horror, Thriller, War, Crime |
| anxious | Animation, Family, Documentary, Comedy | Horror, Thriller, War, Crime |
| bored | Action, Thriller, Mystery, Sci-Fi, Adventure | - |
| lonely | Romance, Comedy, Drama, Family | Horror |
| scared | Horror, Thriller, Mystery | Comedy, Animation, Family |
| thoughtful | Drama, Sci-Fi, Documentary, Mystery | Action, Animation |
| nostalgic | Family, Animation, Comedy, Adventure | Horror |
| curious | Documentary, History, Drama | Horror, Action |
| escapist | Fantasy, Sci-Fi, Animation, Adventure | Documentary, Drama |

### Context Rules

| Context | Adjustments |
|---------|-------------|
| alone | All genres allowed |
| date | Prefer Romance, Comedy, Drama; exclude Horror, Animation |
| friends | Prefer Comedy, Action, Horror; exclude Romance, Documentary |
| family | Family-friendly only; exclude Horror, Crime, Thriller, War |
| kids | Animation, Family, Adventure only; strict content filtering |

---

## Project Structure

```
backend/
├── src/
│   ├── server.js        # Express server and API endpoints
│   ├── chatService.js   # Gemini AI chat + expert rules
│   ├── database.js      # Firestore connection and queries
│   ├── tmdbFetcher.js   # TMDB API integration
│   ├── seedDatabase.js  # Database seeding script
│   └── RuleEngine.js    # Legacy rule engine (not used)
├── .env                 # Environment variables (not in git)
├── .env.example         # Template for environment variables
└── package.json
```

---

## Troubleshooting

### "Firestore API not enabled"
Go to Firebase Console > Build > Firestore Database and create the database.

### "Invalid API key" for Gemini
Make sure your Gemini API key is correct and the Gemini API is enabled in your Google Cloud project.

### "TMDB API error"
Verify your TMDB API key at https://www.themoviedb.org/settings/api

### No movies returned
Run the seed script to populate the database: `npm run seed:quick`
