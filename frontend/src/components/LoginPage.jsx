import { useState } from 'react';
import theme from '../theme';
import TcgIcon from './TcgIcon';

function LoginPage({ onLogin }) {
  const [accessToken, setAccessToken] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const isLoading = status === 'loading';
  const canSubmit = accessToken.trim().length > 0 && !isLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken.trim()) {
      setError('Ajoute ton token pour continuer.');
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      await onLogin(accessToken.trim());
      setStatus('success');
    } catch (err) {
      setStatus('error');
      if (err.status === 401) {
        setError('Token invalide ou expiré. Vérifie ton accès.');
      } else if (err.status === 400) {
        setError('Ajoute ton token pour continuer.');
      } else {
        setError('Impossible de joindre le radar. Réessaie dans quelques instants.');
      }
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlow} />
      <section style={styles.card}>
        <div style={styles.badge}>Radar collectionneur</div>
        <div style={styles.iconWrap}>
          <TcgIcon name="radar" size={54} />
        </div>
        <h1 style={styles.title}>Vision TCG Radar</h1>
        <p style={styles.subtitle}>
          Ton cockpit pour repérer, suivre et prioriser les cartes Pokémon Wizards FR.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="access-token" style={styles.label}>Token d’accès</label>
          <input
            id="access-token"
            type="password"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="ex: vtr_••••••••"
            disabled={isLoading}
            autoComplete="current-password"
            style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
          />
          <p style={styles.help}>Colle le token fourni pour accéder à ton tableau de bord.</p>

          {error && <div style={styles.error}>{error}</div>}
          {status === 'success' && <div style={styles.success}>Radar prêt. Chargement du dashboard…</div>}

          <button type="submit" disabled={!canSubmit} style={{ ...styles.button, ...(!canSubmit ? styles.buttonDisabled : {}) }}>
            {isLoading ? 'Connexion au radar…' : status === 'error' ? 'Réessayer' : 'Entrer dans le radar'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Données privées — ton espace de suivi collection.</span>
          <span>Un token est nécessaire pour protéger tes suivis de lots et alertes.</span>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    background: `radial-gradient(circle at 20% 20%, rgba(0, 217, 255, 0.12), transparent 28%), linear-gradient(135deg, ${theme.colors.primary.obsidian}, #130F2E 58%, #080B18)`,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.primary,
  },
  backgroundGlow: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)',
    backgroundSize: '42px 42px',
    maskImage: 'radial-gradient(circle at center, black, transparent 72%)',
  },
  card: {
    width: '100%',
    maxWidth: 430,
    position: 'relative',
    zIndex: 1,
    padding: theme.spacing.xxl,
    borderRadius: 24,
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'linear-gradient(180deg, rgba(18, 22, 51, 0.96), rgba(10, 14, 39, 0.94))',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.62), 0 0 36px rgba(0, 217, 255, 0.12)',
  },
  badge: {
    display: 'inline-flex',
    padding: '6px 10px',
    borderRadius: 999,
    color: theme.accents.hunterGold,
    background: 'rgba(230, 184, 92, 0.1)',
    border: '1px solid rgba(230, 184, 92, 0.26)',
    fontSize: theme.typography.sizes.tiny,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  iconWrap: {
    marginTop: theme.spacing.xl,
    color: theme.accents.manaCyan,
  },
  title: {
    margin: `${theme.spacing.md} 0 ${theme.spacing.sm}`,
    fontFamily: theme.typography.fonts.heading,
    fontSize: theme.typography.sizes.headingXl,
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    color: theme.colors.text.secondary,
    lineHeight: 1.55,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.bodySm,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    borderRadius: theme.borders.radiusLg,
    border: '1px solid rgba(148, 163, 184, 0.24)',
    outline: 'none',
    background: 'rgba(10, 14, 39, 0.72)',
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.bodyMd,
    boxShadow: 'inset 0 0 0 1px rgba(0, 217, 255, 0.02)',
  },
  inputError: {
    borderColor: theme.accents.preyRed,
  },
  help: {
    margin: '-4px 0 0',
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.bodySm,
  },
  error: {
    color: '#FCA5A5',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.24)',
    borderRadius: theme.borders.radiusMd,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.bodySm,
  },
  success: {
    color: '#86EFAC',
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.22)',
    borderRadius: theme.borders.radiusMd,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.bodySm,
  },
  button: {
    marginTop: theme.spacing.sm,
    padding: '14px 18px',
    borderRadius: theme.borders.radiusLg,
    border: '1px solid rgba(0, 217, 255, 0.38)',
    background: `linear-gradient(135deg, ${theme.accents.manaCyan}, #38BDF8)`,
    color: '#06111F',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.bodyMd,
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(0, 217, 255, 0.24)',
  },
  buttonDisabled: {
    opacity: 0.52,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTop: '1px solid rgba(148, 163, 184, 0.12)',
    color: theme.colors.text.muted,
    fontSize: theme.typography.sizes.bodySm,
  },
};

export default LoginPage;
