export function StatusChip({ done }: { done: boolean }) {
  return <span className={`status ${done ? 'status-done' : 'status-pending'}`}>{done ? '已完成' : '待维护'}</span>;
}
