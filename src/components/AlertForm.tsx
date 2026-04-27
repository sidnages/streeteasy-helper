import React, { useState } from 'react';
import { SearchFilters, DeliveryMethod, AMENITIES_OPTIONS, AREA_OPTIONS } from '../types';

interface AlertFormProps {
  onSubmit: (data: { filters: SearchFilters; deliveryMethod: DeliveryMethod; email?: string; discordWebhookUrl?: string }) => void;
  isLoading?: boolean;
}

export const AlertForm: React.FC<AlertFormProps> = ({ onSubmit, isLoading }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    areas: [],
    price: { lowerBound: null, upperBound: null },
    bedrooms: { lowerBound: null, upperBound: null },
    bathrooms: { lowerBound: null, upperBound: null },
    amenities: [],
    petsAllowed: null,
  });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [email, setEmail] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [openBorough, setOpenBorough] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ filters, deliveryMethod, email, discordWebhookUrl });
  };

  const toggleArea = (areaId: number, boroughId: number) => {
    if (filters.areas.includes(boroughId)) return;

    setFilters(prev => ({
      ...prev,
      areas: prev.areas.includes(areaId)
        ? prev.areas.filter(id => id !== areaId)
        : [...prev.areas, areaId],
    }));
  };

  const toggleSelectAll = (boroughId: number, neighborhoodIds: number[]) => {
    setFilters(prev => {
      const isSelected = prev.areas.includes(boroughId);
      if (isSelected) {
        return {
          ...prev,
          areas: prev.areas.filter(id => id !== boroughId && !neighborhoodIds.includes(id))
        };
      } else {
        return {
          ...prev,
          areas: [...prev.areas.filter(id => !neighborhoodIds.includes(id)), boroughId]
        };
      }
    });
  };

  const resetBorough = (boroughId: number, neighborhoodIds: number[]) => {
    setFilters(prev => ({
      ...prev,
      areas: prev.areas.filter(id => id !== boroughId && !neighborhoodIds.includes(id))
    }));
  };

  const toggleAmenity = (value: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter(a => a !== value)
        : [...prev.amenities, value],
    }));
  };

  const getSelectedCountInBorough = (borough: typeof AREA_OPTIONS[0]) => {
    if (filters.areas.includes(borough.value)) return borough.neighborhoods.length;
    
    const neighborhoodIds = borough.neighborhoods.map(n => n.value);
    return filters.areas.filter(id => neighborhoodIds.includes(id)).length;
  };

  return (
    <form onSubmit={handleSubmit} className="alert-form">
      <h3>Create New Alert</h3>
      
      <div className="form-section">
        <label>Areas</label>
        <div className="borough-group">
          {AREA_OPTIONS.map(borough => {
            const selectedCount = getSelectedCountInBorough(borough);
            const isOpen = openBorough === borough.value;

            return (
              <div key={borough.value} className="borough-item">
                <button
                  type="button"
                  className={`borough-toggle ${selectedCount > 0 ? 'has-selection' : ''}`}
                  onClick={() => setOpenBorough(isOpen ? null : borough.value)}
                >
                  <span className="borough-label">{borough.label}</span>
                  {selectedCount > 0 && (
                    <span className="borough-count">{selectedCount}</span>
                  )}
                  <span className={`chevron ${isOpen ? 'up' : 'down'}`}>▾</span>
                </button>
                
                {isOpen && borough.neighborhoods && (
                  <div className="neighborhood-dropdown">
                    <button
                      type="button"
                      className={`neighborhood-btn select-all-btn ${filters.areas.includes(borough.value) ? 'active' : ''}`}
                      onClick={() => toggleSelectAll(borough.value, borough.neighborhoods.map(n => n.value))}
                    >
                      (Select All)
                    </button>
                    <button
                      type="button"
                      className="neighborhood-btn reset-btn"
                      onClick={() => resetBorough(borough.value, borough.neighborhoods.map(n => n.value))}
                    >
                      (Reset)
                    </button>
                    <div className="dropdown-divider" />
                    {borough.neighborhoods.map(n => (
                      <button
                        key={n.value}
                        type="button"
                        className={`neighborhood-btn ${filters.areas.includes(n.value) || filters.areas.includes(borough.value) ? 'active' : ''}`}
                        onClick={() => toggleArea(n.value, borough.value)}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Min Price</label>
          <input
            type="number"
            placeholder="Min"
            onChange={e => setFilters({ ...filters, price: { ...filters.price, lowerBound: Number(e.target.value) || null } })}
          />
        </div>
        <div className="form-group">
          <label>Max Price</label>
          <input
            type="number"
            placeholder="Max"
            onChange={e => setFilters({ ...filters, price: { ...filters.price, upperBound: Number(e.target.value) || null } })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Min Beds</label>
          <input
            type="number"
            placeholder="Min Beds"
            onChange={e => setFilters({ ...filters, bedrooms: { ...filters.bedrooms, lowerBound: Number(e.target.value) || null } })}
          />
        </div>
        <div className="form-group">
          <label>Min Baths</label>
          <input
            type="number"
            step="0.5"
            placeholder="Min Baths"
            onChange={e => setFilters({ ...filters, bathrooms: { ...filters.bathrooms, lowerBound: Number(e.target.value) || null } })}
          />
        </div>
      </div>

      <div className="form-section">
        <label>Amenities</label>
        <div className="checkbox-group">
          {AMENITIES_OPTIONS.map(amenity => (
            <button
              key={amenity.value}
              type="button"
              className={filters.amenities.includes(amenity.value) ? 'active' : ''}
              onClick={() => toggleAmenity(amenity.value)}
            >
              {amenity.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label>Notification Channel</label>
        <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as DeliveryMethod)}>
          <option value="email">Email</option>
          <option value="discord">Discord Webhook</option>
        </select>
      </div>

      {deliveryMethod === 'email' && (
        <div className="form-group">
          <label>Alert Email Address</label>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      )}

      {deliveryMethod === 'discord' && (
        <div className="form-group">
          <label>Discord Webhook URL</label>
          <input
            type="url"
            required
            placeholder="https://discord.com/api/webhooks/..."
            value={discordWebhookUrl}
            onChange={e => setDiscordWebhookUrl(e.target.value)}
          />
        </div>
      )}

      <button type="submit" disabled={isLoading} className="primary-btn lg">
        {isLoading ? 'Creating...' : 'Create Alert'}
      </button>
    </form>
  );
};
