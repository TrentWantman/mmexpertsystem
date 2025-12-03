import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedMovie(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Start a new chat session
  const startChat = async () => {
    setIsLoading(true);
    setError(null);
    setMovies([]);
    try {
      const res = await fetch(`${API_BASE}/chat/start`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([{ role: 'assistant', content: data.message }]);
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running.');
      console.error(err);
    }
    setIsLoading(false);
  };

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      if (data.ready && data.movies) {
        setMovies(data.movies);
        // Keep sessionId active so user can continue chatting
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  };

  // Reset and start over
  const resetChat = () => {
    setSessionId(null);
    setMessages([]);
    setMovies([]);
    setError(null);
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            Movie Mood Matcher
          </h1>
          {(sessionId || movies.length > 0) && (
            <button
              onClick={resetChat}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        {/* Welcome Screen */}
        {!sessionId && messages.length === 0 && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
            <div className="text-6xl mb-6">🍿</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Find Your Perfect Movie
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-md">
              Tell me what you're in the mood for, and I'll recommend the perfect movie for tonight.
            </p>
            <button
              onClick={startChat}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-lg shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : "Let's Go!"}
            </button>
            {error && (
              <p className="mt-4 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Chat Interface - always show when there are messages */}
        {messages.length > 0 && (
          <div className={`animate-fade-in ${movies.length > 0 ? 'max-w-6xl mb-8' : 'max-w-2xl'} mx-auto`}>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              {/* Messages */}
              <div className={`${movies.length > 0 ? 'h-[200px]' : 'h-[400px]'} overflow-y-auto p-6 space-y-4`}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-white/10 text-gray-100 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-md">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={movies.length > 0 ? "Not happy with these? Tell me more..." : "Type your response..."}
                    disabled={isLoading || !sessionId}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || !sessionId}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>

            {error && (
              <p className="mt-4 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-center">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Movie Results */}
        {movies.length > 0 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Here are your recommendations!
              </h2>
              <p className="text-gray-400">
                Click on a movie to see more details and watch the trailer
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie, i) => (
                <MovieCard
                  key={movie.id || i}
                  movie={movie}
                  onClick={() => setSelectedMovie(movie)}
                />
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={resetChat}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Find More Movies
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10 px-6 py-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          CIS4930 Expert Systems Project | Movie Mood Matcher
        </div>
      </footer>
    </div>
  );
}

// Movie Card Component
function MovieCard({ movie, onClick }) {
  const year = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const genres = movie.genres?.slice(0, 2).join(', ') || 'Unknown';

  return (
    <div
      className="movie-card bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 cursor-pointer"
      onClick={onClick}
    >
      {/* Poster */}
      <div className="aspect-[2/3] bg-gray-800 relative">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-6xl">
            🎬
          </div>
        )}
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-black/70 text-yellow-400 px-2 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
          <span>⭐</span> {rating}
        </div>
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-medium">View Details</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg leading-tight mb-1 truncate" title={movie.title}>
          {movie.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {year} • {genres}
        </p>
      </div>
    </div>
  );
}

// Movie Detail Modal Component
function MovieModal({ movie, onClose }) {
  const year = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const genres = movie.genres?.join(', ') || 'Unknown';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;

  // Extract YouTube video ID from trailer URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(movie.trailer_url);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>

        {/* Backdrop Image */}
        {movie.backdrop_url && (
          <div className="relative h-64 overflow-hidden rounded-t-2xl">
            <img
              src={movie.backdrop_url}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </div>
        )}

        <div className="p-6 -mt-20 relative">
          <div className="flex gap-6">
            {/* Poster */}
            <div className="flex-shrink-0 w-40 -mt-16">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full rounded-xl shadow-2xl border-4 border-gray-900"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-800 rounded-xl flex items-center justify-center text-4xl">
                  🎬
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-16">
              <h2 className="text-3xl font-bold text-white mb-2">{movie.title}</h2>

              <div className="flex flex-wrap items-center gap-3 text-gray-400 mb-4">
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  ⭐ {rating}
                </span>
                <span>•</span>
                <span>{year}</span>
                {runtime && (
                  <>
                    <span>•</span>
                    <span>{runtime}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres?.map((genre, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {movie.overview && (
                <p className="text-gray-300 leading-relaxed mb-6">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>

          {/* Trailer Section */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Trailer</h3>

            {youtubeId ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={`${movie.title} Trailer`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : movie.trailer_url ? (
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors"
              >
                <span className="text-xl">▶</span>
                Watch Trailer on YouTube
              </a>
            ) : (
              <p className="text-gray-500 italic">No trailer available</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Close
            </button>
            {movie.trailer_url && (
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
              >
                Open in YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
