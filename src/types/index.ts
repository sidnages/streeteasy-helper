export interface SearchFilters {
  areas: number[];
  price: {
    lowerBound: number | null;
    upperBound: number | null;
  };
  bedrooms: {
    lowerBound: number | null;
    upperBound: number | null;
  };
  bathrooms: {
    lowerBound: number | null;
    upperBound: number | null;
  };
  amenities: string[];
  petsAllowed: boolean | null;
}

export type DeliveryMethod = 'email' | 'discord';

export interface Alert {
  id: string;
  user_id: string;
  filters: SearchFilters;
  delivery_method: DeliveryMethod;
  discord_webhook_url?: string;
  is_active: boolean;
  created_at: string;
}

export const AMENITIES_OPTIONS = [
  { label: 'Washer/Dryer', value: 'WASHER_DRYER' },
  { label: 'Dishwasher', value: 'DISHWASHER' },
  { label: 'Doorman', value: 'DOORMAN' },
  { label: 'Gym', value: 'GYM' },
  { label: 'Pool', value: 'POOL' },
  { label: 'Elevator', value: 'ELEVATOR' },
  { label: 'Pets Allowed', value: 'PETS_ALLOWED' },
];

export const AREA_OPTIONS = [
  { label: 'Manhattan', value: 100 },
  { label: 'Brooklyn', value: 300 },
  { label: 'Queens', value: 400 },
  { label: 'Bronx', value: 500 },
  { label: 'Staten Island', value: 200 },
];
