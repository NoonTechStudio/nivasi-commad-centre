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
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600'   },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600'  },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600'    },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
};

export const StatCard = ({
  title, value, subtitle, icon: Icon, color = 'blue', trend, alert = false, onClick,
}: StatCardProps) => {
  const c = colorMap[color];
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 shadow-sm border ${alert ? 'border-orange-200' : 'border-gray-100'} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className={c.icon} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};
