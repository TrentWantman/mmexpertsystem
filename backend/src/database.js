import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Converts a movie title like "Paddington 2" into a slug "paddington-2"
function titleToSlug(title) {
  return title.toLowerCase().replace(/\s+/g, '-');
}

export async function getMovieByTitle(title) {
  const movieSlug = titleToSlug(title);
  const movieRef = db.collection('movies').doc(movieSlug);
  const doc = await movieRef.get();

  if (!doc.exists) {
    console.log('No such document!');
    return null;
  } else {
    return doc.data();
  }
}
