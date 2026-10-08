// Quote card visual presets. Gradients/colors here are design DATA for the
// quote-card canvas (not component styling), per project convention.
export interface BackgroundPreset {
  id: string;
  label: { ar: string; en: string; fr: string };
  css: string; // CSS background value
  textColor: string; // default text color for this background
}

export const backgroundPresets: BackgroundPreset[] = [
  {
    id: 'coffee-1',
    label: { ar: 'قهوة داكنة', en: 'Dark Coffee', fr: 'Café foncé' },
    css: 'linear-gradient(135deg, #3b2418 0%, #5c3a24 50%, #2a1810 100%)',
    textColor: '#f5e6cf',
  },
  {
    id: 'coffee-2',
    label: { ar: 'كراميل', en: 'Caramel', fr: 'Caramel' },
    css: 'linear-gradient(135deg, #a9703f 0%, #7a4a26 60%, #4a2a14 100%)',
    textColor: '#fff7ea',
  },
  {
    id: 'paper',
    label: { ar: 'ورق قديم', en: 'Old Paper', fr: 'Vieux papier' },
    css: "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.04) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(0,0,0,0.03) 0, transparent 45%), linear-gradient(135deg, #f3e8d0 0%, #e8d9b8 100%)",
    textColor: '#3a2a16',
  },
  {
    id: 'dark',
    label: { ar: 'داكن', en: 'Dark', fr: 'Sombre' },
    css: 'linear-gradient(160deg, #141414 0%, #050505 100%)',
    textColor: '#f3f3f3',
  },
  {
    id: 'gold',
    label: { ar: 'ذهبي', en: 'Gold', fr: 'Or' },
    css: 'linear-gradient(135deg, #e8cf94 0%, #c8a65c 60%, #a9833a 100%)',
    textColor: '#2a1d08',
  },
  {
    id: 'forest',
    label: { ar: 'أخضر', en: 'Forest', fr: 'Forêt' },
    css: 'linear-gradient(135deg, #1f3d2b 0%, #0f2016 100%)',
    textColor: '#eef5ee',
  },
  {
    id: 'plain-white',
    label: { ar: 'أبيض', en: 'White', fr: 'Blanc' },
    css: '#ffffff',
    textColor: '#1a1a1a',
  },
  {
    id: 'plain-black',
    label: { ar: 'أسود', en: 'Black', fr: 'Noir' },
    css: '#000000',
    textColor: '#ffffff',
  },
];

export interface FontOption {
  id: string;
  label: string;
  family: string;
}

export const fontOptions: FontOption[] = [
  { id: 'tajawal', label: 'Tajawal', family: "'Tajawal', sans-serif" },
  { id: 'amiri', label: 'Amiri', family: "'Amiri', serif" },
  { id: 'cairo', label: 'Cairo', family: "'Cairo', sans-serif" },
  { id: 'lateef', label: 'Lateef', family: "'Lateef', cursive" },
  { id: 'reem', label: 'Reem Kufi', family: "'Reem Kufi', sans-serif" },
];

export const OCR_LANGUAGES = [
  { id: 'ara', label: 'العربية' },
  { id: 'eng', label: 'English' },
  { id: 'fra', label: 'Français' },
];
