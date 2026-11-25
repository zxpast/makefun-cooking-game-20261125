// Recipe and ingredient data for Sizzle & Serve — Warung Rush.
// Every dish is an original warung favourite. An ingredient is raw until it
// has been through its station: chop the fresh things, cook the rest on the
// stove, grill the skewers. A dish is served only when the plate holds
// exactly the dish's finished ingredients, no more and no less.

export const INGREDIENTS = {
  rice:    { id: 'rice',    name: 'Rice',    emoji: '🍚', color: '#f5f0dc', dark: '#cbbf9a', station: 'stove',  cookSecs: 2.0 },
  noodle:  { id: 'noodle',  name: 'Noodle',  emoji: '🍜', color: '#f7c948', dark: '#c79a2e', station: 'stove',  cookSecs: 2.0 },
  egg:     { id: 'egg',     name: 'Egg',     emoji: '🥚', color: '#fff3c4', dark: '#d9b96a', station: 'stove',  cookSecs: 1.6 },
  chilli:  { id: 'chilli',  name: 'Chilli',  emoji: '🌶️', color: '#e8442e', dark: '#a11f10', station: 'chop',   cookSecs: 1.2 },
  veg:     { id: 'veg',     name: 'Veg',     emoji: '🥬', color: '#7dc242', dark: '#4a7d24', station: 'chop',   cookSecs: 1.2 },
  skewer:  { id: 'skewer',  name: 'Skewer',  emoji: '🍢', color: '#d97b2b', dark: '#96501a', station: 'grill',  cookSecs: 2.6 },
};

export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    price: 120,
    needs: ['rice', 'egg', 'chilli'],
    blurb: 'Wok-fried rice, egg & chilli',
  },
  {
    id: 'mie-goreng',
    name: 'Mie Goreng',
    price: 110,
    needs: ['noodle', 'egg', 'veg'],
    blurb: 'Stir-fried noodles, egg & greens',
  },
  {
    id: 'sate-plate',
    name: 'Sate Plate',
    price: 150,
    needs: ['skewer', 'rice', 'chilli'],
    blurb: 'Grilled skewers, rice & chilli',
  },
  {
    id: 'veggie-rice',
    name: 'Veggie Rice',
    price: 100,
    needs: ['rice', 'veg', 'egg'],
    blurb: 'Garden rice, greens & egg',
  },
  {
    id: 'spicy-noodle',
    name: 'Spicy Noodle',
    price: 130,
    needs: ['noodle', 'chilli', 'skewer'],
    blurb: 'Fiery noodles, chilli & skewer',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

export function finishedId(rawId) {
  return `cooked-${rawId}`;
}

export function ingredientLabel(itemId) {
  if (itemId.startsWith('cooked-')) {
    const raw = INGREDIENTS[itemId.slice(7)];
    return raw ? `${raw.name} ✓` : itemId;
  }
  const raw = INGREDIENTS[itemId];
  return raw ? raw.name : itemId;
}

export function ingredientEmoji(itemId) {
  const rawId = itemId.startsWith('cooked-') ? itemId.slice(7) : itemId;
  return INGREDIENTS[rawId]?.emoji ?? '🍽️';
}

export function ingredientColor(itemId) {
  const rawId = itemId.startsWith('cooked-') ? itemId.slice(7) : itemId;
  return INGREDIENTS[rawId]?.color ?? '#cccccc';
}
