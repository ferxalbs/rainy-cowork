import { Button, Avatar, Switch, Label } from "@heroui/react";
import { Settings, Moon, Sun, CloudRain } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
    onSettingsClick?: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check system preference on mount
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(prefersDark);
        document.documentElement.classList.toggle("dark", prefersDark);
    }, []);

    const toggleTheme = (selected: boolean) => {
        setIsDark(selected);
        document.documentElement.classList.toggle("dark", selected);
    };

    return (
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md">
            {/* App Title */}
            <div className="flex items-center gap-2">
                <CloudRain className="size-6 text-primary" />
                <h1 className="text-lg font-semibold tracking-tight">Rainy Cowork</h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <div className="flex items-center gap-2">
                    <Sun className="size-4 text-muted-foreground" />
                    <Switch
                        isSelected={isDark}
                        onChange={toggleTheme}
                        size="sm"
                        aria-label="Toggle dark mode"
                    >
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                    </Switch>
                    <Moon className="size-4 text-muted-foreground" />
                </div>

                {/* Settings Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onPress={onSettingsClick}
                    aria-label="Open settings"
                >
                    <Settings className="size-4" />
                </Button>

                {/* User Avatar */}
                <Avatar size="sm">
                    <Avatar.Fallback>RC</Avatar.Fallback>
                </Avatar>
            </div>
        </header>
    );
}
