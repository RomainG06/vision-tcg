export function filterByBudget(listings, budget = {}) {
  const range = typeof budget === 'object' && budget !== null
    ? budget
    : { max: budget };
  const min = Number(range.min ?? range.minimum ?? range.minPrice ?? range.min_price);
  const max = Number(range.max ?? range.maximum ?? range.maxPrice ?? range.max_price);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) {
    return { kept: listings, rejected: [] };
  }

  const kept = [];
  const rejected = [];

  for (const listing of listings) {
    const price = Number(listing.price || 0);
    // Keep unknown price candidates; reject only explicit prices outside range.
    if (price > 0 && ((hasMin && price < min) || (hasMax && price > max))) {
      rejected.push(listing);
    } else {
      kept.push(listing);
    }
  }

  return { kept, rejected };
}
