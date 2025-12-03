import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

const db = admin.firestore();

// Converts a movie title like "Paddington 2" into a slug "paddington-2"
function titleToSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Get a single movie by title
export async function getMovieByTitle(title) {
  const movieSlug = titleToSlug(title);
  const movieRef = db.collection('movies').doc(movieSlug);
  const doc = await movieRef.get();

  if (!doc.exists) {
    console.log('No such document!');
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

// Query movies based on filters from the AI conversation
// Note: Firestore doesn't support multiple inequality filters without composite indexes
// So we only filter by genre in Firestore and apply other filters in JavaScript
export async function queryMovies(filters) {
  let query = db.collection('movies');

  // Genre filter (only Firestore filter we use to avoid composite index requirement)
  if (filters.genres && filters.genres.length > 0) {
    query = query.where('genres', 'array-contains-any', filters.genres);
  }

  // Fetch more than needed since we'll filter in JS
  const fetchLimit = Math.max((filters.limit || 10) * 3, 100);
  query = query.limit(fetchLimit);

  const snapshot = await query.get();
  let movies = [];
  snapshot.forEach(doc => {
    movies.push({ id: doc.id, ...doc.data() });
  });

  // Apply rating filter in JavaScript
  if (filters.minRating) {
    movies = movies.filter(m => (m.vote_average || 0) >= filters.minRating);
  }

  // Apply runtime filter in JavaScript
  if (filters.maxRuntime) {
    movies = movies.filter(m => !m.runtime || m.runtime <= filters.maxRuntime);
  }

  // Apply minimum runtime filter in JavaScript
  if (filters.minRuntime) {
    movies = movies.filter(m => m.runtime && m.runtime >= filters.minRuntime);
  }

  // Return requested limit
  return movies.slice(0, filters.limit || 10);
}

// Get all available genres from the database
export async function getAvailableGenres() {
  const snapshot = await db.collection('movies').limit(100).get();
  const genreSet = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.genres) {
      data.genres.forEach(g => genreSet.add(g));
    }
  });
  return Array.from(genreSet).sort();
}

// Add a movie to the database (for seeding)
export async function addMovie(movie) {
  const slug = titleToSlug(movie.title);
  await db.collection('movies').doc(slug).set(movie);
  return slug;
}

// Batch add movies (for seeding from TMDB)
export async function batchAddMovies(movies) {
  const batch = db.batch();
  const slugs = [];

  for (const movie of movies) {
    const slug = titleToSlug(movie.title);
    const ref = db.collection('movies').doc(slug);
    batch.set(ref, movie);
    slugs.push(slug);
  }

  await batch.commit();
  return slugs;
}

export { db };
