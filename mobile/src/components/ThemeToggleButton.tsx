import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Easing,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react-native';

interface ThemeToggleButtonProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  style,
  size = 18,
}) => {
  const { isDark, toggleTheme, animatedColors, theme } = useTheme();

  // Animation values for rotation and scale bounce
  const rotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: isDark ? 1 : 0,
        duration: 350,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Gentle overshoot spring
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.82,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [isDark]);

  // Interpolate rotation: 0 (light) -> 0deg, 1 (dark) -> 180deg
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Crossfade opacity between Sun and Moon
  const sunOpacity = rotateAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  });

  const moonOpacity = rotateAnim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={toggleTheme}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: animatedColors.surfaceMuted,
            borderColor: animatedColors.border,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        <Animated.View style={[styles.iconWrapper, { transform: [{ rotate: spin }] }]}>
          {/* Sun Icon (Visible in Light Mode) */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.iconCenter,
              { opacity: sunOpacity },
            ]}
          >
            <Sun size={size} color="#D97706" />
          </Animated.View>

          {/* Moon Icon (Visible in Dark Mode) */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.iconCenter,
              { opacity: moonOpacity },
            ]}
          >
            <Moon size={size} color="#818CF8" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
