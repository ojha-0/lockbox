import { CheckCircle, Clock, XCircle, UserCheck, UserX } from 'lucide-react';

const configs = {
  PENDING_VERIFICATION: { label: 'Pending Verification', className: 'badge-pending', Icon: Clock },
  VERIFIED: { label: 'Verified', className: 'badge-verified', Icon: CheckCircle },
  DECLINED: { label: 'Declined', className: 'badge-declined', Icon: XCircle },
  ACTIVE: { label: 'Active', className: 'badge-active', Icon: UserCheck },
  DISABLED: { label: 'Disabled', className: 'badge-disabled', Icon: UserX },
};

export default function StatusBadge({ status }) {
  const config = configs[status] || { label: status, className: 'badge-pending', Icon: Clock };
  const { label, className, Icon } = config;
  return (
    <span className={className}>
      <Icon size={12} />
      {label}
    </span>
  );
}
