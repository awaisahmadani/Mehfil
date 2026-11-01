import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';

interface ReportModalProps {
  targetId: string;
  targetType: 'post' | 'user';
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading information',
  'Hate speech or harassment',
  'Inappropriate or adult content',
  'Violence or dangerous content',
  'Intellectual property violation',
  'Impersonation of someone else',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  targetId,
  targetType,
  isOpen,
  onClose,
}) => {
  const { reportContent } = useData();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportContent(targetId, selectedReason);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-[#EF4444]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">Report {targetType}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#FACC15] mx-auto animate-bounce" />
            <h4 className="font-bold text-white text-base">Thank you for reporting</h4>
            <p className="text-xs text-zinc-400">
              Our safety team has received your report and will review it in accordance with Mehfil Community Standards.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-zinc-400">
              Why are you reporting this {targetType}?
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {REPORT_REASONS.map(reason => (
                <label
                  key={reason}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-xs transition-colors ${
                    selectedReason === reason
                      ? 'border-[#FACC15] bg-yellow-950/20 text-white font-medium'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <span>{reason}</span>
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-[#FACC15]"
                  />
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-red-900/30"
            >
              Submit Report
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
