export function filterByBudget(listings, budgetMax) {
  const max = Number(budgetMax);
  if (!Number.isFinite(max) || max <= 0) {
    return { kept: listings, rejected: [] };
  }

  const kept = [];
  const rejected = [];

  for (const listing of listings) {
    const price = Number(listing.price || 0);
    // Keep unknown price candidates; reject only explicit prices over budget.
    if (price > 0 && price > max) {
      rejected.push(listing);
    } else {
      kept.push(listing);
    }
  }

  return { kept, rejected };
}
