import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Loan } from '../api/loans';
import { getFullMediaUrl } from '../api/client';
import { formatCurrency, formatDate, getInitials, getDueStatusText } from '../utils/format';
import { theme } from '../utils/theme';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Clock,
} from 'lucide-react-native';

interface LoanCardProps {
  loan: Loan;
  onMarkRepaid: (loanId: string) => Promise<void>;
  onViewReceipt: (url: string, friendName: string) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onMarkRepaid,
  onViewReceipt,
}) => {
  const [isRepaying, setIsRepaying] = useState(false);

  const isRepaid = loan.status === 'REPAID';
  const isOverdue = loan.isOverdue;
  const statusInfo = getDueStatusText(loan.dueDate, isOverdue, isRepaid);
  const initials = getInitials(loan.friendName);
  const fullReceiptUrl = getFullMediaUrl(loan.receiptUrl);

  const handleRepay = async () => {
    if (isRepaid || isRepaying) return;
    setIsRepaying(true);
    try {
      await onMarkRepaid(loan.id);
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard, isRepaid && styles.repaidCard]}>
      {/* Top row: Friend Avatar & Info + Amount */}
      <View style={styles.topRow}>
        <View style={styles.friendInfoRow}>
          <View style={[styles.avatar, isOverdue && styles.overdueAvatar, isRepaid && styles.repaidAvatar]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.friendName}>{loan.friendName}</Text>
            <Text style={styles.dateSubtext}>Due: {formatDate(loan.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.amountBlock}>
          <Text
            style={[
              styles.amountText,
              isOverdue && { color: theme.colors.dangerLight },
              isRepaid && { color: theme.colors.successLight },
            ]}
          >
            {formatCurrency(loan.amount)}
          </Text>
        </View>
      </View>

      {/* Notes if available */}
      {loan.notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>
            "{loan.notes}"
          </Text>
        </View>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row: Status badge + Actions */}
      <View style={styles.bottomRow}>
        {/* Status Pill */}
        <View
          style={[
            styles.statusPill,
            isOverdue && styles.overduePill,
            isRepaid && styles.repaidPill,
          ]}
        >
          {isRepaid ? (
            <CheckCircle2 size={13} color={theme.colors.successLight} style={{ marginRight: 4 }} />
          ) : isOverdue ? (
            <AlertTriangle size={13} color={theme.colors.dangerLight} style={{ marginRight: 4 }} />
          ) : (
            <Clock size={13} color={theme.colors.warning} style={{ marginRight: 4 }} />
          )}
          <Text
            style={[
              styles.statusPillText,
              isOverdue && { color: '#FECACA' },
              isRepaid && { color: '#A7F3D0' },
            ]}
          >
            {statusInfo.text}
          </Text>
        </View>

        {/* Action Buttons: View Receipt & Mark Repaid */}
        <View style={styles.actionsRow}>
          {fullReceiptUrl ? (
            <TouchableOpacity
              style={styles.receiptButton}
              onPress={() => onViewReceipt(fullReceiptUrl, loan.friendName)}
              activeOpacity={0.7}
            >
              <Receipt size={14} color={theme.colors.primaryLight} style={{ marginRight: 4 }} />
              <Text style={styles.receiptButtonText}>Receipt</Text>
            </TouchableOpacity>
          ) : null}

          {!isRepaid ? (
            <TouchableOpacity
              style={[styles.repayButton, isRepaying && styles.buttonDisabled]}
              onPress={handleRepay}
              disabled={isRepaying}
              activeOpacity={0.8}
            >
              {isRepaying ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Check size={14} color={theme.colors.white} style={{ marginRight: 4 }} />
                  <Text style={styles.repayButtonText}>Mark Repaid</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.repaidConfirmedRow}>
              <Text style={styles.repaidConfirmedText}>
                {loan.repaidAt ? `Paid ${formatDate(loan.repaidAt)}` : 'Repaid'}
              </Text>
            </View>
          )}
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
  overdueCard: {
    borderColor: theme.colors.danger,
    backgroundColor: '#1E161C', // Dark reddish tint
  },
  repaidCard: {
    borderColor: theme.colors.borderLight,
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#3730A3', // Indigo tint
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  overdueAvatar: {
    backgroundColor: theme.colors.dangerBg,
  },
  repaidAvatar: {
    backgroundColor: theme.colors.successBg,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dateSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  amountBlock: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  notesContainer: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.sm,
  },
  notesText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.warningBg,
  },
  overduePill: {
    backgroundColor: theme.colors.dangerBg,
  },
  repaidPill: {
    backgroundColor: theme.colors.successBg,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#3730A3',
  },
  receiptButtonText: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  repayButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  repaidConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repaidConfirmedText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
});
