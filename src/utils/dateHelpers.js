export const formatDueDate = (dueDate) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() === today.getTime()) return 'Today';
  if (due.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (due < today) return 'Overdue';

  return due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};