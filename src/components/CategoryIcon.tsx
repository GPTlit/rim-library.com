import {
  BookOpen, Landmark, FlaskConical, ScrollText, Brain, MessageSquareQuote,
  Baby, GraduationCap, Feather, Sprout, Wand2, Rocket, Ghost, Skull,
  Search as SearchIcon, Heart, Swords, Map, Crosshair, Drama, Smile, Bot,
  Mountain, MoonStar, Spade, Orbit, Eye, Home as HomeIcon, Tv, Biohazard,
  Tent, User as UserIcon, Footprints, Building2, Radiation, Cog, Cpu,
  Medal, Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  novels: BookOpen,
  religion: Landmark,
  science: FlaskConical,
  history: ScrollText,
  psychology: Brain,
  philosophy: MessageSquareQuote,
  kids: Baby,
  school: GraduationCap,
  poetry: Feather,
  'self-help': Sprout,
  fantasy: Wand2,
  'sci-fi': Rocket,
  horror: Ghost,
  thriller: Skull,
  crime: SearchIcon,
  romance: Heart,
  'historical-fiction': Swords,
  adventure: Map,
  action: Crosshair,
  drama: Drama,
  comedy: Smile,
  robots: Bot,
  mythic: Mountain,
  'dark-fantasy': MoonStar,
  'dark-humor': Spade,
  'cosmic-horror': Orbit,
  supernatural: Eye,
  'uncanny-valley': Drama,
  'gothic-horror': HomeIcon,
  'analog-horror': Tv,
  zombies: Biohazard,
  survival: Tent,
  biography: UserIcon,
  mystery: Footprints,
  dystopia: Building2,
  apocalyptic: Radiation,
  steampunk: Cog,
  cyberpunk: Cpu,
  military: Medal,
  sports: Trophy,
};

export const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = MAP[name] ?? BookOpen;
  return <Icon className={className} />;
};