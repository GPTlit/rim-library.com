import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  title?: string;
}

/**
 * Meta / Instagram style verified badge (blue scalloped rosette with white checkmark).
 * Rendered as pure inline SVG so it scales crisply, loads instantly, and never breaks or 404s.
 */
export const VerifiedBadge = ({ className, title = 'حساب موثّق' }: Props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block h-5 w-5 shrink-0 align-middle select-none', className)}
    role="img"
    aria-label={title}
  >
    {/* Meta / Instagram 12-point scalloped starburst rosette in official Meta blue */}
    <path
      d="M10.52 2.44a2 2 0 0 1 2.96 0l.73.78a2 2 0 0 0 1.54.64h1.07a2 2 0 0 1 2 2v1.07c0 .58.25 1.14.68 1.54l.74.73a2 2 0 0 1 0 2.96l-.74.73a2 2 0 0 0-.68 1.54v1.07a2 2 0 0 1-2 2h-1.07a2 2 0 0 0-1.54.64l-.73.78a2 2 0 0 1-2.96 0l-.73-.78a2 2 0 0 0-1.54-.64H8.48a2 2 0 0 1-2-2v-1.07a2 2 0 0 0-.68-1.54l-.74-.73a2 2 0 0 1 0-2.96l.74-.73a2 2 0 0 0 .68-1.54V6.93a2 2 0 0 1 2-2h1.07a2 2 0 0 0 1.54-.64l.73-.78Z"
      fill="#0095F6"
    />
    {/* Crisp white checkmark */}
    <path
      d="m8.8 12 2.2 2.2 4.4-4.4"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
