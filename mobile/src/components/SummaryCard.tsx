import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LoansSummary } from '../api/loans';
import { formatCurrency } from '../utils/format';
import { theme } from '../utils/theme';
import { AlertTriangle, TrendingUp, CheckCircle2, ArrowUpRight } from 'lucide-react-native';

interface SummaryCardProps {
  summary?: LoansSummary;
  isLoading: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isLoading }) => {
  if (isLoading && !summary) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    );
  }

  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const counts = summary?.counts ?? { total: 0, repaid: 0, pending: 0, overdue: 0 };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>LEDGER SUMMARY</Text>
        {counts.overdue > 0 && (
          <View style={styles.overdueAlertBadge}>
            <AlertTriangle size={12} color="#FCA5A5" style={{ marginRight: 4 }} />
            <Text style={styles.overdueAlertText}>
              {counts.overdue} {counts.overdue === 1 ? 'loan overdue' : 'loans overdue'}
            </Text>
          </View>
        )}
      </View>

      {/* Main Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        {/* Total Lent */}
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <ArrowUpRight size={14} color={theme.colors.primaryLight} style={{ marginRight: 4 }} />
            <Text style={styles.metricLabel}>Total Lent</Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.text }]} numberOfLines={1}>
            {formatCurrency(totalLent)}
          </Text>
          <Text style={styles.metricSub}>{counts.total} total loans</Text>
        </View>

        {/* Total Repaid */}
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <CheckCircle2 size={14} color={theme.colors.successLight} style={{ marginRight: 4 }} />
            <Text style={styles.metricLabel}>Total Repaid</Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.colors.successLight }]} numberOfLines={1}>
            {formatCurrency(totalRepaid)}
          </Text>
          <Text style={styles.metricSub}>{counts.repaid} repaid</Text>
        </View>

        {/* Overdue Amount */}
        <View style={[styles.metricItem, overdueAmount > 0 && styles.overdueMetricItem]}>
          <View style={styles.metricLabelRow}>
            <AlertTriangle
              size={14}
              color={overdueAmount > 0 ? theme.colors.dangerLight : theme.colors.textMuted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.metricLabel,
                overdueAmount > 0 && { color: theme.colors.dangerLight },
              ]}
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
          >
            {formatCurrency(overdueAmount)}
          </Text>
          <Text
            style={[
              styles.metricSub,
              overdueAmount > 0 && { color: '#FCA5A5' },
            ]}
          >
            {counts.overdue} pending overdue
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textDim,
    letterSpacing: 1.2,
  },
  overdueAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  overdueAlertText: {
    color: '#FECACA',
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 10,
  },
  overdueMetricItem: {
    borderColor: theme.colors.danger,
    backgroundColor: '#1C131D',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    color: theme.colors.textDim,
  },
});
