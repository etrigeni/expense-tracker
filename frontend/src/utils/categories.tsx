import {
  Brush,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  PiggyBank,
  Plane,
  Receipt,
  Shapes,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Ticket,
  TramFront,
  Truck,
  type LucideIcon,
} from 'lucide-react';

// Four pale tints so categories are told apart gently; the icon and name carry identity.
const tones = {
  blush: 'bg-[#f1dcd4] text-[#8a6a62]',
  oat: 'bg-[#e8dbc9] text-[#86715a]',
  sage: 'bg-[#dde3d5] text-[#6c7563]',
  mauve: 'bg-[#e4d8e0] text-[#7d6676]',
};

type Tone = keyof typeof tones;

const categories: Record<string, { icon: LucideIcon; tone: Tone }> = {
  Bills: { icon: Receipt, tone: 'oat' },
  'Food/Coffee': { icon: Coffee, tone: 'blush' },
  Food: { icon: Coffee, tone: 'blush' },
  Delivery: { icon: Truck, tone: 'blush' },
  Transport: { icon: TramFront, tone: 'sage' },
  'House rent': { icon: Home, tone: 'oat' },
  Car: { icon: Car, tone: 'sage' },
  Health: { icon: HeartPulse, tone: 'mauve' },
  Shopping: { icon: ShoppingBag, tone: 'blush' },
  Aesthetics: { icon: Brush, tone: 'mauve' },
  Gym: { icon: Dumbbell, tone: 'sage' },
  Subscriptions: { icon: CreditCard, tone: 'mauve' },
  Supermarket: { icon: ShoppingBasket, tone: 'oat' },
  Entertainment: { icon: Sparkles, tone: 'mauve' },
  Savings: { icon: PiggyBank, tone: 'sage' },
  Travel: { icon: Plane, tone: 'sage' },
  Activities: { icon: Ticket, tone: 'blush' },
  Education: { icon: GraduationCap, tone: 'oat' },
  Other: { icon: Shapes, tone: 'oat' },
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
