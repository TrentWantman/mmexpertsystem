# Movie Mood Matcher - Frontend

A React frontend for the Movie Mood Matcher expert system. This application provides a conversational interface where users describe their mood, and the AI recommends personalized movies.

## Features

- **Chat Interface**: Natural conversation with an AI that asks about mood and preferences
- **Movie Cards**: Beautiful grid display with posters, ratings, and genre tags
- **Movie Detail Modal**: Full movie information with embedded YouTube trailers
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Dark theme with gradient accents using Tailwind CSS

---

## Setup Instructions

### 1. Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- Backend server running (see `backend/README.md`)

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Note**: Make sure the backend is running on `http://localhost:3000` before using the app.

---

## Usage

1. Click **"Let's Go!"** to start a new chat session
2. Tell the AI how you're feeling (e.g., "I'm stressed and want to relax")
3. Answer follow-up questions about:
   - Who you're watching with (alone, date, family, friends)
   - How much time you have
4. Get personalized movie recommendations
5. Click on any movie card to see details and watch the trailer
6. Click **"Find More Movies"** to start over

---

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles + Tailwind
├── index.html           # HTML template
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── package.json
```

---

## Components

### App
Main component containing:
- Welcome screen with "Let's Go!" button
- Chat interface with message history
- Movie results grid
- Header and footer

### MovieCard
Displays individual movie with:
- Poster image
- Rating badge
- Title and year
- Genre tags
- Hover overlay

### MovieModal
Full-screen modal showing:
- Backdrop image
- Large poster
- Full movie details (rating, runtime, genres)
- Plot overview
- Embedded YouTube trailer

---

## API Configuration

The frontend connects to the backend at `http://localhost:3000/api`. To change this, edit the `API_BASE` constant in `src/App.jsx`:

```javascript
const API_BASE = 'http://localhost:3000/api';
```

---

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files ready for deployment.

---

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **ESLint** - Code linting
