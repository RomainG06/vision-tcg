import { useState } from 'react';
import theme from '../theme';
import TcgIcon from './TcgIcon';
import { fetchScrapeRuns, startScrape } from '../services/api';

const SERIES_OPTIONS = [
  { value: 'all', label: 'Toutes Wizards FR' },
  { value: 'base', label: 'Set de Base' },
  { value: 'jungle', label: 'Jungle' },
  { value: 'fossil', label: 'Fossile' },
  { value: 'rocket', label: 'Team Rocket' },
];

const SENSITIVITY = {
  prudent: { label: 'Prudent', maxResults: 5, maxQueries: 12, hint: 'Moins de bruit, meilleures certitudes.' },
  balanced: { label: 'Équilibré', maxResults: 10, maxQueries: 23, hint: 'Bon compromis pour le MVP.' },
  aggressive: { label: 'Agressif', maxResults: 20, maxQueries: 45, hint: 'Plus de pistes, plus de faux positifs.' },
};

const statusCopy = {
  idle: {
    badge: 'Radar prêt',
    title: 'Configure ta cible.',
    text: 'Le scan compare les annonces actives aux signaux de prix connus.',
  },
  running: {
    badge: 'Scan en cours',
    title: 'Radar actif',
    text: 'Analyse des annonces Wizards FR en cours. Les pistes faibles sont ignorées.',
  },
  success: {
    badge: 'Opportunités détectées',
    title: 'Chasse terminée',
    text: 'Des annonces semblent intéressantes par rapport au marché observé.',
  },
  error: {
    badge: 'Scan interrompu',
    title: 'Analyse incomplète',
    text: 'Le radar n’a pas pu récupérer ou comparer toutes les annonces.',
  },
};

const REJECTION_LABELS = {
  noise_detected: 'Bruit détecté',
  missing_wizards_or_french_signal: 'Signal Wizards/FR manquant',
  score_below_threshold: 'Score trop faible',
  over_budget: 'Hors budget',
  series_mismatch: 'Hors série ciblée',
  listing_type_mismatch: 'Type d’annonce non conforme',
  non_pokemon_domain: 'Hors domaine Pokémon/cartes',
  off_target_modern: 'Moderne/off-target',
  already_seen: 'Déjà vue',
  duplicate: 'Doublon grille',
  invalid_url: 'URL invalide',
  selected: 'Sélectionnée',
  invalid_listing: 'Annonce invalide',
  quality_filtered: 'Qualité insuffisante',
  unknown: 'Raison inconnue',
};

const RISK_LABELS = {
  modern_detected: 'moderne',
  accessory_detected: 'accessoire',
  foreign_language_detected: 'langue étrangère',
  fake_detected: 'fake/proxy',
  energy_bulk_detected: 'énergies',
  toy_detected: 'jouet',
  over_budget: 'hors budget',
};

const SIGNAL_LABELS = {
  wizards_detected: 'Wizards',
  french_edition: 'FR/VF',
  lot_detected: 'lot',
  premium_card_detected: 'rare/holo',
};

function labelFrom(map, value) {
  return map[value] || value;
}

function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return 'prix ?';
  return `${Number(price).toFixed(2).replace('.00', '')} €`;
}

function getFriendlyScrapeError(message = '') {
  const text = String(message);
  if (/Missing X server|\$DISPLAY|Failed to launch the browser process/i.test(text)) {
    return 'Chromium n’a pas pu démarrer. Ferme les anciens Chrome/Puppeteer puis relance le backend.';
  }
  if (/captcha|datadome|blocked|forbidden|403/i.test(text)) {
    return 'Vinted semble bloquer le scan. Réessaie plus tard, réduis la sensibilité ou résous le challenge si une fenêtre s’ouvre.';
  }
  if (/network|timeout|ERR_|ECONN|fetch/i.test(text)) {
    return 'Connexion marketplace instable. Vérifie internet puis relance avec une sensibilité plus basse.';
  }
  return text || 'Le scan n’a pas pu se terminer. Réessaie avec moins de requêtes.';
}

function getSummaryAdvice(summary) {
  const saved = Number(summary?.actionable?.funnel?.saved_or_updated ?? summary?.saved ?? 0);
  const seenExcluded = Number(summary?.seenExcluded ?? 0);
  const budgetFiltered = Number(summary?.budgetFiltered ?? 0);
  const qualityFiltered = Number(summary?.qualityFiltered ?? 0);

  if (saved > 0) return 'Priorité MVP : ouvre les meilleures cartes, mets en Watchlist celles à contacter, puis marque les autres comme Vu ou Ignoré.';
  if (seenExcluded > 0 && !summary?.rescanSeen) return 'Aucune nouvelle piste : beaucoup d’annonces ont déjà été analysées. Active “Ré-analyser les déjà vues” pour recalibrer avec le scoring actuel.';
  if (budgetFiltered > 0) return 'Aucune piste gardée : plusieurs annonces semblent hors budget. Augmente le budget ou filtre une série moins chère.';
  if (qualityFiltered > 0) return 'Aucune piste gardée : le radar a surtout vu du bruit ou des annonces hors série. Essaie le mode Agressif ou Toutes Wizards FR.';
  return 'Aucune piste exploitable pour l’instant. Relance plus tard ou élargis la série ciblée.';
}

function FunnelMetric({ label, value, highlight = false }) {
  return (
    <div style={{ ...styles.funnelMetric, ...(highlight ? styles.funnelMetricHighlight : {}) }}>
      <strong>{Number(value || 0)}</strong>
      <span>{label}</span>
    </div>
  );
}

const LISTING_TYPE_OPTIONS = {
  cards: {
    label: 'Cartes',
    hint: 'Cartes seules ou annonces sans signal lot explicite.',
  },
  lot: {
    label: 'Lot',
    hint: 'Strict : seulement lots, collections, classeurs, vrac ou nombre de cartes explicite.',
  },
};

function HuntLaunchPanel({ onHuntComplete, onViewResults, hasResults }) {
  const [series, setSeries] = useState('all');
  const [listingType, setListingType] = useState('cards');
  const [budget, setBudget] = useState(1500);
  const [sensitivity, setSensitivity] = useState('balanced');
  const [rescanSeen, setRescanSeen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [status, setStatus] = useState('idle');
  const [step, setStep] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const copy = statusCopy[status];
  const isRunning = status === 'running';

  const startHunt = async () => {
    setStatus('running');
    setError(null);
    setSummary(null);
    setStep('Lecture du dernier scan disponible');

    try {
      const startedAt = Date.now();
      const scrapeOptions = {
        profile: 'wizards-fr',
        sources: ['vinted'],
        maxResults: SENSITIVITY[sensitivity].maxResults,
        saveToDb: true,
        filters: { series, listingType, budget: Number(budget) || 1500, sensitivity, maxQueries: SENSITIVITY[sensitivity].maxQueries, rescanSeen },
      };
      let data;
      try {
        data = await startScrape(scrapeOptions);
      } catch (scrapeError) {
        if (scrapeError.status === 409) {
          setStatus('error');
          setStep('Une chasse est déjà en cours');
          setError(getFriendlyScrapeError(scrapeError.message));
          return;
        }

        // Keep the UI usable if the marketplace blocks the live scrape.
        // The error is surfaced, but we also load the last successful run when available.
        const history = await fetchScrapeRuns();
        if (!history.runs?.length) throw scrapeError;
        data = {
          ...history,
          warning: scrapeError.message,
          stats: {
            ...history.stats,
            filtered: history.stats?.total_results ?? history.runs?.[0]?.results_count ?? 0,
          },
        };
      }

      // Keep the radar visible long enough to feel intentional, without wasting API calls.
      const elapsed = Date.now() - startedAt;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      setStep('Classement des meilleures pistes');

      const latestRun = data.runs?.[0] || { source: data.sources?.join(', ') || 'live-scrape', results_count: data.stats?.found ?? data.listings?.length ?? 0 };

      const found = data.stats?.filtered ?? data.stats?.total_results ?? data.stats?.found ?? latestRun.results_count ?? 0;
      const actionableSummary = data.actionable_summary || data.stats?.actionable_summary || null;
      setSummary({
        found,
        saved: data.stats?.saved ?? latestRun.results_count ?? found,
        updated: data.stats?.updated ?? 0,
        qualityFiltered: data.stats?.quality_filtered ?? 0,
        budgetFiltered: data.stats?.budget_filtered ?? 0,
        explorationFallback: data.stats?.exploration_fallback ?? 0,
        knownBeforeScan: data.stats?.known_before_scan ?? 0,
        seenExcluded: data.stats?.seen_excluded ?? 0,
        seenRecorded: data.stats?.seen_recorded ?? 0,
        rawFound: data.stats?.raw_found ?? 0,
        selectedForDetails: data.stats?.selected_for_details ?? actionableSummary?.funnel?.selected_for_details ?? 0,
        fetchedDetails: data.stats?.fetched_details ?? actionableSummary?.funnel?.details_fetched ?? 0,
        queriesCount: data.stats?.queries_count ?? data.queries?.length ?? 0,
        queryStats: actionableSummary?.query_performance ?? data.query_stats ?? data.stats?.query_stats ?? [],
        rejectedSamples: data.rejected_samples ?? [],
        actionable: actionableSummary,
        rescanSeen: data.stats?.rescan_seen ?? rescanSeen,
        sources: latestRun.source || 'historique',
      });
      setStatus('success');
      setStep(`${data.warning ? 'Dernier scan disponible' : 'Scan terminé'} : ${latestRun.source || 'source inconnue'} · ${found} résultat${found > 1 ? 's' : ''}`);
      if (data.warning) setError(getFriendlyScrapeError(data.warning));
      await onHuntComplete?.({
        ...data,
        stats: {
          ...data.stats,
          filtered: found,
        },
      });
    } catch (err) {
      setError(getFriendlyScrapeError(err.message));
      setStatus('error');
      setStep('Historique de scan indisponible');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setSummary(null);
    setStep('');
  };

  return (
    <section className="hunt-panel" style={styles.panel}>
      <style>{css}</style>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Lancer une chasse</h2>
          <p style={styles.subtitle}>Détecte les annonces sous-cotées sur les cartes Pokémon Wizards FR.</p>
        </div>
        <span style={{ ...styles.statusBadge, ...getStatusStyle(status) }}>
          <TcgIcon name={status === 'error' ? 'risk' : status === 'success' ? 'contacted' : 'radar'} size={15} />
          {copy.badge}
        </span>
      </div>

      <div className="hunt-layout" style={styles.layout}>
        <div style={styles.radarColumn}>
          <div className={`hunt-radar ${isRunning ? 'is-running' : ''}`}>
            <span className="radar-cross radar-cross-x" />
            <span className="radar-cross radar-cross-y" />
            {(isRunning || status === 'success') && (
              <>
                <span className="radar-dot dot-a" />
                <span className="radar-dot dot-b" />
                <span className="radar-dot dot-c" />
              </>
            )}
          </div>
          <div style={styles.radarCopy}>
            <strong style={styles.radarTitle}>{copy.title}</strong>
            <span style={styles.radarText}>{copy.text}</span>
            {step && <span style={styles.step}>{step}</span>}
            {error && <span style={styles.errorText}>{error}</span>}
          </div>
        </div>

        <div style={styles.controls}>
          <label style={styles.field}>
            <span style={styles.label}>Série ciblée</span>
            <select value={series} onChange={(e) => setSeries(e.target.value)} style={styles.select} disabled={isRunning}>
              {SERIES_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div style={styles.field}>
            <span style={styles.label}>Type d’annonce</span>
            <div style={styles.segmented}>
              {Object.entries(LISTING_TYPE_OPTIONS).map(([value, option]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setListingType(value)}
                  disabled={isRunning}
                  style={{
                    ...styles.segmentButton,
                    ...(listingType === value ? styles.segmentButtonActive : {}),
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span style={styles.hint}>{LISTING_TYPE_OPTIONS[listingType].hint}</span>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Budget max</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="1"
              max="1500"
              style={styles.input}
              disabled={isRunning}
            />
          </label>

          <div style={styles.field}>
            <span style={styles.label}>Sensibilité radar</span>
            <div style={styles.segmented}>
              {Object.entries(SENSITIVITY).map(([value, option]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSensitivity(value)}
                  disabled={isRunning}
                  style={{
                    ...styles.segmentButton,
                    ...(sensitivity === value ? styles.segmentButtonActive : {}),
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span style={styles.hint}>{SENSITIVITY[sensitivity].hint}</span>
          </div>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={rescanSeen}
              onChange={(e) => setRescanSeen(e.target.checked)}
              disabled={isRunning}
            />
            <span>
              Ré-analyser les déjà vues
              <small>Utile après recalibrage du score, sans effacer la mémoire.</small>
            </span>
          </label>

          {summary && (
            <div style={styles.summary}>
              <div className="hunt-summary-header" style={styles.summaryHeader}>
                <strong>{summary.actionable?.headline || `${summary.found} pistes détectées`}</strong>
                <span>{summary.sources}</span>
              </div>

              {summary.actionable?.alerts?.length > 0 && (
                <div style={styles.alertList}>
                  {summary.actionable.alerts.map(alert => (
                    <span key={alert} style={styles.alertChip}>⚠ {alert}</span>
                  ))}
                </div>
              )}

              {summary.actionable?.suggestions?.length > 0 && (
                <div style={styles.suggestionBox}>
                  {summary.actionable.suggestions.map(suggestion => (
                    <span key={suggestion}>💡 {suggestion}</span>
                  ))}
                </div>
              )}

              <div style={styles.nextStepBox}>
                <strong>Prochaine action</strong>
                <span>{getSummaryAdvice(summary)}</span>
                {summary.seenExcluded > 0 && !summary.rescanSeen && (
                  <button
                    type="button"
                    style={styles.inlineActionButton}
                    onClick={() => setRescanSeen(true)}
                    disabled={isRunning}
                  >
                    Activer la ré-analyse au prochain scan
                  </button>
                )}
              </div>

              <div className="hunt-funnel" style={styles.funnelGrid}>
                <FunnelMetric label="Brutes" value={summary.actionable?.funnel?.raw_found ?? summary.rawFound} />
                <FunnelMetric label="Sélectionnées" value={summary.actionable?.funnel?.selected_for_details ?? summary.selectedForDetails} />
                <FunnelMetric label="Détails" value={summary.actionable?.funnel?.details_fetched ?? summary.fetchedDetails} />
                <FunnelMetric label="Après budget" value={summary.actionable?.funnel?.after_budget ?? Math.max(0, summary.rawFound - summary.budgetFiltered)} />
                <FunnelMetric label="Qualifiées" value={summary.actionable?.funnel?.kept_after_quality ?? summary.found} />
                <FunnelMetric label="Sauvegardées" value={summary.actionable?.funnel?.saved_or_updated ?? (summary.saved + summary.updated)} highlight />
              </div>

              <div style={styles.summaryLines}>
                {summary.queriesCount > 0 && <span>{summary.queriesCount} requêtes intelligentes lancées</span>}
                <span>{summary.saved} nouvelles, {summary.updated} mises à jour</span>
                {summary.budgetFiltered > 0 && <span>{summary.budgetFiltered} hors budget</span>}
                {summary.qualityFiltered > 0 && <span>{summary.qualityFiltered} écartées qualité/série</span>}
                {summary.explorationFallback > 0 && <span>{summary.explorationFallback} candidats larges gardés pour revue</span>}
                {summary.knownBeforeScan > 0 && <span>{summary.knownBeforeScan} déjà sauvegardées ignorées</span>}
                {summary.seenExcluded > 0 && <span>{summary.seenExcluded} déjà analysées ignorées</span>}
                {summary.seenRecorded > 0 && <span>{summary.seenRecorded} décisions mémorisées</span>}
              </div>

              {summary.actionable?.rejection_reasons && Object.keys(summary.actionable.rejection_reasons).length > 0 && (
                <div style={styles.reasonPanel}>
                  <strong>Pourquoi ça sort du radar</strong>
                  <div style={styles.reasonList}>
                    {Object.entries(summary.actionable.rejection_reasons).slice(0, 5).map(([reason, count]) => (
                      <span key={reason} style={styles.reasonChip}>{labelFrom(REJECTION_LABELS, reason)} · {count}</span>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" onClick={() => setShowTechnicalDetails(v => !v)} style={styles.detailsToggle}>
                {showTechnicalDetails ? 'Masquer les détails techniques' : 'Voir les détails techniques'}
              </button>
            </div>
          )}

          {showTechnicalDetails && summary?.queryStats?.length > 0 && (
            <div style={styles.queryPanel}>
              <div style={styles.queryHeader}>
                <strong>Requêtes intelligentes</strong>
                <span>{summary.queryStats.length} exécutée{summary.queryStats.length > 1 ? 's' : ''}</span>
              </div>
              <div style={styles.queryList}>
                {summary.queryStats.slice(0, 6).map((item, index) => (
                  <div key={`${item.source}-${item.query}-${index}`} style={styles.queryItem}>
                    <span style={styles.queryText}>“{item.query}”</span>
                    <span style={styles.queryMeta}>
                      {item.raw_found ?? 0} brutes · {item.selected_for_details ?? 0} sélectionnées · {item.fetched_details ?? 0} détails · {item.cumulative_unique ?? 0} uniques cumulées{item.error ? ` · erreur: ${item.error}` : ''}
                    </span>
                    {item.prefilter_summary && (
                      <span style={styles.queryMeta}>
                        Préfiltre: {Object.entries(item.prefilter_summary)
                          .filter(([key, value]) => key !== 'total' && Number(value) > 0)
                          .map(([key, value]) => `${labelFrom(REJECTION_LABELS, key)} ${value}`)
                          .join(' · ') || 'aucun rejet'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showTechnicalDetails && summary?.rejectedSamples?.length > 0 && (
            <div style={styles.rejectedPanel}>
              <div style={styles.rejectedHeader}>
                <strong>Annonces écartées — debug</strong>
                <span>{summary.rejectedSamples.length} exemple{summary.rejectedSamples.length > 1 ? 's' : ''}</span>
              </div>
              <div style={styles.rejectedList}>
                {summary.rejectedSamples.slice(0, 5).map((item, index) => (
                  <a
                    key={`${item.external_id || item.url || item.title}-${index}`}
                    href={item.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.rejectedItem}
                  >
                    <span style={styles.rejectedTitle}>{item.title}</span>
                    <span style={styles.rejectedMeta}>
                      {formatPrice(item.price)} · score {item.score ?? 0} · {labelFrom(REJECTION_LABELS, item.rejection_reason)}
                    </span>
                    {(item.risks?.length > 0 || item.signals?.length > 0) && (
                      <span style={styles.rejectedTags}>
                        {item.risks?.slice(0, 3).map(risk => (
                          <em key={risk} style={styles.riskTag}>⚠ {labelFrom(RISK_LABELS, risk)}</em>
                        ))}
                        {item.signals?.slice(0, 3).map(signal => (
                          <em key={signal} style={styles.signalTag}>✓ {labelFrom(SIGNAL_LABELS, signal)}</em>
                        ))}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="hunt-actions" style={styles.actions}>
            <button
              type="button"
              onClick={startHunt}
              disabled={isRunning}
              style={{ ...styles.primaryButton, ...(isRunning ? styles.buttonDisabled : {}) }}
            >
              <TcgIcon name={isRunning ? 'radar' : 'radar'} size={17} />
              {isRunning ? 'Chasse en cours…' : status === 'success' ? 'Relancer la chasse' : 'Lancer la chasse'}
            </button>
            {(status === 'success' || hasResults) && (
              <button type="button" onClick={onViewResults} style={styles.secondaryButton}>
                <TcgIcon name="spark" size={16} /> Voir les pistes
              </button>
            )}
            {status === 'error' && (
              <button type="button" onClick={reset} style={styles.secondaryButton}>Modifier les critères</button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function getStatusStyle(status) {
  if (status === 'running') return { color: theme.accents.manaCyan, borderColor: `${theme.accents.manaCyan}66` };
  if (status === 'success') return { color: theme.accents.successGreen, borderColor: `${theme.accents.successGreen}66` };
  if (status === 'error') return { color: theme.accents.preyRed, borderColor: `${theme.accents.preyRed}66` };
  return { color: theme.accents.hunterGold, borderColor: `${theme.accents.hunterGold}55` };
}

const css = `
  .hunt-radar {
    position: relative;
    width: min(240px, 68vw);
    aspect-ratio: 1;
    border-radius: 50%;
    background:
      radial-gradient(circle, transparent 24%, rgba(0,217,255,.14) 25%, transparent 26%),
      radial-gradient(circle, transparent 49%, rgba(0,217,255,.11) 50%, transparent 51%),
      radial-gradient(circle, transparent 74%, rgba(0,217,255,.08) 75%, transparent 76%),
      #0A0E27;
    border: 1px solid rgba(0,217,255,.28);
    box-shadow: 0 0 24px rgba(0,217,255,.12), inset 0 0 32px rgba(0,217,255,.08);
    overflow: hidden;
  }
  .hunt-radar::before {
    content: '';
    position: absolute;
    inset: 50% 50% 0 0;
    transform-origin: 100% 0%;
    background: linear-gradient(45deg, rgba(0,217,255,.45), rgba(0,217,255,.12), transparent 70%);
    opacity: .25;
    animation: radarSweep 2.4s linear infinite;
    animation-play-state: paused;
  }
  .hunt-radar.is-running::before { opacity: 1; animation-play-state: running; }
  .radar-cross { position:absolute; background: rgba(0,217,255,.14); }
  .radar-cross-x { top:50%; left:0; right:0; height:1px; }
  .radar-cross-y { left:50%; top:0; bottom:0; width:1px; }
  .radar-dot { position:absolute; width:7px; height:7px; border-radius:999px; background:#E6B85C; box-shadow:0 0 12px rgba(230,184,92,.85); }
  .dot-a { top:28%; left:62%; }
  .dot-b { top:57%; left:38%; }
  .dot-c { top:70%; left:71%; }
  @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @media (max-width: 760px) {
    .hunt-panel { padding: 16px !important; }
    .hunt-layout { grid-template-columns: 1fr !important; }
    .hunt-actions { flex-direction: column !important; }
    .hunt-actions button { width: 100% !important; }
    .hunt-funnel { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 520px) {
    .hunt-summary-header { align-items: flex-start !important; flex-direction: column !important; }
    .hunt-funnel { grid-template-columns: 1fr !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hunt-radar::before { animation: none; opacity: .2; }
  }
`;

const styles = {
  panel: {
    background: `linear-gradient(135deg, ${theme.colors.primary.deepDark}, ${theme.colors.primary.midnight})`,
    border: `1px solid ${theme.accents.hunterGold}2E`,
    borderRadius: theme.borders.radiusLg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
    boxShadow: `${theme.shadows.lg}, inset 0 0 32px rgba(0,217,255,0.04)`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: theme.typography.sizes.headingLg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    margin: `${theme.spacing.sm} 0 0`,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.bodyMd,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: '1px solid',
    borderRadius: theme.borders.radiusMd,
    background: 'rgba(10,14,39,.45)',
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 0.9fr) minmax(280px, 1.1fr)',
    gap: theme.spacing.xxl,
    alignItems: 'center',
  },
  radarColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  radarCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    textAlign: 'center',
    maxWidth: '360px',
  },
  radarTitle: { color: theme.accents.hunterGold, fontSize: theme.typography.sizes.bodyLg },
  radarText: { color: theme.colors.text.secondary, fontSize: theme.typography.sizes.bodyMd, lineHeight: 1.45 },
  step: { color: theme.accents.manaCyan, fontSize: theme.typography.sizes.bodySm, marginTop: theme.spacing.xs },
  errorText: { color: theme.accents.preyRed, fontSize: theme.typography.sizes.bodySm, marginTop: theme.spacing.xs },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  },
  select: inputBase(),
  input: inputBase(),
  segmented: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing.sm,
  },
  segmentButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: 'rgba(10,14,39,.35)',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    fontWeight: theme.typography.weights.semibold,
  },
  segmentButtonActive: {
    color: theme.accents.hunterGold,
    borderColor: `${theme.accents.hunterGold}99`,
    background: `${theme.accents.hunterGold}14`,
  },
  hint: { color: theme.colors.text.muted, fontSize: theme.typography.sizes.bodySm },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    color: theme.colors.text.secondary,
    background: 'rgba(10,14,39,.28)',
    fontSize: theme.typography.sizes.bodySm,
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    border: `1px solid ${theme.accents.successGreen}40`,
    borderRadius: theme.borders.radiusMd,
    color: theme.colors.text.secondary,
    background: `${theme.accents.successGreen}10`,
    fontSize: theme.typography.sizes.bodySm,
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    color: theme.accents.successGreen,
    alignItems: 'center',
  },
  alertList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  alertChip: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.borders.radiusSm,
    border: `1px solid ${theme.accents.warningOrange}55`,
    color: theme.accents.warningOrange,
    background: `${theme.accents.warningOrange}12`,
    fontSize: theme.typography.sizes.tiny,
  },
  suggestionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.borders.radiusSm,
    border: `1px solid ${theme.accents.manaCyan}35`,
    color: theme.colors.text.secondary,
    background: `${theme.accents.manaCyan}0D`,
    lineHeight: 1.4,
  },
  nextStepBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borders.radiusMd,
    border: `1px solid ${theme.accents.hunterGold}45`,
    color: theme.colors.text.secondary,
    background: `${theme.accents.hunterGold}10`,
    lineHeight: 1.45,
  },
  inlineActionButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borders.radiusSm,
    border: `1px solid ${theme.accents.hunterGold}66`,
    background: `${theme.accents.hunterGold}18`,
    color: theme.accents.hunterGold,
    cursor: 'pointer',
    fontWeight: theme.typography.weights.semibold,
  },
  detailsToggle: {
    alignSelf: 'flex-start',
    border: 'none',
    background: 'transparent',
    color: theme.accents.manaCyan,
    cursor: 'pointer',
    padding: 0,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
  },
  funnelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: theme.spacing.sm,
  },
  funnelMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusSm,
    background: 'rgba(10,14,39,.32)',
  },
  funnelMetricHighlight: {
    borderColor: `${theme.accents.successGreen}66`,
    background: `${theme.accents.successGreen}12`,
  },
  summaryLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  reasonPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTop: `1px solid ${theme.colors.primary.slate}`,
  },
  reasonList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  reasonChip: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.borders.radiusSm,
    border: `1px solid ${theme.accents.preyRed}35`,
    color: theme.colors.text.secondary,
    background: `${theme.accents.preyRed}0D`,
    fontSize: theme.typography.sizes.tiny,
  },
  queryPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    border: `1px solid ${theme.accents.manaCyan}35`,
    borderRadius: theme.borders.radiusMd,
    background: `${theme.accents.manaCyan}0D`,
  },
  queryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.bodySm,
  },
  queryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  queryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusSm,
    background: 'rgba(10,14,39,.36)',
  },
  queryText: {
    color: theme.accents.manaCyan,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
  },
  queryMeta: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.sizes.tiny,
  },
  rejectedPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    border: `1px solid ${theme.accents.preyRed}35`,
    borderRadius: theme.borders.radiusMd,
    background: `${theme.accents.preyRed}0D`,
  },
  rejectedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.bodySm,
  },
  rejectedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  rejectedItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusSm,
    background: 'rgba(10,14,39,.42)',
    color: theme.colors.text.primary,
    textDecoration: 'none',
  },
  rejectedTitle: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
  },
  rejectedMeta: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.sizes.tiny,
  },
  rejectedTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  riskTag: {
    fontStyle: 'normal',
    color: theme.accents.preyRed,
    fontSize: theme.typography.sizes.tiny,
  },
  signalTag: {
    fontStyle: 'normal',
    color: theme.accents.successGreen,
    fontSize: theme.typography.sizes.tiny,
  },
  actions: {
    display: 'flex',
    gap: theme.spacing.md,
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    background: `linear-gradient(135deg, ${theme.accents.hunterGold}, ${theme.accents.manaCyan})`,
    color: theme.colors.primary.obsidian,
    fontWeight: theme.typography.weights.bold,
    cursor: 'pointer',
    boxShadow: `0 0 18px ${theme.accents.hunterGold}33`,
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: 'transparent',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: .7,
    cursor: 'not-allowed',
  },
};

function inputBase() {
  return {
    width: '100%',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: theme.colors.primary.obsidian,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.bodyMd,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

export default HuntLaunchPanel;
