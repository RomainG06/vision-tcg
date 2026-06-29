export function isTransientMarketplaceError(error) {
  const text = `${error?.code || ''} ${error?.name || ''} ${error?.message || error || ''}`;
  return /\b(ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR|ERR_NETWORK|ERR_CONNECTION|ERR_SOCKET|ERR_HTTP2|socket\s+hang\s+up)\b/i.test(text)
    || /network|timeout|timed out|navigation timeout|connection\s+(?:closed|lost|refused|reset)|target closed|browser has disconnected|fetch failed|connexion marketplace impossible/i.test(text);
}
