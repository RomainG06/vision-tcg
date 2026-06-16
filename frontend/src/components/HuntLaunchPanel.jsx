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
  prudent: { label: 'Prudent', maxResults: 5, hint: 'Moins de bruit, meilleures certitudes.' },
  balanced: { label: 'Équilibré', maxResults: 10, hint: 'Bon compromis pour le MVP.' },
  aggressive: { label: 'Agressif', maxResults: 20, hint: 'Plus de pistes, plus de faux positifs.' },
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

function HuntLaunchPanel({ onHuntComplete, onViewResults, hasResults }) {
  const [series, setSeries] = useState('all');
  const [budget, setBudget] = useState(1500);
  const [sensitivity, setSensitivity] = useState('balanced');
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
        filters: { series, budget: Number(budget) || 1500, sensitivity },
      };
      let data;
      try {
        data = await startScrape(scrapeOptions);
      } catch (scrapeError) {
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
      setSummary({
        found,
        saved: latestRun.results_count ?? found,
        updated: 0,
        sources: latestRun.source || 'historique',
      });
      setStatus('success');
      setStep(`${data.warning ? 'Dernier scan disponible' : 'Scan terminé'} : ${latestRun.source || 'source inconnue'} · ${found} résultat${found > 1 ? 's' : ''}`);
      if (data.warning) setError(`Live scrape bloqué : ${data.warning}`);
      await onHuntComplete?.({
        ...data,
        stats: {
          ...data.stats,
          filtered: found,
        },
      });
    } catch (err) {
      setError(err.message);
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

          {summary && (
            <div style={styles.summary}>
              <span>{summary.found} pistes détectées</span>
              <span>{summary.saved} nouvelles, {summary.updated} mises à jour</span>
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
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    border: `1px solid ${theme.accents.successGreen}40`,
    borderRadius: theme.borders.radiusMd,
    color: theme.accents.successGreen,
    background: `${theme.accents.successGreen}10`,
    fontSize: theme.typography.sizes.bodySm,
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
