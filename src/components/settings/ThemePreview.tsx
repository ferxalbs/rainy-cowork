import { Sparkles, Zap, Heart, Star } from 'lucide-react';
import type { Theme, ThemeMode } from '../../types/theme';

interface ThemePreviewProps {
  theme: Theme;
  mode: ThemeMode;
}

/**
 * Theme Preview Component
 * Shows a live preview of how the theme looks with sample UI elements
 */
export function ThemePreview({ theme, mode }: ThemePreviewProps) {
  const colors = theme.colors[mode];

  return (
    <div
      className="rounded-2xl p-6 space-y-4 border-2 transition-all"
      style={{
        background: colors.background,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{theme.icon}</span>
          <div>
            <h3 className="font-semibold" style={{ color: colors.foreground }}>
              {theme.displayName}
            </h3>
            <p className="text-xs" style={{ color: colors.mutedForeground }}>
              {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="size-3 rounded-full" style={{ background: colors.primary }} />
          <div className="size-3 rounded-full" style={{ background: colors.accent }} />
          <div className="size-3 rounded-full" style={{ background: colors.secondary }} />
        </div>
      </div>

      {/* Sample Card */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: colors.card,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: colors.primary }} />
          <span className="text-sm font-medium" style={{ color: colors.cardForeground }}>
            Sample Card
          </span>
        </div>
        <p className="text-xs" style={{ color: colors.mutedForeground }}>
          This is how your content will look with this theme applied.
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{
              background: colors.primary,
              color: colors.primaryForeground,
            }}
          >
            Primary
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{
              background: colors.secondary,
              color: colors.secondaryForeground,
            }}
          >
            Secondary
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{
              background: colors.accent,
              color: colors.accentForeground,
            }}
          >
            Accent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, label: 'Active', color: colors.primary },
          { icon: Heart, label: 'Favorite', color: colors.accent },
          { icon: Star, label: 'Featured', color: colors.secondary },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-lg p-2 text-center"
            style={{ background: colors.muted }}
          >
            <stat.icon className="size-4 mx-auto mb-1" style={{ color: stat.color }} />
            <p className="text-xs" style={{ color: colors.mutedForeground }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-center" style={{ color: colors.mutedForeground }}>
        {theme.description}
      </p>
    </div>
  );
}
