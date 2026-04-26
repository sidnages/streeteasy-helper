import React, { useState } from 'react';
import { SearchFilters, DeliveryMethod, AMENITIES_OPTIONS, AREA_OPTIONS } from '../types';

interface AlertFormProps {
  onSubmit: (data: { filters: SearchFilters; deliveryMethod: DeliveryMethod; discordWebhookUrl?: string }) => void;
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
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ filters, deliveryMethod, discordWebhookUrl });
  };

  const toggleArea = (areaId: number) => {
    setFilters(prev => ({
      ...prev,
      areas: prev.areas.includes(areaId)
        ? prev.areas.filter(id => id !== areaId)
        : [...prev.areas, areaId],
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

  return (
    <form onSubmit={handleSubmit} className="alert-form">
      <h3>Create New Alert</h3>
      
      <div className="form-section">
        <label>Areas</label>
        <div className="checkbox-group">
          {AREA_OPTIONS.map(area => (
            <button
              key={area.value}
              type="button"
              className={filters.areas.includes(area.value) ? 'active' : ''}
              onClick={() => toggleArea(area.value)}
            >
              {area.label}
            </button>
          ))}
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
