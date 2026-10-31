import {
  Brush,
  Car,
  Coffee,
  CreditCard,
  Droplets,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  PiggyBank,
  Plane,
  Receipt,
  Shapes,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Ticket,
  TramFront,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/types';

// Four pale tints so categories are told apart gently; the icon and name carry identity.
const tones = {
  blush: 'bg-[#f1dcd4] text-[#8a6a62]',
  oat: 'bg-[#e8dbc9] text-[#86715a]',
  sage: 'bg-[#dde3d5] text-[#6c7563]',
  mauve: 'bg-[#e4d8e0] text-[#7d6676]',
};

type Tone = keyof typeof tones;

const categories: Record<string, { icon: LucideIcon; tone: Tone }> = {
  Rent: { icon: Home, tone: 'oat' },
  Electricity: { icon: Zap, tone: 'oat' },
  Water: { icon: Droplets, tone: 'sage' },
  Internet: { icon: Wifi, tone: 'mauve' },
  Mobile: { icon: Smartphone, tone: 'blush' },
  Supermarket: { icon: ShoppingBasket, tone: 'oat' },
  'Food & coffee': { icon: Coffee, tone: 'blush' },
  Transport: { icon: TramFront, tone: 'sage' },
  Fuel: { icon: Fuel, tone: 'oat' },
  Car: { icon: Car, tone: 'sage' },
  Health: { icon: HeartPulse, tone: 'mauve' },
  Gym: { icon: Dumbbell, tone: 'sage' },
  Beauty: { icon: Brush, tone: 'blush' },
  Entertainment: { icon: Sparkles, tone: 'mauve' },
  Subscriptions: { icon: CreditCard, tone: 'mauve' },
  Shopping: { icon: ShoppingBag, tone: 'blush' },
  Gifts: { icon: Gift, tone: 'blush' },
  Travel: { icon: Plane, tone: 'sage' },
  Education: { icon: GraduationCap, tone: 'oat' },
  Other: { icon: Shapes, tone: 'oat' },
  // Kept for older expenses; not offered for new ones
  Bills: { icon: Receipt, tone: 'oat' },
  Activities: { icon: Ticket, tone: 'blush' },
  Savings: { icon: PiggyBank, tone: 'sage' },
};

/** How the category picker is laid out. Categories not listed here (custom ones) go under Other. */
export const categoryGroups: { title: string; names: string[] }[] = [
  { title: 'Home & bills', names: ['Rent', 'Electricity', 'Water', 'Internet', 'Mobile'] },
  { title: 'Everyday', names: ['Supermarket', 'Food & coffee', 'Transport'] },
  { title: 'Car', names: ['Fuel', 'Car'] },
  { title: 'Health & you', names: ['Health', 'Gym', 'Beauty'] },
  { title: 'Fun & life', names: ['Entertainment', 'Subscriptions', 'Shopping', 'Gifts', 'Travel'] },
  { title: 'Other', names: ['Education', 'Other'] },
];

const retiredCategories = new Set(['Bills', 'Activities', 'Savings']);

/** Kept only so older expenses keep their category; not offered for new ones. */
export const isRetiredCategory = (name: string) => retiredCategories.has(name);

/**
 * Categories to offer in the picker, grouped. Retired ones are left out unless `keep`
 * names one (the category already selected).
 */
export const groupCategories = (all: Category[], keep?: string) => {
  const byName = new Map(all.map((category) => [category.name, category]));
  const grouped = new Set(categoryGroups.flatMap((group) => group.names));
  const extras = all.filter(
    (category) => !grouped.has(category.name) && (!retiredCategories.has(category.name) || category.name === keep)
  );
  return categoryGroups
    .map((group) => ({
      title: group.title,
      categories: [
        ...group.names.flatMap((name) => byName.get(name) ?? []),
        ...(group.title === 'Other' ? extras : []),
      ],
    }))
    .filter((group) => group.categories.length > 0);
};

const fallbackTones: Tone[] = ['blush', 'oat', 'sage', 'mauve'];

/** Icon and tint for a category. Custom categories get a stable tint from their name. */
export const categoryStyle = (name: string) => {
  const known = categories[name];
  if (known) return { icon: known.icon, chip: tones[known.tone] };
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { icon: Receipt, chip: tones[fallbackTones[hash % fallbackTones.length]] };
};

export const CategoryIcon: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'md' }) => {
  const { icon: Icon, chip } = categoryStyle(name);
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-control';
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center ${chip}`} aria-hidden="true">
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
};
