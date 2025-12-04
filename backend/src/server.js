import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { queryMovies, getMovieByTitle, getAvailableGenres } from './database.js';
import { startChat, sendMessage, endChat } from './chatService.js';
import RuleEngine from './RuleEngine.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ruleEngine = new RuleEngine();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start a new chat session
app.post('/api/chat/start', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const response = await startChat(sessionId);
    res.json({ sessionId, ...response });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat session' });
  }
});

// Send a message in an existing chat session
app.post('/api/chat/message', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  try {
    const response = await sendMessage(sessionId, message);

    // If the AI is ready with filters, query for movies
    if (response.ready && response.filters) {
      const movies = await queryMoviesWithFilters(response.filters);
      return res.json({
        ...response,
        movies
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// End a chat session
app.post('/api/chat/end', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    endChat(sessionId);
  }
  res.json({ success: true });
});

// Query movies with filters (internal helper)
async function queryMoviesWithFilters(filters) {
  try {
    console.log('Querying movies with filters:', JSON.stringify(filters, null, 2));

    // Build Firestore-compatible filter object
    const dbFilters = {
      limit: 50  // Get more, then filter and rank
    };

    if (filters.genres && filters.genres.length > 0) {
      dbFilters.genres = filters.genres;
    }

    if (filters.minRating) {
      dbFilters.minRating = filters.minRating;
    }

    if (filters.maxRuntime) {
      dbFilters.maxRuntime = filters.maxRuntime;
    }

    let movies = await queryMovies(dbFilters);
    console.log(`Got ${movies.length} movies from database`);

    // If Animation is requested, ensure movies are actually animated
    // (Firestore array-contains-any returns ANY match, we want ALL for Animation)
    if (filters.genres?.includes('Animation')) {
      movies = movies.filter(m => m.genres?.includes('Animation'));
      console.log(`After requiring Animation: ${movies.length} movies`);
    }

    // Apply additional filters that Firestore can't handle
    if (filters.excludeGenres && filters.excludeGenres.length > 0) {
      movies = movies.filter(m =>
        !m.genres?.some(g => filters.excludeGenres.includes(g))
      );
      console.log(`After excluding genres: ${movies.length} movies`);
    }

    if (filters.yearRange) {
      const [minYear, maxYear] = filters.yearRange;
      movies = movies.filter(m => m.year >= minYear && m.year <= maxYear);
    }

    // Family-friendly filter (exclude adult content)
    if (filters.familyFriendly) {
      movies = movies.filter(m => !m.adult);
    }

    // Score and rank movies based on mood relevance
    movies = scoreMovies(movies, filters);

    // Sort by score (highest first), with randomness for variety
    movies.sort((a, b) => {
      const scoreDiff = b.moodScore - a.moodScore;
      // If scores are within 5 points, add randomness for variety
      if (Math.abs(scoreDiff) < 5) {
        return Math.random() - 0.5;
      }
      return scoreDiff;
    });

    // Return top 10
    const results = movies.slice(0, 10);
    console.log(`Returning ${results.length} movies: ${results.map(m => m.title).join(', ')}`);

    // If we didn't get enough results, try a broader search
    if (results.length < 5 && filters.genres?.length > 0) {
      console.log('Not enough results, trying broader search...');
      const broaderFilters = { ...dbFilters, genres: filters.genres.slice(0, 1), limit: 20 };
      const moreMovies = await queryMovies(broaderFilters);
      const additional = moreMovies
        .filter(m => !results.find(r => r.id === m.id))
        .slice(0, 10 - results.length);
      results.push(...additional);
    }

    return results;
  } catch (error) {
    console.error('Error querying movies:', error);
    return [];
  }
}

// Score movies based on mood relevance
function scoreMovies(movies, filters) {
  const moodKeywords = filters.moodKeywords || [];
  const preferredGenres = filters.genres || [];

  return movies.map(movie => {
    let score = 0;

    // Base score from rating
    if (movie.vote_average) {
      score += movie.vote_average * 2; // 0-20 points
    }

    // Bonus for matching preferred genres
    const matchingGenres = movie.genres?.filter(g => preferredGenres.includes(g)).length || 0;
    score += matchingGenres * 5; // 5 points per matching genre

    // Bonus for high popularity (people liked it)
    if (movie.popularity > 100) score += 5;
    if (movie.popularity > 500) score += 5;

    // Bonus for having a trailer (better experience)
    if (movie.trailer_url) score += 3;

    // Penalty for very old movies (unless nostalgic mood)
    if (filters.mood !== 'nostalgic' && movie.year && movie.year < 2000) {
      score -= 5;
    }

    // Check overview for mood keywords
    if (movie.overview && moodKeywords.length > 0) {
      const overviewLower = movie.overview.toLowerCase();
      moodKeywords.forEach(keyword => {
        if (overviewLower.includes(keyword.toLowerCase())) {
          score += 3;
        }
      });
    }

    return { ...movie, moodScore: score };
  });
}

// Direct movie query endpoint (for advanced users or debugging)
app.get('/api/movies', async (req, res) => {
  try {
    const { genres, minRating, maxRuntime, limit } = req.query;

    const filters = {};
    if (genres) filters.genres = genres.split(',');
    if (minRating) filters.minRating = parseFloat(minRating);
    if (maxRuntime) filters.maxRuntime = parseInt(maxRuntime);
    if (limit) filters.limit = parseInt(limit);

    const movies = await queryMovies(filters);
    res.json({ movies });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Get available genres
app.get('/api/genres', async (req, res) => {
  try {
    const genres = await getAvailableGenres();
    res.json({ genres });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// Legacy endpoint - get recommendation by mood and genre
app.get('/api/recommendations', async (req, res) => {
  const { mood, genre } = req.query;

  if (!mood || !genre) {
    return res.status(400).send({ error: 'Mood and genre are required query parameters.' });
  }

  try {
    // First try the rule engine for exact matches
    const recommendedTitles = ruleEngine.getRecommendations(mood, genre);

    if (recommendedTitles.length > 0) {
      const movieTitle = recommendedTitles[0];
      const movieDetails = await getMovieByTitle(movieTitle);
      if (movieDetails) {
        return res.send({ recommendations: [movieDetails] });
      }
    }

    // Fallback: query movies by genre
    const movies = await queryMovies({ genres: [genre], minRating: 7.0, limit: 5 });

    if (movies.length === 0) {
      return res.status(404).send({
        recommendations: [],
        message: 'No movie found for the selected mood and genre.'
      });
    }

    res.send({ recommendations: movies });
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    res.status(500).send({ error: 'An internal server error occurred.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST /api/chat/start     - Start a new chat session');
  console.log('  POST /api/chat/message   - Send a message in chat');
  console.log('  GET  /api/movies         - Query movies directly');
  console.log('  GET  /api/genres         - Get available genres');
  console.log('  GET  /api/recommendations - Legacy mood+genre endpoint');
  console.log('  GET  /api/health         - Health check');
});
