export type UrgencyType = 'urgent' | 'attention' | 'upcoming' | 'safe' | 'overdue';

export interface UrgencyInfo {
  type: UrgencyType;
  text: string;
}

export function calculateUrgency(deadlineIso: string): UrgencyInfo {
  const deadline = new Date(deadlineIso).getTime();
  const now = new Date().getTime();
  
  const diffTime = deadline - now;
  const diffHours = diffTime / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffTime < 0) {
    return {
      type: 'overdue',
      text: 'TERLAMBAT'
    };
  }

  if (diffHours < 24) {
    return {
      type: 'urgent',
      text: `URGENT · ${Math.ceil(diffHours)} jam lagi`
    };
  }

  if (diffDays <= 3) {
    return {
      type: 'attention',
      text: `ATTENTION · ${Math.ceil(diffDays)} hari lagi`
    };
  }

  if (diffDays <= 7) {
    return {
      type: 'upcoming',
      text: `UPCOMING · ${Math.ceil(diffDays)} hari lagi`
    };
  }

  return {
    type: 'safe',
    text: `SAFE · ${Math.ceil(diffDays)} hari lagi`
  };
}

export const getUrgencyStyles = (type: UrgencyType) => {
  switch (type) {
    case 'urgent':
      return {
        cardBg: 'bg-[#EED4BA]',
        cardBorder: 'border-[#E4C8AB]',
        pillBg: 'bg-[#E5C4A6]',
        textColor: 'text-[#8B482A]',
        dotBg: 'bg-[#8B482A]'
      };
    case 'attention':
      return {
        cardBg: 'bg-[#F7EACA]',
        cardBorder: 'border-[#EADBBD]',
        pillBg: 'bg-[#EBDBB2]',
        textColor: 'text-[#6F695A]',
        dotBg: 'bg-[#6F695A]'
      };
    case 'upcoming':
      return {
        cardBg: 'bg-[#DFEDED]',
        cardBorder: 'border-[#CDE1E1]',
        pillBg: 'bg-[#CBE0E0]',
        textColor: 'text-[#4D6E6E]',
        dotBg: 'bg-[#4D6E6E]'
      };
    case 'safe':
      return {
        cardBg: 'bg-[#E0EEDD]',
        cardBorder: 'border-[#D0E2CC]',
        pillBg: 'bg-[#CEE2CB]',
        textColor: 'text-[#556E54]',
        dotBg: 'bg-[#556E54]'
      };
    case 'overdue':
      return {
        cardBg: 'bg-[#FFEBEE]',
        cardBorder: 'border-[#FFCDD2]',
        pillBg: 'bg-[#FFCDD2]',
        textColor: 'text-[#C62828]',
        dotBg: 'bg-[#C62828]'
      };
    default:
      return {
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        pillBg: 'bg-gray-100',
        textColor: 'text-gray-600',
        dotBg: 'bg-gray-400'
      };
  }
};
