'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Gauge,
  Sliders,
  Languages,
  Subtitles,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  PlayerSettingsState,
  PlaybackSpeed,
  SubtitleStyle,
} from '@/types/player';

interface PlayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettingsState;
  onChangeSettings: (newSettings: Partial<PlayerSettingsState>) => void;
}

type SettingsSubmenu =
  | 'main'
  | 'quality'
  | 'speed'
  | 'audio'
  | 'subtitles'
  | 'subtitleStyle';

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
}) => {
  const [currentMenu, setCurrentMenu] = useState<SettingsSubmenu>('main');

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-16 right-4 sm:bottom-20 sm:right-6 z-50 w-72 sm:w-80 rounded-2xl glass border border-rose/30 shadow-2xl p-4 text-xs space-y-3 bg-[#0a0a0f]/95 backdrop-blur-xl animate-fadeIn text-foreground"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ===================== 1. MAIN MENU ===================== */}
      {currentMenu === 'main' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="font-bold text-sm tracking-wide text-foreground flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-rose" />
              <span>Playback Settings</span>
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {/* Quality Row */}
            <button
              onClick={() => setCurrentMenu('quality')}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 text-secondary group-hover:text-foreground">
                <Sliders className="w-4 h-4 text-rose" />
                <span>Quality</span>
              </div>
              <div className="flex items-center gap-1 text-muted group-hover:text-rose-light">
                <span className="font-semibold text-[11px]">{settings.quality}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Speed Row */}
            <button
              onClick={() => setCurrentMenu('speed')}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 text-secondary group-hover:text-foreground">
                <Gauge className="w-4 h-4 text-gold" />
                <span>Playback Speed</span>
              </div>
              <div className="flex items-center gap-1 text-muted group-hover:text-gold-light">
                <span className="font-semibold text-[11px]">
                  {settings.speed === 1 ? 'Normal (1x)' : `${settings.speed}x`}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Audio Track Row */}
            <button
              onClick={() => setCurrentMenu('audio')}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 text-secondary group-hover:text-foreground">
                <Languages className="w-4 h-4 text-emerald-400" />
                <span>Audio &amp; Dubbing</span>
              </div>
              <div className="flex items-center gap-1 text-muted group-hover:text-emerald-300">
                <span className="font-semibold text-[11px]">Original (Hindi)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Subtitles Row */}
            <button
              onClick={() => setCurrentMenu('subtitles')}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2 text-secondary group-hover:text-foreground">
                <Subtitles className="w-4 h-4 text-blue-400" />
                <span>Subtitles / CC</span>
              </div>
              <div className="flex items-center gap-1 text-muted group-hover:text-blue-300">
                <span className="font-semibold text-[11px] uppercase">
                  {settings.subtitleTrack}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Subtitle Appearance */}
            {settings.subtitleTrack !== 'off' && (
              <button
                onClick={() => setCurrentMenu('subtitleStyle')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-2 text-secondary group-hover:text-foreground">
                  <Sparkles className="w-4 h-4 text-rose-light" />
                  <span>Subtitle Appearance</span>
                </div>
                <div className="flex items-center gap-1 text-muted group-hover:text-rose-light">
                  <span className="font-semibold text-[11px]">Custom</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            )}

            {/* Autoplay Next Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl border-t border-border/40 mt-1 pt-2">
              <span className="text-secondary font-medium">Autoplay Next Video</span>
              <button
                onClick={() =>
                  onChangeSettings({ autoPlayNext: !settings.autoPlayNext })
                }
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  settings.autoPlayNext ? 'bg-rose' : 'bg-surface border border-border'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoPlayNext ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 2. QUALITY SUBMENU ===================== */}
      {currentMenu === 'quality' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setCurrentMenu('main')}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-foreground">Video Quality</span>
          </div>

          <div className="space-y-1">
            {/* Real Playable Source */}
            <button
              onClick={() => {
                onChangeSettings({ quality: 'Auto (360p Original)' });
                setCurrentMenu('main');
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <span>Auto (360p Standard)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                    ACTIVE REAL SOURCE
                  </span>
                </div>
                <p className="text-[10px] text-secondary">
                  Active local 5-minute HD MP4 stream
                </p>
              </div>
              <Check className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Simulated Tiers clearly labeled */}
            <div className="pt-2 pb-1 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Simulated Quality Options (Phase 2 Ingest)</span>
              </span>
            </div>

            {[
              { res: '2160p 4K', note: 'Requires 4K Cloudflare Stream ingest' },
              { res: '1440p 2K', note: 'High bitrate master source' },
              { res: '1080p Full HD', note: 'Studio 60fps master' },
              { res: '720p HD', note: 'Standard web stream' },
              { res: '480p Medium', note: 'Low data usage' },
            ].map((q) => (
              <div
                key={q.res}
                className="w-full flex items-center justify-between p-2 rounded-xl text-muted/60 opacity-60 cursor-not-allowed border border-border/20"
                title="Only actual local playable source is available right now."
              >
                <div>
                  <div className="font-semibold text-xs text-muted flex items-center gap-1.5">
                    <span>{q.res}</span>
                    <span className="text-[8px] bg-white/10 px-1.5 py-0.2 rounded uppercase">
                      Simulated
                    </span>
                  </div>
                  <p className="text-[9px] text-muted/70">{q.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 3. SPEED SUBMENU ===================== */}
      {currentMenu === 'speed' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setCurrentMenu('main')}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-foreground">Playback Speed</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {PLAYBACK_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChangeSettings({ speed: s });
                  setCurrentMenu('main');
                }}
                className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                  settings.speed === s
                    ? 'bg-gradient-to-r from-rose to-rose-dark text-white font-bold shadow-md shadow-rose/25'
                    : 'bg-surface/60 hover:bg-white/10 text-secondary hover:text-white'
                }`}
              >
                <span>{s === 1 ? '1x (Normal)' : `${s}x`}</span>
                {settings.speed === s && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 4. AUDIO & DUBBING SUBMENU ===================== */}
      {currentMenu === 'audio' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setCurrentMenu('main')}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-foreground">
              Audio Track &amp; Dubbing
            </span>
          </div>

          <div className="space-y-2">
            {/* Actual Real Track */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>Original Audio (Hindi)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    ACTIVE TRACK
                  </span>
                </div>
                <p className="text-[10px] text-secondary">
                  Narrated and voiced by Ishika (Stereo 44.1kHz AAC)
                </p>
              </div>
              <Check className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Architecture Ready: Future Dubbing Notice */}
            <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-gold font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Future AI Dubbing Architecture</span>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                Platform is built ready for multi-track audio integration. Additional languages will unlock here as actual master tracks are produced.
              </p>
              <div className="space-y-1 pt-1 opacity-60">
                <div className="flex items-center justify-between py-1 border-t border-white/5 text-[10px]">
                  <span>English (Voice AI Dub)</span>
                  <span className="text-[9px] text-muted italic">Phase 2 Planned</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-white/5 text-[10px]">
                  <span>Bengali (Voice AI Dub)</span>
                  <span className="text-[9px] text-muted italic">Phase 2 Planned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 5. SUBTITLES SUBMENU ===================== */}
      {currentMenu === 'subtitles' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setCurrentMenu('main')}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-foreground">Subtitles / CC</span>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'off', label: 'Off', desc: 'No subtitles rendered' },
              {
                id: 'hi',
                label: 'हिंदी (Original Audio Narration)',
                desc: 'ईशिका के बोले गए लाइव ओरिजिनल डायलॉग्स',
              },
              {
                id: 'en',
                label: 'English (Synchronized Captions)',
                desc: 'Accurately synchronized English translation',
              },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  onChangeSettings({ subtitleTrack: sub.id });
                  setCurrentMenu('main');
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                  settings.subtitleTrack === sub.id
                    ? 'bg-rose/20 border border-rose text-white font-bold'
                    : 'bg-surface/50 hover:bg-white/10 text-secondary hover:text-white'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-xs">{sub.label}</div>
                  <p className="text-[10px] text-muted">{sub.desc}</p>
                </div>
                {settings.subtitleTrack === sub.id && (
                  <Check className="w-3.5 h-3.5 text-rose-light" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 6. SUBTITLE APPEARANCE ===================== */}
      {currentMenu === 'subtitleStyle' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setCurrentMenu('main')}
              className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-foreground">Subtitle Style</span>
          </div>

          {/* Size */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-secondary">Font Size</span>
            <div className="grid grid-cols-3 gap-1">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() =>
                    onChangeSettings({
                      subtitleStyle: { ...settings.subtitleStyle, fontSize: sz },
                    })
                  }
                  className={`py-1.5 rounded-lg font-bold text-xs capitalize ${
                    settings.subtitleStyle.fontSize === sz
                      ? 'bg-rose text-white'
                      : 'bg-surface text-secondary hover:text-white'
                  }`}
                >
                  {sz === 'sm' ? 'Small' : sz === 'md' ? 'Medium' : 'Large'}
                </button>
              ))}
            </div>
          </div>

          {/* Background Opacity */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-secondary">
              Background Box
            </span>
            <div className="grid grid-cols-4 gap-1">
              {([0, 50, 75, 100] as const).map((op) => (
                <button
                  key={op}
                  onClick={() =>
                    onChangeSettings({
                      subtitleStyle: {
                        ...settings.subtitleStyle,
                        backgroundOpacity: op,
                      },
                    })
                  }
                  className={`py-1.5 rounded-lg font-bold text-[11px] ${
                    settings.subtitleStyle.backgroundOpacity === op
                      ? 'bg-rose text-white'
                      : 'bg-surface text-secondary hover:text-white'
                  }`}
                >
                  {op}%
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-secondary">Position</span>
            <div className="grid grid-cols-2 gap-1">
              {(['bottom', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() =>
                    onChangeSettings({
                      subtitleStyle: { ...settings.subtitleStyle, position: pos },
                    })
                  }
                  className={`py-1.5 rounded-lg font-bold text-xs capitalize ${
                    settings.subtitleStyle.position === pos
                      ? 'bg-rose text-white'
                      : 'bg-surface text-secondary hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
