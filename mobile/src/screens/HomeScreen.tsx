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
import { useTheme } from '../context/ThemeContext';
import { fetchLoans, fetchSummary, markLoanAsRepaid, Loan } from '../api/loans';
import { SummaryCard } from '../components/SummaryCard';
import { FilterTabs, FilterStatus } from '../components/FilterTabs';
import { LoanCard } from '../components/LoanCard';
import { AddLoanModal } from '../components/AddLoanModal';
import { EditLoanModal } from '../components/EditLoanModal';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';
import {
  Plus,
  LogOut,
  ShieldCheck,
  Inbox,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react-native';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerBrand}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: theme.colors.primaryBg,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ShieldCheck size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: theme.colors.text }]}>MiniLedger</Text>
            <Text style={[styles.userPhoneText, { color: theme.colors.textMuted }]}>
              {user?.phone}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <Sun size={17} color={theme.colors.warning} />
            ) : (
              <Moon size={17} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerAddBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.8}
          >
            <Plus size={18} color={theme.colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={logout}
            activeOpacity={0.7}
            accessibilityLabel="Log out"
          >
            <LogOut size={17} color={theme.colors.textMuted} />
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
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                Loading ledger entries...
              </Text>
            </View>
          ) : isLoansError ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={36} color={theme.colors.danger} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Failed to load loans
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                {(loansError as any)?.message || 'Please check your connection and try again.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryBtn,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
                onPress={handleRefresh}
              >
                <Text style={[styles.retryBtnText, { color: theme.colors.text }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Inbox size={40} color={theme.colors.textDim} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                {filter === 'ALL'
                  ? 'No loans recorded yet'
                  : `No ${filter.toLowerCase()} loans found`}
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                Tap the "+ Add" button to record money lent to a friend.
              </Text>
              {filter === 'ALL' && (
                <TouchableOpacity
                  style={[styles.addFirstBtn, { backgroundColor: theme.colors.primary }]}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  userPhoneText: {
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  addFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
