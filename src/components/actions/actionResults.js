let currentResults = null;

export function captureActionResult(value) {
  if (currentResults && value && typeof value.then === 'function') currentResults.add(value);
  return value;
}

export function collectActionResults(callback) {
  const previous = currentResults, results = new Set();
  currentResults = results;
  try {
    const result = callback();
    captureActionResult(result);
    return { result, results: [...results] };
  } finally {
    currentResults = previous;
  }
}