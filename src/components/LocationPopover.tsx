import React, { useState, useRef, useEffect } from 'react';
import { AREA_OPTIONS } from '../types';

interface LocationPopoverProps {
  areaIds: number[];
}

export const LocationPopover: React.FC<LocationPopoverProps> = ({ areaIds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  if (!areaIds || !Array.isArray(areaIds) || areaIds.length === 0) {
    return <span>All Areas</span>;
  }

  const allPossibleNeighborhoods = AREA_OPTIONS.flatMap(b => b.neighborhoods || []);
  const selectedLabels = areaIds.map((id: number) => {
    const found = allPossibleNeighborhoods.find(n => n.value === id) || AREA_OPTIONS.find(b => b.value === id);
    return found?.label || `Area ${id}`;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isTruncated = selectedLabels.length > 5;
  const displayText = isTruncated 
    ? `${selectedLabels.slice(0, 5).join(', ')} +${selectedLabels.length - 5} more`
    : selectedLabels.join(', ');

  return (
    <div className="location-popover-container" ref={popoverRef}>
      <span 
        className={`location-label ${isTruncated ? 'clickable' : ''}`}
        onClick={() => isTruncated && setIsOpen(!isOpen)}
      >
        {displayText}
      </span>
      {isOpen && (
        <div className="popover-content">
          <div className="popover-header">
            <strong>All Selected Areas</strong>
            <button className="close-popover" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="popover-scroll">
            <ul>
              {selectedLabels.map((label, idx) => (
                <li key={idx}>{label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
