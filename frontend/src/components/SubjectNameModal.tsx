import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SubjectNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const SubjectNameModal: React.FC<SubjectNameModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Create New Subject
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Enter a name for your new subject
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject-name" className="block text-sm font-medium text-stone-700 mb-2">
              Subject Name
            </label>
            <input
              id="subject-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Biology 101, History Notes"
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

