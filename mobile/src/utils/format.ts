/**
 * Utility functions for currency and date formatting
 */

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  if (isNaN(amount)) return `${symbol}0.00`;
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getDueStatusText(
  dueDateStr: string,
  isOverdue: boolean,
  isRepaid: boolean
): { text: string; isOverdue: boolean } {
  if (isRepaid) {
    return { text: 'Repaid', isOverdue: false };
  }

  // Calculate day difference relative to midnight today
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: overdueDays <= 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false };
  }

  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false };
  }

  return { text: `Due in ${diffDays} days`, isOverdue: false };
}
