/**
 * Badge Component - Display opportunity/risk signals
 * Hunting Dashboard Design System
 */

import theme, { badgeLabels } from '../theme';
import TcgIcon from './TcgIcon';

const Badge = ({ signal, customText, icon }) => {
  // Use predefined badge config or custom
  const config = badgeLabels[signal] || {
    text: customText || signal,
    color: theme.accents.hunterGold,
    icon: icon || 'spark',
  };

  const styles = {
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      backgroundColor: `${config.color}20`, // 20% opacity
      border: `${theme.borders.widthThin} solid ${config.color}`,
      borderRadius: theme.borders.radiusSm,
      fontSize: theme.typography.sizes.tiny,
      fontWeight: theme.typography.weights.semibold,
      color: config.color,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
    },
  };

  return (
    <span style={styles.badge}>
      {config.icon && <TcgIcon name={config.icon} size={13} color={config.color} />}
      <span>{config.text}</span>
    </span>
  );
};

export default Badge;
