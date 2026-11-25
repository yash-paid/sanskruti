// ============================================================
// ISHIKA'S WORLD — Custom Video Player Types
// ============================================================

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface QualityOption {
  id: string;
  label: string;
  resolution: string;
  isReal: boolean;
  status: 'active' | 'available' | 'simulated';
  badge?: string;
}

export interface AudioTrackOption {
  id: string;
  language: string;
  label: string;
  isOriginal: boolean;
  isAvailable: boolean;
  type: 'original' | 'dubbed';
}

export interface SubtitleTrackOption {
  id: string;
  language: string;
  label: string;
  isAvailable: boolean;
  isDemo?: boolean;
}

export interface SubtitleStyle {
  fontSize: 'sm' | 'md' | 'lg';
  backgroundOpacity: 0 | 50 | 75 | 100;
  position: 'bottom' | 'top';
}

export interface CueItem {
  start: number;
  end: number;
  text: string;
}

export interface PlayerSettingsState {
  speed: PlaybackSpeed;
  quality: string;
  audioTrack: string;
  subtitleTrack: string; // 'off' or track id
  subtitleStyle: SubtitleStyle;
  autoPlayNext: boolean;
}
