const rules = [
  { mood: 'Uplifting', genre: 'Comedy', movieTitle: 'Paddington 2' },
  { mood: 'Adventurous', genre: 'Action', movieTitle: 'Mad Max: Fury Road' },
  { mood: 'Thought-Provoking', genre: 'Sci-Fi', movieTitle: 'Arrival' },
  { mood: 'Tense', genre: 'Thriller', movieTitle: 'A Quiet Place' },
  { mood: 'Romantic', genre: 'Drama', movieTitle: 'Pride & Prejudice' },
  { mood: 'Scared', genre: 'Horror', movieTitle: 'The Conjuring' },
  { mood: 'Imaginative', genre: 'Fantasy', movieTitle: 'Pan\'s Labyrinth' },
  { mood: 'Nostalgic', genre: 'Family', movieTitle: 'The Goonies' },
  { mood: 'Intrigued', genre: 'Mystery', movieTitle: 'Knives Out' },
  { mood: 'Inspired', genre: 'Biography', movieTitle: 'Hidden Figures' },
];

class RuleEngine {
  getRecommendations(mood, genre) {
    const matchingRule = rules.find(
      (rule) => rule.mood === mood && rule.genre === genre
    );

    if (matchingRule) {
      return [matchingRule.movieTitle]; // Return title as an array
    }
    
    return []; // No match found
  }
}

export default RuleEngine;
