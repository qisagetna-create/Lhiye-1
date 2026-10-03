export type IconType =
  | 'whatsapp'
  | 'instagram'
  | 'telegram'
  | 'youtube'
  | 'website'
  | 'location'
  | 'phone'
  | 'video'
  | 'shopping'
  | 'facebook'
  | 'tiktok'
  | 'mail'
  | 'music'
  | 'globe'
  | 'link'
  | 'twitter'
  | 'github'
  | 'linkedin';

export interface LinkItem {
  id: string;
  title: string;
  subtitle?: string; // Optional secondary text e.g. "Mehsullar"
  url: string;
  icon: IconType;
  visible: boolean;
  order: number;
  clicks: number;
}

export interface SectionItem {
  id: string;
  title: string;
  order: number;
  links: LinkItem[];
}

export type AvatarShape = 'circle' | 'rounded';
export type AvatarFit = 'contain' | 'cover';
export type LogoMode = 'text' | 'image';
export type VerifiedBadgeType = 'blue' | 'gold' | 'white';

export interface ProfileData {
  logoMode: LogoMode; // 'text' (Yazılı Loqo) | 'image' (Şəkil / Fayl)
  avatarUrl: string;
  avatarShape: AvatarShape;
  avatarFit: AvatarFit;
  avatarZoom: number; // 30% to 250% (default 100)
  avatarPosX: number; // -100 to 100 (percentage offset)
  avatarPosY: number; // -100 to 100 (percentage offset)
  monogramText: string; // Text-based golden monogram/logo
  name: string; // @username
  displayName: string; // Header golden shimmering display name
  description: string; // Bio
  verified: boolean;
  verifiedBadgeType?: VerifiedBadgeType; // 'blue' | 'gold' | 'white'
  avatarBg?: string;
  footerText?: string;
  avatarVersion?: number;
  updatedAt?: string;
}

export type ThemePresetKey =
  | 'black_gold'
  | 'pure_black'
  | 'cyber_emerald'
  | 'midnight_navy'
  | 'burgundy_classic';

export interface ThemeConfig {
  presetName: string;
  bgType: 'color' | 'gradient' | 'image';
  bgColor: string;
  gradientStart: string;
  gradientMid?: string; // Middle glow color
  gradientEnd: string;
  gradientAngle: number;
  bgImageUrl: string;
  cardBg: string;
  cardBorderColor: string;
  cardBorderWidth: number; // in px e.g. 3 or 4
  cardRadius: number; // in px e.g. 12, 20, 999
  cardRadiusPreset: 'square' | 'rounded' | 'oval';
  cardGlassBlur: number; // 0 for none, 4-24px for glassmorphism
  cardGlassOpacity: number; // 0.1 - 1
  accentGoldColor: string; // Accent color
  textColor: string;
  iconColor: string;
  moreIconColor: string;
  sectionTitleColor: string;
  profileNameColor: string;
  profileDescColor: string;
}

export interface AppConfig {
  profile: ProfileData;
  theme: ThemeConfig;
  sections: SectionItem[];
}
