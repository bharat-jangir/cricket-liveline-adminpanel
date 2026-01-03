import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SimpleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function SimpleDialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  maxWidth = 'md'
}: SimpleDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!mounted || !open) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const dialogContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 transition-opacity" 
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Panel */}
      <div 
        className={`relative w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-lg bg-slate-800 border border-slate-700 p-6 text-left shadow-xl transition-all flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold leading-6 text-white">{title}</h3>}
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            className="rounded-md bg-slate-800 text-slate-400 hover:text-white focus:outline-none"
            onClick={() => onOpenChange(false)}
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
