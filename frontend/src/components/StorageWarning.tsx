import React from 'react';
import { AlertTriangle, HardDrive } from 'lucide-react';

interface StorageWarningProps {
  storageUsed: number; // in bytes
  maxStorage: number; // in bytes (500MB)
}

export const StorageWarning: React.FC<StorageWarningProps> = ({ storageUsed, maxStorage }) => {
  const usedMB = storageUsed / (1024 * 1024);
  const maxMB = maxStorage / (1024 * 1024);
  const percentage = (storageUsed / maxStorage) * 100;
  const warningThreshold = 450 * 1024 * 1024; // 450MB
  
  if (storageUsed < warningThreshold) {
    return null;
  }
  
  const isCritical = storageUsed >= maxStorage * 0.9;
  const bgColor = isCritical ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = isCritical ? 'border-red-200' : 'border-yellow-200';
  const textColor = isCritical ? 'text-red-800' : 'text-yellow-800';
  const iconColor = isCritical ? 'text-red-600' : 'text-yellow-600';
  const barColor = isCritical ? 'bg-red-600' : 'bg-yellow-600';
  const barBgColor = isCritical ? 'bg-red-200' : 'bg-yellow-200';
  
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4 flex items-start gap-3 shadow-sm`}>
      <AlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <HardDrive className={`w-4 h-4 ${iconColor}`} />
          <h4 className={`font-semibold ${textColor}`}>
            {isCritical ? 'Storage Almost Full' : 'Storage Warning'}
          </h4>
        </div>
        <p className={`text-sm ${textColor.replace('800', '700')} mb-2`}>
          You're using <span className="font-bold">{usedMB.toFixed(1)}MB</span> of <span className="font-bold">{maxMB.toFixed(0)}MB</span> storage ({percentage.toFixed(1)}%).
        </p>
        <div className={`w-full ${barBgColor} rounded-full h-2 mb-2`}>
          <div 
            className={`${barColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        {isCritical ? (
          <p className="text-xs text-red-600 font-medium">
            ⚠️ Storage limit almost reached! Delete files to free up space.
          </p>
        ) : (
          <p className="text-xs text-yellow-600">
            Consider deleting old files to free up space.
          </p>
        )}
      </div>
    </div>
  );
};

