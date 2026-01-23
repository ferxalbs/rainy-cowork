import { useState } from 'react';
import { Button, Card } from '@heroui/react';
import { Sun, Moon, Palette } from 'lucide-react';
import { themes } from '../../lib/themes';
import { ThemePreview } from './ThemePreview';
import type { ThemeMode } from '../../types/theme';

/**
 * Theme Showcase Component
 * Visual demonstration of all themes in both light and dark modes
 * Useful for testing and showcasing the theme system
 */
export function ThemeShowcase() {
  const [previewMode, setPreviewMode] = useState<ThemeMode>('light');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Palette className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Theme Showcase</h2>
              <p className="text-sm text-muted-foreground">
                Preview all {Object.keys(themes).length} themes in both light and dark modes
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={previewMode === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => setPreviewMode('light')}
            >
              <Sun className="size-4" />
              Light
            </Button>
            <Button
              variant={previewMode === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => setPreviewMode('dark')}
            >
              <Moon className="size-4" />
              Dark
            </Button>
          </div>
        </div>
      </Card>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.values(themes).map((theme) => (
          <ThemePreview
            key={`${theme.name}-${previewMode}`}
            theme={theme}
            mode={previewMode}
          />
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-accent/5 border-accent/20">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Palette className="size-5 text-accent" />
            About the Theme System
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>4 Unique Themes:</strong> Each with carefully crafted color palettes
            </p>
            <p>
              • <strong>Perfect Adaptation:</strong> Every theme works beautifully in both light and dark modes
            </p>
            <p>
              • <strong>OKLCH Colors:</strong> Modern color space for better perception and accessibility
            </p>
            <p>
              • <strong>Dynamic Switching:</strong> Change themes instantly without page reload
            </p>
            <p>
              • <strong>Persistent:</strong> Your theme preference is saved automatically
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
