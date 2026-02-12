import { Button } from "@heroui/react";
import { Sun, Moon, Sparkles, Check } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import type { ThemeName } from "../../types/theme";

/**
 * Theme Selector Component
 * Beautiful UI for switching between themes and modes
 */
export function ThemeSelector() {
  const {
    theme: currentTheme,
    mode,
    setTheme,
    toggleMode,
    themes,
  } = useTheme();

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Appearance Mode
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between light and dark mode
            </p>
          </div>
          {/* Mode Toggle - iOS Segmented Control Style */}
          <div className="flex bg-background/40 p-1 rounded-full border border-border/20 backdrop-blur-sm shadow-inner transition-all hover:bg-background/50">
            <Button
              size="sm"
              variant="ghost"
              className={`rounded-full h-7 px-4 text-xs font-medium transition-all duration-300 ${
                mode === "light"
                  ? "bg-background/20 text-foreground shadow-sm scale-100"
                  : "bg-transparent text-muted-foreground/70 hover:text-foreground scale-95 hover:scale-100"
              }`}
              onPress={() => mode !== "light" && toggleMode()}
            >
              <Sun
                className={`size-3.5 mr-1.5 ${mode === "light" ? "text-amber-500 fill-amber-500" : ""}`}
              />
              Light
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`rounded-full h-7 px-4 text-xs font-medium transition-all duration-300 ${
                mode === "dark"
                  ? "bg-background text-foreground shadow-sm scale-100"
                  : "bg-transparent text-muted-foreground/70 hover:text-foreground scale-95 hover:scale-100"
              }`}
              onPress={() => mode !== "dark" && toggleMode()}
            >
              <Moon
                className={`size-3.5 mr-1.5 ${mode === "dark" ? "text-indigo-400 fill-indigo-400" : ""}`}
              />
              Dark
            </Button>
          </div>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Theme Style</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose your favorite theme style
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {themes.map((themeOption) => {
            const isActive = currentTheme === themeOption.name;
            const colors = themeOption.colors[mode];

            return (
              <button
                key={themeOption.name}
                onClick={() => setTheme(themeOption.name as ThemeName)}
                className={`
                  relative group
                  rounded-2xl p-4 text-left
                  transition-all duration-200
                  border-2
                  ${
                    isActive
                      ? "border-primary scale-[1.02]"
                      : "border-border hover:border-primary/50 hover:scale-[1.01]"
                  }
                `}
                style={{
                  background: colors.card,
                }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3 size-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="size-4 text-primary-foreground" />
                  </div>
                )}

                {/* Theme Preview */}
                <div className="space-y-3">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{themeOption.icon}</span>
                    <div>
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: colors.foreground }}
                      >
                        {themeOption.displayName}
                      </h4>
                      <p
                        className="text-xs"
                        style={{ color: colors.mutedForeground }}
                      >
                        {themeOption.description}
                      </p>
                    </div>
                  </div>

                  {/* Color Preview Dots */}
                  <div className="flex gap-2">
                    <div
                      className="size-8 rounded-full border-2 border-white/20"
                      style={{ background: colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="size-8 rounded-full border-2 border-white/20"
                      style={{ background: colors.accent }}
                      title="Accent"
                    />
                    <div
                      className="size-8 rounded-full border-2 border-white/20"
                      style={{ background: colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="size-8 rounded-full border-2 border-white/20"
                      style={{ background: colors.muted }}
                      title="Muted"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="p-4 space-y-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Preview</h4>
          <div className="flex gap-2">
            <div className="size-3 rounded-full bg-primary" />
            <div className="size-3 rounded-full bg-accent" />
            <div className="size-3 rounded-full bg-secondary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This is how your interface will look with the selected theme. All
          colors adapt perfectly to {mode} mode.
        </p>
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
        </div>
      </div>
    </div>
  );
}
