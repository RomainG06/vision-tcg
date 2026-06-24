import baseCards from './cards/base.json';
import jungleCards from './cards/jungle.json';
import fossilCards from './cards/fossil.json';
import rocketCards from './cards/rocket.json';

export const TARGET_SERIES_OPTIONS = [
  { value: 'base', label: 'Set de Base' },
  { value: 'jungle', label: 'Jungle' },
  { value: 'fossil', label: 'Fossile' },
  { value: 'rocket', label: 'Team Rocket' },
];

export const SERIES_CARD_TARGETS = {
  base: baseCards,
  jungle: jungleCards,
  fossil: fossilCards,
  rocket: rocketCards,
};

export function canSelectCardsForSeries(series) {
  return Boolean(series && series !== 'all' && SERIES_CARD_TARGETS[series]?.length);
}

export function getCardsForSeries(series) {
  return SERIES_CARD_TARGETS[series] || [];
}

export function getTargetSeriesLabel(series) {
  return TARGET_SERIES_OPTIONS.find(option => option.value === series)?.label || '';
}
