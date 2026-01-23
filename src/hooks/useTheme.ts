import { useContext } from 'react';
import { ThemeContext } from '../providers/ThemeProvider';

/**
 * Theme Management Hook
 * Consumes the global ThemeContext
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
