import dotenv from 'dotenv';
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB genre ID to name mapping
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western'
};

// Fetch popular movies from TMDB
async function fetchPopularMovies(page = 1) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not set in .env file');
  }
  const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status_code === 7 || data.status_code === 401) {
    throw new Error(`TMDB API Error: ${data.status_message || 'Invalid API key'}`);
  }

  if (!data.results) {
    console.error('TMDB response:', data);
    throw new Error('Unexpected TMDB API response - no results');
  }

  return data.results;
}

// Fetch top rated movies from TMDB
async function fetchTopRatedMovies(page = 1) {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
  );
  const data = await response.json();
  return data.results;
}

// Fetch movie details (includes runtime)
async function fetchMovieDetails(movieId) {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
  );
  return response.json();
}

// Fetch movie videos (trailers)
async function fetchMovieVideos(movieId) {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
  );
  const data = await response.json();
  // Find YouTube trailer
  const trailer = data.results?.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  );
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

// Convert TMDB movie to our format
async function convertMovie(tmdbMovie) {
  const details = await fetchMovieDetails(tmdbMovie.id);
  const trailerUrl = await fetchMovieVideos(tmdbMovie.id);

  return {
    tmdb_id: tmdbMovie.id,
    title: tmdbMovie.title,
    overview: tmdbMovie.overview,
    genres: tmdbMovie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean) || [],
    release_date: tmdbMovie.release_date,
    year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split('-')[0]) : null,
    vote_average: tmdbMovie.vote_average,
    vote_count: tmdbMovie.vote_count,
    popularity: tmdbMovie.popularity,
    runtime: details.runtime || null,
    poster_url: tmdbMovie.poster_path ? `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}` : null,
    backdrop_url: tmdbMovie.backdrop_path ? `${TMDB_IMAGE_BASE}${tmdbMovie.backdrop_path}` : null,
    trailer_url: trailerUrl,
    original_language: tmdbMovie.original_language,
    adult: tmdbMovie.adult
  };
}

// Fetch multiple pages of movies
export async function fetchMovies(totalMovies = 1000) {
  const movies = [];
  const seenIds = new Set();
  const pagesNeeded = Math.ceil(totalMovies / 20); // TMDB returns 20 per page

  console.log(`Fetching ${totalMovies} movies from TMDB...`);

  // Fetch from both popular and top rated to get variety
  for (let page = 1; page <= pagesNeeded && movies.length < totalMovies; page++) {
    try {
      // Alternate between popular and top rated
      const popularMovies = await fetchPopularMovies(page);
      const topRatedMovies = await fetchTopRatedMovies(page);

      const allMovies = [...popularMovies, ...topRatedMovies];

      for (const movie of allMovies) {
        if (seenIds.has(movie.id) || movies.length >= totalMovies) continue;
        seenIds.add(movie.id);

        try {
          const converted = await convertMovie(movie);
          movies.push(converted);

          if (movies.length % 50 === 0) {
            console.log(`Fetched ${movies.length}/${totalMovies} movies...`);
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Error converting movie ${movie.title}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
    }
  }

  console.log(`Finished fetching ${movies.length} movies`);
  return movies;
}

// Quick fetch for testing (just basic info, no details/trailers)
export async function fetchMoviesQuick(totalMovies = 100) {
  const movies = [];
  const seenIds = new Set();
  const pagesNeeded = Math.ceil(totalMovies / 20);

  for (let page = 1; page <= pagesNeeded && movies.length < totalMovies; page++) {
    const popularMovies = await fetchPopularMovies(page);

    for (const movie of popularMovies) {
      if (seenIds.has(movie.id) || movies.length >= totalMovies) continue;
      seenIds.add(movie.id);

      movies.push({
        tmdb_id: movie.id,
        title: movie.title,
        overview: movie.overview,
        genres: movie.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean) || [],
        release_date: movie.release_date,
        year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        original_language: movie.original_language,
        adult: movie.adult
      });
    }
  }

  return movies;
}
