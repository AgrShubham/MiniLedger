import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../utils/theme';

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
                isActive && styles.activeTab,
                isActive && isDangerTab && styles.activeDangerTab,
              ]}
              onPress={() => onSelectFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                  !isActive && isDangerTab && { color: theme.colors.dangerLight },
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isActive && styles.activeCountBadge,
                    isDangerTab && styles.dangerCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive && styles.activeCountText,
                      isDangerTab && { color: '#FECACA' },
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
    marginBottom: theme.spacing.md,
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
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  activeDangerTab: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#0F172A',
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dangerCountBadge: {
    backgroundColor: theme.colors.dangerBg,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textDim,
  },
  activeCountText: {
    color: theme.colors.white,
  },
});
