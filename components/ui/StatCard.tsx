import { ElementType } from 'react';

type Color = 'blue' | 'green' | 'orange' | 'red' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ElementType;
  color?: Color;
  trend?: string;
  alert?: boolean;
  onClick?: () => void;
}

const colorMap: Record<Color, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50 ring-blue-100',       icon: 'text-blue-600'    },
  green:  { bg: 'bg-emerald-50 ring-emerald-100', icon: 'text-emerald-600' },
  orange: { bg: 'bg-orange-50 ring-orange-100',   icon: 'text-orange-600'  },
  red:    { bg: 'bg-red-50 ring-red-100',         icon: 'text-red-600'     },
  purple: { bg: 'bg-purple-50 ring-purple-100',   icon: 'text-purple-600'  },
};

export const StatCard = ({
  title, value, subtitle, icon: Icon, color = 'blue', trend, alert = false, onClick,
}: StatCardProps) => {
  const c = colorMap[color];
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border ${alert ? 'border-orange-200' : 'border-gray-200/70'} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} ring-1 ring-inset rounded-xl flex items-center justify-center`}>
          <Icon size={19} className={c.icon} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' : 'bg-red-50 text-red-700 ring-red-600/15'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[28px] leading-tight font-semibold tracking-tight text-gray-900 mb-1 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};
