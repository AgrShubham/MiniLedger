import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchLoans, fetchSummary, markLoanAsRepaid, Loan } from '../api/loans';
import { SummaryCard } from '../components/SummaryCard';
import { FilterTabs, FilterStatus } from '../components/FilterTabs';
import { LoanCard } from '../components/LoanCard';
import { AddLoanModal } from '../components/AddLoanModal';
import { EditLoanModal } from '../components/EditLoanModal';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';
import { theme } from '../utils/theme';
import {
  Plus,
  LogOut,
  ShieldCheck,
  Inbox,
  AlertCircle,
} from 'lucide-react-native';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    friendName: string;
  } | null>(null);

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['summary'],
    queryFn: fetchSummary,
  });

  const {
    data: loans,
    isLoading: isLoansLoading,
    isError: isLoansError,
    error: loansError,
    refetch: refetchLoans,
    isRefetching,
  } = useQuery({
    queryKey: ['loans', filter],
    queryFn: () => fetchLoans(filter),
  });

  // Repay mutation with instant query invalidation
  const repayMutation = useMutation({
    mutationFn: (loanId: string) => markLoanAsRepaid(loanId),
    onSuccess: () => {
      // Invalidate both loans and summary so UI immediately reflects updated financials
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err: any) => {
      Alert.alert('Repayment Failed', err.message || 'Could not mark loan as repaid.');
    },
  });

  const handleMarkRepaid = async (loanId: string) => {
    await repayMutation.mutateAsync(loanId);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSummary(), refetchLoans()]);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['loans'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  };

  const handleEditSuccess = () => {
    setEditingLoan(null);
    queryClient.invalidateQueries({ queryKey: ['loans'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.userPhoneText}>{user?.phone}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.8}
          >
            <Plus size={18} color={theme.colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <LogOut size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List & Dashboard Content */}
      <FlatList
        data={loans || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onMarkRepaid={handleMarkRepaid}
            onViewReceipt={(url, friendName) => setSelectedReceipt({ url, friendName })}
            onEdit={(loan) => setEditingLoan(loan)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Top Summary Card */}
            <SummaryCard summary={summary} isLoading={isSummaryLoading} />

            {/* Filter Tabs */}
            <FilterTabs
              currentFilter={filter}
              onSelectFilter={setFilter}
              counts={summary?.counts}
            />
          </>
        }
        ListEmptyComponent={
          isLoansLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.emptySub}>Loading ledger entries...</Text>
            </View>
          ) : isLoansError ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={36} color={theme.colors.danger} />
              <Text style={styles.emptyTitle}>Failed to load loans</Text>
              <Text style={styles.emptySub}>
                {(loansError as any)?.message || 'Please check your connection and try again.'}
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Inbox size={40} color={theme.colors.textDim} />
              <Text style={styles.emptyTitle}>
                {filter === 'ALL'
                  ? 'No loans recorded yet'
                  : `No ${filter.toLowerCase()} loans found`}
              </Text>
              <Text style={styles.emptySub}>
                Tap the "+ Add" button to record money lent to a friend.
              </Text>
              {filter === 'ALL' && (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => setIsAddModalOpen(true)}
                >
                  <Plus size={16} color={theme.colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.addFirstBtnText}>Add First Loan</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Loan Modal */}
      <EditLoanModal
        loan={editingLoan}
        visible={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Fullscreen Receipt Viewer */}
      <ReceiptViewerModal
        imageUrl={selectedReceipt?.url || null}
        friendName={selectedReceipt?.friendName}
        onClose={() => setSelectedReceipt(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#3730A3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  userPhoneText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
  },
  headerAddBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#0F172A',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  retryBtnText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginTop: 16,
  },
  addFirstBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
