'use client';
import { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl ring-1 ring-gray-900/5 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-scale-in`}>
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
