import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =============================================================================
// MOOD-BASED EXPERT RULES
// These rules encode expert knowledge about how moods map to movie characteristics
// =============================================================================

export const MOOD_RULES = {
  // Positive/Uplifting Moods
  happy: {
    description: "Feeling good, want to maintain positive vibes",
    genres: ["Comedy", "Animation", "Family", "Romance"],
    excludeGenres: ["Horror", "War", "Crime"],
    preferHighRating: true,
    keywords: ["feel-good", "heartwarming", "funny", "uplifting"]
  },
  excited: {
    description: "Want adrenaline and thrills",
    genres: ["Action", "Adventure", "Sci-Fi", "Thriller"],
    excludeGenres: ["Documentary", "Drama"],
    preferHighRating: false,
    keywords: ["action-packed", "thrilling", "explosive", "intense"]
  },
  romantic: {
    description: "In the mood for love and connection",
    genres: ["Romance", "Drama", "Comedy"],
    excludeGenres: ["Horror", "War", "Crime"],
    preferHighRating: true,
    keywords: ["love", "romantic", "relationship", "chemistry"]
  },
  adventurous: {
    description: "Want to explore and escape",
    genres: ["Adventure", "Fantasy", "Sci-Fi", "Action"],
    excludeGenres: ["Documentary"],
    preferHighRating: false,
    keywords: ["epic", "journey", "quest", "exploration"]
  },
  inspired: {
    description: "Want motivation and inspiration",
    genres: ["Drama", "Documentary", "History"],
    excludeGenres: ["Horror", "Comedy"],
    preferHighRating: true,
    keywords: ["inspiring", "true story", "triumph", "achievement"]
  },

  // Negative Moods (seeking comfort or catharsis)
  sad: {
    description: "Feeling down, might want catharsis or comfort",
    genres: ["Comedy", "Animation", "Family", "Romance"],
    excludeGenres: ["Horror", "War", "Thriller"],
    preferHighRating: true,
    keywords: ["heartwarming", "comfort", "hopeful", "uplifting"]
  },
  stressed: {
    description: "Need to unwind and relax",
    genres: ["Comedy", "Animation", "Family"],
    excludeGenres: ["Horror", "Thriller", "War", "Crime"],
    preferHighRating: true,
    preferShorterRuntime: true,
    keywords: ["light", "easy", "fun", "relaxing"]
  },
  anxious: {
    description: "Feeling anxious, need something calming",
    genres: ["Animation", "Family", "Documentary", "Comedy"],
    excludeGenres: ["Horror", "Thriller", "War", "Crime"],
    preferHighRating: true,
    keywords: ["gentle", "peaceful", "calming", "wholesome"]
  },
  bored: {
    description: "Need stimulation and engagement",
    genres: ["Action", "Thriller", "Mystery", "Sci-Fi", "Adventure"],
    excludeGenres: [],
    preferHighRating: true,
    keywords: ["gripping", "engaging", "twist", "suspense"]
  },
  lonely: {
    description: "Seeking connection and warmth",
    genres: ["Romance", "Comedy", "Drama", "Family"],
    excludeGenres: ["Horror"],
    preferHighRating: true,
    keywords: ["friendship", "connection", "heartwarming", "community"]
  },

  // Seeking Specific Experiences
  scared: {
    description: "Want to be frightened (in a fun way)",
    genres: ["Horror", "Thriller", "Mystery"],
    excludeGenres: ["Comedy", "Animation", "Family"],
    preferHighRating: true,
    keywords: ["scary", "terrifying", "suspense", "horror"]
  },
  thoughtful: {
    description: "Want something intellectually stimulating",
    genres: ["Drama", "Sci-Fi", "Documentary", "Mystery"],
    excludeGenres: ["Action", "Animation"],
    preferHighRating: true,
    keywords: ["thought-provoking", "philosophical", "complex", "deep"]
  },
  nostalgic: {
    description: "Want something that brings back memories",
    genres: ["Family", "Animation", "Comedy", "Adventure"],
    excludeGenres: ["Horror"],
    preferOlderMovies: true,
    preferHighRating: true,
    keywords: ["classic", "nostalgic", "childhood", "timeless"]
  },
  curious: {
    description: "Want to learn something new",
    genres: ["Documentary", "History", "Drama"],
    excludeGenres: ["Horror", "Action"],
    preferHighRating: true,
    keywords: ["educational", "fascinating", "true", "discovery"]
  },
  escapist: {
    description: "Want to escape reality completely",
    genres: ["Fantasy", "Sci-Fi", "Animation", "Adventure"],
    excludeGenres: ["Documentary", "Drama"],
    preferHighRating: false,
    keywords: ["magical", "otherworldly", "fantasy", "imagination"]
  }
};

// Social context rules
export const CONTEXT_RULES = {
  alone: {
    description: "Watching solo",
    adjustments: { allowAllGenres: true }
  },
  date: {
    description: "Date night",
    genres: ["Romance", "Comedy", "Drama", "Thriller"],
    excludeGenres: ["Horror", "War", "Documentary", "Animation"],
    preferHighRating: true
  },
  friends: {
    description: "Watching with friends",
    genres: ["Comedy", "Action", "Horror", "Thriller"],
    excludeGenres: ["Romance", "Documentary"],
    preferHighRating: false
  },
  family: {
    description: "Family movie night",
    genres: ["Animation", "Family", "Adventure", "Comedy"],
    excludeGenres: ["Horror", "Crime", "Thriller", "War"],
    preferHighRating: true,
    familyFriendly: true
  },
  kids: {
    description: "Watching with children",
    genres: ["Animation", "Family", "Adventure"],
    excludeGenres: ["Horror", "Crime", "Thriller", "War", "Drama"],
    familyFriendly: true
  }
};

// Time constraints
export const TIME_RULES = {
  short: { maxRuntime: 100, description: "Under 1h 40m" },
  medium: { maxRuntime: 130, description: "Under 2h 10m" },
  long: { maxRuntime: 999, description: "Any length" },
  epic: { minRuntime: 150, description: "Epic length (2.5h+)" }
};

// =============================================================================
// AI PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are a warm, friendly movie mood expert. Your specialty is understanding how people FEEL and finding movies that match or improve their emotional state.

YOUR APPROACH:
1. Start by genuinely understanding their current MOOD or how they want to FEEL
2. Ask about social context (alone, date, friends, family)
3. Check for any practical constraints (time, content restrictions)
4. After 2-3 exchanges, provide your recommendation criteria

MOOD CATEGORIES YOU UNDERSTAND:
- Happy/Joyful - Want to keep the good vibes going
- Excited/Energized - Want adrenaline and thrills
- Romantic - In the mood for love stories
- Adventurous - Want to explore and escape
- Inspired - Seeking motivation and meaning
- Sad/Down - Need comfort or catharsis
- Stressed/Overwhelmed - Need to decompress
- Anxious/Nervous - Need something calming
- Bored/Restless - Need engagement and stimulation
- Lonely - Seeking warmth and connection
- Scared (wanting to be) - In the mood for thrills and chills
- Thoughtful/Reflective - Want intellectual stimulation
- Nostalgic - Want comfort of the familiar
- Curious - Want to learn something
- Escapist - Want to leave reality behind

CONVERSATION STYLE:
- Be warm and empathetic, not robotic
- Use casual language, contractions, and be personable
- Keep responses to 1-2 short sentences
- Show you understand their emotional state
- Don't ask about genres directly - infer from mood

IMPORTANT RULES:
- Focus on MOOD first, genre is secondary
- The mood field is REQUIRED in your output
- Only ask 2-3 questions max before giving recommendations
- Be decisive - don't over-ask

When ready (after 2-3 exchanges), respond with this EXACT format:

\`\`\`json
{
  "ready": true,
  "filters": {
    "mood": "stressed",
    "context": "alone",
    "genres": ["Comedy", "Animation"],
    "excludeGenres": ["Horror", "War"],
    "minRating": 7.0,
    "maxRuntime": 120,
    "timePreference": "short"
  },
  "summary": "Sounds like you need something light and fun to unwind - let me find some feel-good comedies for you!"
}
\`\`\`

REQUIRED FIELDS: mood (from list above), summary
OPTIONAL: context, genres, excludeGenres, minRating, maxRuntime, timePreference, yearRange

Valid moods: happy, excited, romantic, adventurous, inspired, sad, stressed, anxious, bored, lonely, scared, thoughtful, nostalgic, curious, escapist

Valid contexts: alone, date, friends, family, kids

Valid genres: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Sci-Fi, Thriller, War, Western`;

// =============================================================================
// CHAT SESSION MANAGEMENT
// =============================================================================

const chatSessions = new Map();

export async function startChat(sessionId) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'System: ' + SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: "Hey there! How are you feeling tonight? I'd love to find you the perfect movie to match your mood." }],
      },
    ],
  });

  chatSessions.set(sessionId, chat);

  return {
    message: "Hey there! How are you feeling tonight? I'd love to find you the perfect movie to match your mood.",
    ready: false
  };
}

export async function sendMessage(sessionId, userMessage) {
  let chat = chatSessions.get(sessionId);

  if (!chat) {
    await startChat(sessionId);
    chat = chatSessions.get(sessionId);
  }

  try {
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    // Check if response contains filter JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.ready) {
          // Don't delete session - allow continued conversation
          // chatSessions.delete(sessionId);

          // Apply expert rules based on mood
          const enhancedFilters = applyMoodRules(parsed.filters);

          return {
            message: parsed.summary || "Great! Let me find the perfect movies for your mood...",
            ready: true,
            filters: enhancedFilters
          };
        }
      } catch (e) {
        console.error('Failed to parse filters JSON:', e);
      }
    }

    return {
      message: response.replace(/```json[\s\S]*?```/g, '').trim(),
      ready: false
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get response from AI');
  }
}

// =============================================================================
// EXPERT RULE APPLICATION
// =============================================================================

function applyMoodRules(filters) {
  const enhanced = { ...filters };

  // Apply mood-based rules
  if (filters.mood && MOOD_RULES[filters.mood]) {
    const moodRule = MOOD_RULES[filters.mood];

    // Merge genres (AI suggestions + mood rules)
    if (!enhanced.genres || enhanced.genres.length === 0) {
      enhanced.genres = [...moodRule.genres];
    } else {
      // Combine AI genres with mood-suggested genres, prioritizing overlap
      const combinedGenres = [...new Set([...enhanced.genres, ...moodRule.genres])];
      enhanced.genres = combinedGenres.slice(0, 4); // Max 4 genres
    }

    // Apply exclusions
    if (!enhanced.excludeGenres) {
      enhanced.excludeGenres = [...moodRule.excludeGenres];
    } else {
      enhanced.excludeGenres = [...new Set([...enhanced.excludeGenres, ...moodRule.excludeGenres])];
    }

    // Apply rating preference
    if (moodRule.preferHighRating && !enhanced.minRating) {
      enhanced.minRating = 7.0;
    }

    // Apply runtime preference
    if (moodRule.preferShorterRuntime && !enhanced.maxRuntime) {
      enhanced.maxRuntime = 110;
    }

    // Store keywords for potential future use
    enhanced.moodKeywords = moodRule.keywords;
  }

  // Apply context-based rules
  if (filters.context && CONTEXT_RULES[filters.context]) {
    const contextRule = CONTEXT_RULES[filters.context];

    // For family/kids, enforce family-friendly
    if (contextRule.familyFriendly) {
      enhanced.familyFriendly = true;
      enhanced.excludeGenres = [...new Set([
        ...(enhanced.excludeGenres || []),
        ...contextRule.excludeGenres
      ])];
    }

    // Adjust genres based on context
    if (contextRule.genres && contextRule.genres.length > 0) {
      // Find intersection with mood genres, or use context genres
      const moodGenres = enhanced.genres || [];
      const contextGenres = contextRule.genres;
      const intersection = moodGenres.filter(g => contextGenres.includes(g));

      if (intersection.length > 0) {
        enhanced.genres = intersection;
      }
    }
  }

  // Apply time rules
  if (filters.timePreference && TIME_RULES[filters.timePreference]) {
    const timeRule = TIME_RULES[filters.timePreference];
    if (timeRule.maxRuntime) {
      enhanced.maxRuntime = timeRule.maxRuntime;
    }
    if (timeRule.minRuntime) {
      enhanced.minRuntime = timeRule.minRuntime;
    }
  }

  return enhanced;
}

export function endChat(sessionId) {
  chatSessions.delete(sessionId);
}

// Export rules for use in other modules
export { MOOD_RULES as moodRules, CONTEXT_RULES as contextRules, TIME_RULES as timeRules };
