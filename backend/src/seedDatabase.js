import { batchAddMovies } from './database.js';
import { fetchMovies, fetchMoviesQuick } from './tmdbFetcher.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase(quick = false, count = 1000) {
  console.log('Starting database seed...');
  console.log(quick ? `Quick mode: fetching ${count} movies (no trailers)` : `Full mode: fetching ${count} movies with trailers`);

  try {
    // Fetch movies from TMDB
    const movies = quick
      ? await fetchMoviesQuick(count)
      : await fetchMovies(count);

    console.log(`Got ${movies.length} movies, adding to Firestore...`);

    // Firestore batch writes are limited to 500 operations
    const batchSize = 400;
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      await batchAddMovies(batch);
      console.log(`Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(movies.length / batchSize)}`);
    }

    console.log('Database seeded successfully!');
    console.log(`Total movies added: ${movies.length}`);

    // Show sample of what was added
    console.log('\nSample movies:');
    movies.slice(0, 5).forEach(m => {
      console.log(`  - ${m.title} (${m.year}) - ${m.genres.join(', ')}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Check command line args
const args = process.argv.slice(2);
const quickMode = args.includes('--quick') || args.includes('-q');

// Get count from args (default 1000)
const countArg = args.find(a => a.startsWith('--count='));
const count = countArg ? parseInt(countArg.split('=')[1]) : 1000;

seedDatabase(quickMode, count);
