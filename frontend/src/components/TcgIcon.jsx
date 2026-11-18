import theme from '../theme';

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function SvgIcon({ size = 20, color = 'currentColor', children, style, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color={color}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      {...props}
    >
      {children}
    </svg>
  );
}

const icons = {
  radar: (props) => (
    <SvgIcon {...props}>
      <circle {...base} cx="12" cy="12" r="8" />
      <circle {...base} cx="12" cy="12" r="3" />
      <path {...base} d="M12 12l5.5-3.2" />
      <path {...base} d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </SvgIcon>
  ),
  card: (props) => (
    <SvgIcon {...props}>
      <rect {...base} x="6.5" y="3.5" width="11" height="17" rx="2" />
      <path {...base} d="M9 7h6M9 10h4" />
      <circle {...base} cx="12" cy="15" r="2.4" />
    </SvgIcon>
  ),
  wizards: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M12 21c3.3-1.7 5-4.1 5-7 0-2.7-1.6-5.1-4.2-7.3.2 2.1-.5 3.4-2 4.1.1-2.7-1.1-5-3.5-6.8.3 3.2-.7 5.4-2.1 7.3C3.8 13.1 4 16.9 7 19c1.2.9 2.9 1.6 5 2Z" />
      <path {...base} d="M12 18c1.5-.9 2.2-2 2.2-3.4 0-1.2-.6-2.2-1.7-3.1-.1 1.1-.6 1.9-1.5 2.3-.1-1.2-.7-2.3-1.8-3.2.1 1.9-.5 3-1.1 4.1-.8 1.5.2 3.1 3.9 3.3Z" />
    </SvgIcon>
  ),
  france: (props) => (
    <SvgIcon {...props}>
      <rect {...base} x="4" y="6" width="16" height="12" rx="2" />
      <path {...base} d="M9.3 6v12M14.7 6v12" />
    </SvgIcon>
  ),
  lot: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M4.5 8.5 12 4l7.5 4.5-7.5 4.3-7.5-4.3Z" />
      <path {...base} d="M4.5 8.5V16l7.5 4 7.5-4V8.5" />
      <path {...base} d="M12 12.8V20" />
    </SvgIcon>
  ),
  pin: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
      <circle {...base} cx="12" cy="10" r="2.2" />
    </SvgIcon>
  ),
  spark: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path {...base} d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </SvgIcon>
  ),
  risk: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M12 4 21 20H3L12 4Z" />
      <path {...base} d="M12 9v5" />
      <path {...base} d="M12 17h.01" />
    </SvgIcon>
  ),
  chart: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M5 19V9M12 19V5M19 19v-7" />
      <path {...base} d="M3.5 19.5h17" />
    </SvgIcon>
  ),
  bolt: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M13 2 5 13h6l-1 9 9-13h-6l1-7Z" />
    </SvgIcon>
  ),
  link: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="M9.5 14.5 14.5 9.5" />
      <path {...base} d="M8.8 10.8 7.4 12.2a4 4 0 0 0 5.7 5.6l1.3-1.3" />
      <path {...base} d="M15.2 13.2 16.6 11.8a4 4 0 0 0-5.7-5.6L9.6 7.5" />
    </SvgIcon>
  ),
  watch: (props) => (
    <SvgIcon {...props}>
      <path {...base} d="m12 3 2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.2 6.8 19l1-5.8-4.3-4.1 5.9-.8L12 3Z" />
    </SvgIcon>
  ),
  ignore: (props) => (
    <SvgIcon {...props}>
      <circle {...base} cx="12" cy="12" r="8" />
      <path {...base} d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
    </SvgIcon>
  ),
  contacted: (props) => (
    <SvgIcon {...props}>
      <circle {...base} cx="12" cy="12" r="8" />
      <path {...base} d="m8.5 12.3 2.3 2.3 4.9-5.2" />
    </SvgIcon>
  ),
};

const defaultColors = {
  radar: theme.accents.manaCyan,
  card: theme.accents.hunterGold,
  wizards: theme.accents.hunterGold,
  france: theme.colors.status.rare,
  lot: theme.accents.manaCyan,
  pin: theme.accents.successGreen,
  spark: theme.accents.hunterGold,
  risk: theme.accents.warningOrange,
  chart: theme.accents.successGreen,
  bolt: theme.accents.hunterGold,
  link: theme.accents.manaCyan,
  watch: theme.accents.hunterGold,
  ignore: theme.accents.preyRed,
  contacted: theme.accents.successGreen,
};

export default function TcgIcon({ name, color, ...props }) {
  const Component = icons[name] || icons.spark;
  return <Component color={color || defaultColors[name] || 'currentColor'} {...props} />;
}
