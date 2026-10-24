import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type FilterStatus = 'ALL' | 'PENDING' | 'OVERDUE' | 'REPAID';

interface FilterTabsProps {
  currentFilter: FilterStatus;
  onSelectFilter: (filter: FilterStatus) => void;
  counts?: {
    total: number;
    pending: number;
    overdue: number;
    repaid: number;
  };
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  currentFilter,
  onSelectFilter,
  counts,
}) => {
  const { theme } = useTheme();

  const tabs: { key: FilterStatus; label: string; count?: number; isDanger?: boolean }[] = [
    { key: 'ALL', label: 'All', count: counts?.total },
    { key: 'PENDING', label: 'Pending', count: counts?.pending },
    { key: 'OVERDUE', label: 'Overdue', count: counts?.overdue, isDanger: true },
    { key: 'REPAID', label: 'Repaid', count: counts?.repaid },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.key;
          const isDangerTab = tab.isDanger && (tab.count ?? 0) > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
                isActive && {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
                isActive && isDangerTab && {
                  backgroundColor: theme.colors.danger,
                  borderColor: theme.colors.danger,
                },
              ]}
              onPress={() => onSelectFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.textMuted },
                  isActive && { color: theme.colors.white, fontWeight: '700' },
                  !isActive && isDangerTab && { color: theme.colors.dangerLight },
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: theme.colors.surfaceMuted },
                    isActive && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                    isDangerTab && !isActive && { backgroundColor: theme.colors.dangerBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: theme.colors.textDim },
                      isActive && { color: theme.colors.white },
                      isDangerTab && !isActive && { color: theme.colors.dangerText },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
