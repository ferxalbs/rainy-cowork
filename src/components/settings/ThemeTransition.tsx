import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeTransitionProps {
  isChanging: boolean;
  themeName: string;
  themeIcon: string;
}

/**
 * Theme Transition Animation
 * Shows a smooth animation when switching themes
 */
export function ThemeTransition({
  isChanging,
  themeName,
  themeIcon,
}: ThemeTransitionProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isChanging) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isChanging]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-card/95 backdrop-blur-xl border-2 border-primary/20 rounded-3xl px-8 py-6"
          >
            <div className="flex items-center gap-4">
              <motion.span
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="text-5xl"
              >
                {themeIcon}
              </motion.span>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground"
                >
                  Theme Changed
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-xl font-bold text-foreground"
                >
                  {themeName}
                </motion.h3>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
