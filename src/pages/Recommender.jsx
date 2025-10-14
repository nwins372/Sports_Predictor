// Sample sports game data
const games = [
  { id: 1, title: "Lakers vs Celtics", sport: "Basketball", popularity: 92 },
  { id: 2, title: "Patriots vs Jets", sport: "Football", popularity: 87 },
  { id: 3, title: "Yankees vs Red Sox", sport: "Baseball", popularity: 90 },
  { id: 4, title: "Barcelona vs Real Madrid", sport: "Soccer", popularity: 95 },
  { id: 5, title: "Warriors vs Clippers", sport: "Basketball", popularity: 89 },
];

// Turn text into a simple vector representation (bag-of-words)
function textToVector(text) {
  const words = text.toLowerCase().split(/\W+/);
  const freq = {};
  words.forEach((word) => {
    if (word) freq[word] = (freq[word] || 0) + 1;
  });
  return freq;
}

// Compute cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const allWords = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0,
    magA = 0,
    magB = 0;
  allWords.forEach((word) => {
    const a = vecA[word] || 0;
    const b = vecB[word] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Build recommendation system
function recommendGames(favoriteTitle, num = 3) {
  const favoriteGame = games.find((g) => g.title === favoriteTitle);
  if (!favoriteGame) {
    console.log("Game not found.");
    return [];
  }

  const favVector = textToVector(favoriteGame.sport + " " + favoriteGame.title);

  const scores = games
    .filter((g) => g.id !== favoriteGame.id)
    .map((g) => {
      const gVector = textToVector(g.sport + " " + g.title);
      const similarity = cosineSimilarity(favVector, gVector);
      return { title: g.title, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return scores.slice(0, num);
}

// Example use
const liked = "Lakers vs Celtics";
const recs = recommendGames(liked);

console.log(`Since you liked "${liked}", you might also enjoy:`);
recs.forEach((r) => console.log("-", r.title));

