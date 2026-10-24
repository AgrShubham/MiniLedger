import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Loan } from '../api/loans';
import { getFullMediaUrl } from '../api/client';
import { formatCurrency, formatDate, getInitials, getDueStatusText } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Clock,
  Pencil,
} from 'lucide-react-native';

interface LoanCardProps {
  loan: Loan;
  onMarkRepaid: (loanId: string) => Promise<void>;
  onViewReceipt: (url: string, friendName: string) => void;
  onEdit?: (loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onMarkRepaid,
  onViewReceipt,
  onEdit,
}) => {
  const { theme, animatedColors } = useTheme();
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
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: isOverdue ? animatedColors.dangerCard : animatedColors.card,
          borderColor: isOverdue ? animatedColors.dangerBorder : animatedColors.border,
        },
        isRepaid && {
          opacity: 0.88,
        },
      ]}
    >
      {/* Top row: Friend Avatar & Info + Amount */}
      <View style={styles.topRow}>
        <View style={styles.friendInfoRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.avatarBg },
              isOverdue && { backgroundColor: theme.colors.avatarOverdueBg },
              isRepaid && { backgroundColor: theme.colors.avatarRepaidBg },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: theme.colors.avatarText },
                isOverdue && { color: theme.colors.avatarOverdueText },
                isRepaid && { color: theme.colors.avatarRepaidText },
              ]}
            >
              {initials}
            </Text>
          </View>
          <View style={styles.nameBlock}>
            <Text
              style={[styles.friendName, { color: theme.colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {loan.friendName}
            </Text>
            <Text style={[styles.dateSubtext, { color: theme.colors.textMuted }]} numberOfLines={1}>
              Due: {formatDate(loan.dueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.amountBlock}>
          <Text
            style={[
              styles.amountText,
              { color: theme.colors.text },
              isOverdue && { color: theme.colors.dangerLight },
              isRepaid && { color: theme.colors.successLight },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(loan.amount)}
          </Text>
        </View>
      </View>

      {/* Notes if available */}
      {loan.notes ? (
        <View
          style={[
            styles.notesContainer,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.notesText, { color: theme.colors.textMuted }]} numberOfLines={2}>
            "{loan.notes}"
          </Text>
        </View>
      ) : null}

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Bottom row: Status badge + Actions */}
      <View style={styles.bottomRow}>
        {/* Status Pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: theme.colors.warningBg },
            isOverdue && { backgroundColor: theme.colors.dangerBg },
            isRepaid && { backgroundColor: theme.colors.successBg },
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
              { color: theme.colors.warningText },
              isOverdue && { color: theme.colors.dangerText },
              isRepaid && { color: theme.colors.successText },
            ]}
            numberOfLines={1}
          >
            {statusInfo.text}
          </Text>
        </View>

        {/* Action Buttons: Edit, View Receipt & Mark Repaid */}
        <View style={styles.actionsRow}>
          {onEdit ? (
            <TouchableOpacity
              style={[
                styles.editButton,
                {
                  backgroundColor: theme.colors.actionEditBg,
                  borderColor: theme.colors.actionEditBorder,
                },
              ]}
              onPress={() => onEdit(loan)}
              activeOpacity={0.7}
            >
              <Pencil size={12} color={theme.colors.actionEditText} style={{ marginRight: 4 }} />
              <Text style={[styles.editButtonText, { color: theme.colors.actionEditText }]}>
                Edit
              </Text>
            </TouchableOpacity>
          ) : null}

          {fullReceiptUrl ? (
            <TouchableOpacity
              style={[
                styles.receiptButton,
                {
                  backgroundColor: theme.colors.actionReceiptBg,
                  borderColor: theme.colors.actionReceiptBorder,
                },
              ]}
              onPress={() => onViewReceipt(fullReceiptUrl, loan.friendName)}
              activeOpacity={0.7}
            >
              <Receipt size={13} color={theme.colors.actionReceiptText} style={{ marginRight: 4 }} />
              <Text style={[styles.receiptButtonText, { color: theme.colors.actionReceiptText }]}>
                Receipt
              </Text>
            </TouchableOpacity>
          ) : null}

          {!isRepaid ? (
            <TouchableOpacity
              style={[
                styles.repayButton,
                { backgroundColor: theme.colors.primary },
                isRepaying && styles.buttonDisabled,
              ]}
              onPress={handleRepay}
              disabled={isRepaying}
              activeOpacity={0.8}
            >
              {isRepaying ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Check size={13} color={theme.colors.white} style={{ marginRight: 4 }} />
                  <Text style={styles.repayButtonText}>Mark Repaid</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.repaidConfirmedRow}>
              <Text style={[styles.repaidConfirmedText, { color: theme.colors.textDim }]}>
                {loan.repaidAt ? `Paid ${formatDate(loan.repaidAt)}` : 'Repaid'}
              </Text>
            </View>
          )}
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  friendInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  amountBlock: {
    alignItems: 'flex-end',
    marginLeft: 8,
    flexShrink: 0,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
  },
  notesContainer: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    flexShrink: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
    marginLeft: 'auto',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  receiptButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  repayButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  repaidConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repaidConfirmedText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
