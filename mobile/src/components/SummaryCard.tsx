import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LoansSummary } from '../api/loans';
import { formatCurrency } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react-native';

interface SummaryCardProps {
  summary?: LoansSummary;
  isLoading: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isLoading }) => {
  const { theme, animatedColors } = useTheme();

  if (isLoading && !summary) {
    return (
      <Animated.View
        style={[
          styles.card,
          styles.loadingCard,
          { backgroundColor: animatedColors.card, borderColor: animatedColors.border },
        ]}
      >
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Loading summary...
        </Text>
      </Animated.View>
    );
  }

  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const counts = summary?.counts ?? { total: 0, repaid: 0, pending: 0, overdue: 0 };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: animatedColors.card,
          borderColor: animatedColors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { color: theme.colors.textDim }]}>LEDGER SUMMARY</Text>
        {counts.overdue > 0 && (
          <View
            style={[
              styles.overdueAlertBadge,
              {
                backgroundColor: theme.colors.dangerBg,
                borderColor: theme.colors.dangerBorder,
              },
            ]}
          >
            <AlertTriangle size={12} color={theme.colors.dangerLight} style={{ marginRight: 4 }} />
            <Text style={[styles.overdueAlertText, { color: theme.colors.dangerText }]}>
              {counts.overdue} {counts.overdue === 1 ? 'loan overdue' : 'loans overdue'}
            </Text>
          </View>
        )}
      </View>

      {/* Main Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        {/* Total Lent */}
        <View
          style={[
            styles.metricItem,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          <View style={styles.metricLabelRow}>
            <ArrowUpRight size={14} color={theme.colors.primaryLight} style={{ marginRight: 4 }} />
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
              Total Lent
            </Text>
          </View>
          <Text
            style={[styles.metricValue, { color: theme.colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatCurrency(totalLent)}
          </Text>
          <Text style={[styles.metricSub, { color: theme.colors.textDim }]} numberOfLines={1}>
            {counts.total} total loans
          </Text>
        </View>

        {/* Total Repaid */}
        <View
          style={[
            styles.metricItem,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          <View style={styles.metricLabelRow}>
            <CheckCircle2 size={14} color={theme.colors.successLight} style={{ marginRight: 4 }} />
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
              Total Repaid
            </Text>
          </View>
          <Text
            style={[styles.metricValue, { color: theme.colors.successLight }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatCurrency(totalRepaid)}
          </Text>
          <Text style={[styles.metricSub, { color: theme.colors.textDim }]} numberOfLines={1}>
            {counts.repaid} repaid
          </Text>
        </View>

        {/* Overdue Amount */}
        <View
          style={[
            styles.metricItem,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.borderLight,
            },
            overdueAmount > 0 && {
              borderColor: theme.colors.dangerBorder,
              backgroundColor: theme.colors.dangerCard,
            },
          ]}
        >
          <View style={styles.metricLabelRow}>
            <AlertTriangle
              size={14}
              color={overdueAmount > 0 ? theme.colors.dangerLight : theme.colors.textMuted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.metricLabel,
                { color: overdueAmount > 0 ? theme.colors.dangerLight : theme.colors.textMuted },
              ]}
              numberOfLines={1}
            >
              Overdue
            </Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: overdueAmount > 0 ? theme.colors.dangerLight : theme.colors.textMuted },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatCurrency(overdueAmount)}
          </Text>
          <Text
            style={[
              styles.metricSub,
              { color: overdueAmount > 0 ? theme.colors.dangerText : theme.colors.textDim },
            ]}
            numberOfLines={1}
          >
            {counts.overdue} pending
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  overdueAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    flexShrink: 1,
  },
  overdueAlertText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  metricItem: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    minWidth: 0,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 9,
  },
});
