import express from 'express';
import RuleEngine from './RuleEngine.js';
import { getMovieByTitle } from './database.js';

const app = express();
const port = 3000;

const ruleEngine = new RuleEngine();

// Middleware to handle JSON requests
app.use(express.json());

app.get('/api/recommendations', async (req, res) => {
  const { mood, genre } = req.query;

  if (!mood || !genre) {
    return res.status(400).send({ error: 'Mood and genre are required query parameters.' });
  }

  try {
    const recommendedTitles = ruleEngine.getRecommendations(mood, genre);

    if (recommendedTitles.length === 0) {
      return res.status(404).send({ recommendations: [], message: 'No movie found for the selected mood and genre.' });
    }

    // For the prototype, we assume the rule engine gives us one clear winner.
    const movieTitle = recommendedTitles[0];
    
    // Fetch detailed information from our database (currently mocked)
    const movieDetails = await getMovieByTitle(movieTitle);

    res.send({ recommendations: [movieDetails] });
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    res.status(500).send({ error: 'An internal server error occurred.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
