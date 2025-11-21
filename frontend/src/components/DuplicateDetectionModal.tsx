import React from 'react';
import { X, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './UIComponents';

export interface FileDuplicateInfo {
  is_duplicate: boolean;
  existing_file_id?: string;
  existing_file_name?: string;
  similarity: number;
}

export interface ChunkDuplicateInfo {
  chunk_index: number;
  existing_file_name: string;
  similarity: number;
  chunk_text_preview: string;
}

export interface DuplicateDetectionResult {
  file_duplicate?: FileDuplicateInfo | null;
  chunk_duplicates: ChunkDuplicateInfo[];
  has_duplicates: boolean;
}

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateInfo: DuplicateDetectionResult | null;
  fileName: string;
  onReplace: () => void;
  onKeepBoth: () => void;
  onCancel: () => void;
}

export const DuplicateDetectionModal: React.FC<DuplicateDetectionModalProps> = ({
  isOpen,
  onClose,
  duplicateInfo,
  fileName,
  onReplace,
  onKeepBoth,
  onCancel
}) => {
  if (!isOpen || !duplicateInfo || !duplicateInfo.has_duplicates) {
    return null;
  }

  const { file_duplicate, chunk_duplicates } = duplicateInfo;
  const isExactFileDuplicate = file_duplicate?.is_duplicate && file_duplicate.similarity >= 0.99;
  const hasChunkDuplicates = chunk_duplicates.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Duplicate File Detected</h3>
              <p className="text-sm text-stone-600">We found similar content in your existing files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Info */}
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <p className="text-sm text-stone-600 mb-2">Uploading:</p>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-slate-900">{fileName}</span>
            </div>
          </div>

          {/* Exact File Duplicate */}
          {isExactFileDuplicate && file_duplicate && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Exact File Match Found
                  </h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    This file appears to be identical to:
                  </p>
                  <div className="bg-white rounded p-3 border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-slate-900">
                        {file_duplicate.existing_file_name || "Existing file"}
                      </span>
                      <span className="text-xs text-stone-500">
                        ({Math.round(file_duplicate.similarity * 100)}% match)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chunk Duplicates */}
          {hasChunkDuplicates && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">
                Similar Content Found
              </h4>
              <p className="text-sm text-orange-800 mb-3">
                Some parts of this file are very similar to content in:
              </p>
              <div className="space-y-2">
                {chunk_duplicates.slice(0, 3).map((chunk, idx) => (
                  <div key={idx} className="bg-white rounded p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-sm text-slate-900">
                        {chunk.existing_file_name}
                      </span>
                      <span className="text-xs text-stone-500">
                        ({Math.round(chunk.similarity * 100)}% similar)
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 italic line-clamp-2">
                      "{chunk.chunk_text_preview}"
                    </p>
                  </div>
                ))}
                {chunk_duplicates.length > 3 && (
                  <p className="text-xs text-orange-700">
                    +{chunk_duplicates.length - 3} more similar sections
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
            <Button
              onClick={onReplace}
              variant="primary"
              className="flex-1 bg-slate-800 hover:bg-slate-700"
            >
              Replace Existing File
            </Button>
            <Button
              onClick={onKeepBoth}
              variant="outline"
              className="flex-1"
            >
              Keep Both Files
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancel Upload
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-stone-500 text-center">
            Replacing will delete the existing file and its associated data. Keeping both will store both versions.
          </p>
        </div>
      </div>
    </div>
  );
};

