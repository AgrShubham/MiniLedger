import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  useColorScheme,
  Animated,
  Platform,
  UIManager,
  LayoutAnimation,
  Easing,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppTheme, ThemeColors, darkColors, lightColors, getTheme, theme as defaultTheme } from '../utils/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AnimatedColors = {
  [K in keyof ThemeColors]: Animated.AnimatedInterpolation<string>;
};

interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  themeAnimation: Animated.Value;
  animatedColors: AnimatedColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const STORAGE_KEY = 'user_theme_mode';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Generate animated interpolations for every color token
function createAnimatedColors(themeAnimation: Animated.Value): AnimatedColors {
  const keys = Object.keys(darkColors) as (keyof ThemeColors)[];
  const result: Partial<AnimatedColors> = {};

  for (const key of keys) {
    result[key] = themeAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [lightColors[key], darkColors[key]],
    });
  }

  return result as AnimatedColors;
}

const initialAnimationValue = new Animated.Value(1);
const defaultAnimatedColors = createAnimatedColors(initialAnimationValue);

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  themeMode: 'system',
  isDark: true,
  themeAnimation: initialAnimationValue,
  animatedColors: defaultAnimatedColors,
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  
  // Default is 'system', adapting automatically to device's OS theme
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Initialize animated value to match current system theme
  const initialIsDark = systemColorScheme === 'dark';
  const themeAnimation = useRef(new Animated.Value(initialIsDark ? 1 : 0)).current;
  const animatedColors = useMemo(() => createAnimatedColors(themeAnimation), [themeAnimation]);

  // Restore stored preference on boot; defaults to 'system' if not explicitly set
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
          const activeIsDark = stored === 'system' ? systemColorScheme === 'dark' : stored === 'dark';
          themeAnimation.setValue(activeIsDark ? 1 : 0);
        } else {
          // No prior stored choice: automatically adapt to system theme
          setThemeModeState('system');
          themeAnimation.setValue(systemColorScheme === 'dark' ? 1 : 0);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const theme = getTheme(isDark);

  // React smoothly when the OS system theme changes (if in 'system' mode)
  useEffect(() => {
    if (themeMode === 'system') {
      const nextIsDark = systemColorScheme === 'dark';

      LayoutAnimation.configureNext({
        duration: 320,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });

      Animated.timing(themeAnimation, {
        toValue: nextIsDark ? 1 : 0,
        duration: 320,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [systemColorScheme, themeMode]);

  const setThemeMode = async (mode: ThemeMode) => {
    const nextIsDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';

    // 1. Native LayoutAnimation for smooth layout/text blending
    LayoutAnimation.configureNext({
      duration: 320,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    // 2. Continuous color interpolation animation
    Animated.timing(themeAnimation, {
      toValue: nextIsDark ? 1 : 0,
      duration: 320,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Apple-like smooth cubic curve
      useNativeDriver: false,
    }).start();

    setThemeModeState(mode);

    try {
      await SecureStore.setItemAsync(STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  };

  const toggleTheme = async () => {
    // If current mode is dark (either explicitly or via system), switch to light; and vice versa
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDark,
        themeAnimation,
        animatedColors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
