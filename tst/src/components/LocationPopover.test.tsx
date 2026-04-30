import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationPopover } from '../../../src/components/LocationPopover';

describe('LocationPopover', () => {
  it('should render "All Areas" when areaIds is empty', () => {
    render(<LocationPopover areaIds={[]} />);
    expect(screen.getByText('All Areas')).toBeInTheDocument();
  });

  it('should render single neighborhood name', () => {
    // 137 is Upper West Side
    render(<LocationPopover areaIds={[137]} />); 
    expect(screen.getByText('Upper West Side')).toBeInTheDocument();
  });

  it('should show truncated list when more than limit', () => {
    // 137: UWS, 140: UES, 149: Washington Heights, 158: Flatiron, 150: Inwood, 115: Chelsea
    const areaIds = [137, 140, 149, 158, 150, 115]; 
    render(<LocationPopover areaIds={areaIds} />);
    expect(screen.getByText(/ \+1 more/)).toBeInTheDocument();
    expect(screen.getByText(/Upper West Side, Upper East Side/)).toBeInTheDocument();
  });

  it('should open popover when clicking truncated label', () => {
    const areaIds = [137, 140, 149, 158, 150, 115]; 
    render(<LocationPopover areaIds={areaIds} />);
    
    const label = screen.getByText(/ \+1 more/);
    fireEvent.click(label);
    
    expect(screen.getByText('All Selected Areas')).toBeInTheDocument();
    expect(screen.getByText('Upper West Side')).toBeInTheDocument();
  });

  it('should close popover when clicking close button', () => {
    const areaIds = [137, 140, 149, 158, 150, 115]; 
    render(<LocationPopover areaIds={areaIds} />);
    
    fireEvent.click(screen.getByText(/ \+1 more/));
    fireEvent.click(screen.getByText('✕'));
    
    expect(screen.queryByText('All Selected Areas')).not.toBeInTheDocument();
  });
});
