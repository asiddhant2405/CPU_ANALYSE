import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface WarningBoxProps {
  type?: 'warning' | 'info' | 'security';
  title?: string;
  message: string;
}

export const WarningBox: React.FC<WarningBoxProps> = ({
  type = 'warning',
  title,
  message,
}) => {
  const styles = {
    warning: {
      bg: 'bg-amber-950/30 border-amber-600/40 text-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-blue-950/30 border-blue-600/40 text-blue-300',
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
    },
    security: {
      bg: 'bg-red-950/30 border-red-700/40 text-red-300',
      icon: <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div className={`flex items-start space-x-2.5 p-3 rounded-xl border ${current.bg} text-xs leading-relaxed my-2`}>
      {current.icon}
      <div>
        {title && <h5 className="font-semibold mb-0.5 text-white">{title}</h5>}
        <p className="opacity-90">{message}</p>
      </div>
    </div>
  );
};
