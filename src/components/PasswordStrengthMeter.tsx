import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: 'bg-zinc-700' };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-[#EF4444]', width: '25%' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-amber-500', width: '50%' };
    case 3:
    case 4:
      return { score: 3, label: 'Good', color: 'bg-[#FACC15]', width: '75%' };
    case 5:
      return { score: 4, label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    default:
      return { score: 1, label: 'Too short', color: 'bg-[#EF4444]', width: '20%' };
  }
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="w-full mt-1.5 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">Password strength</span>
        <span
          className={`font-semibold ${
            strength.score === 1
              ? 'text-[#EF4444]'
              : strength.score === 2
              ? 'text-amber-500'
              : strength.score === 3
              ? 'text-[#FACC15]'
              : 'text-emerald-400'
          }`}
        >
          {strength.label}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>
    </div>
  );
};
