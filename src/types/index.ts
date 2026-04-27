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
  email?: string;
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
  {
    label: 'Bronx',
    value: 500,
    neighborhoods: [
      { label: 'Baychester', value: 243 },
      { label: 'Bedford Park', value: 221 },
      { label: 'City Island', value: 236 },
      { label: 'Concourse', value: 211 },
      { label: 'Country Club', value: 273 },
      { label: 'Fordham', value: 214 },
      { label: 'Highbridge', value: 210 },
      { label: 'Hunts Point', value: 204 },
      { label: 'Kingsbridge', value: 224 },
      { label: 'Morris Park', value: 237 },
      { label: 'Mott Haven', value: 201 },
      { label: 'Parkchester', value: 231 },
      { label: 'Pelham Bay', value: 233 },
      { label: 'Riverdale', value: 225 },
      { label: 'Soundview', value: 228 },
      { label: 'Throgs Neck', value: 232 },
      { label: 'Wakefield', value: 245 },
      { label: 'Williamsbridge', value: 242 },
      { label: 'Woodlawn', value: 244 },
    ]
  },
  {
    label: 'Brooklyn',
    value: 300,
    neighborhoods: [
      { label: 'Bath Beach', value: 336 },
      { label: 'Bay Ridge', value: 331 },
      { label: 'Bedford-Stuyvesant', value: 310 },
      { label: 'Bensonhurst', value: 334 },
      { label: 'Boerum Hill', value: 306 },
      { label: 'Borough Park', value: 338 },
      { label: 'Brighton Beach', value: 342 },
      { label: 'Brooklyn Heights', value: 305 },
      { label: 'Bushwick', value: 313 },
      { label: 'Carroll Gardens', value: 321 },
      { label: 'Clinton Hill', value: 364 },
      { label: 'Cobble Hill', value: 322 },
      { label: 'Coney Island', value: 341 },
      { label: 'Crown Heights', value: 325 },
      { label: 'DUMBO', value: 307 },
      { label: 'Ditmas Park', value: 343 },
      { label: 'Downtown Brooklyn', value: 303 },
      { label: 'Dyker Heights', value: 332 },
      { label: 'East New York', value: 314 },
      { label: 'Flatbush', value: 346 },
      { label: 'Fort Greene', value: 304 },
      { label: 'Gowanus', value: 320 },
      { label: 'Gravesend', value: 337 },
      { label: 'Greenpoint', value: 301 },
      { label: 'Kensington', value: 340 },
      { label: 'Marine Park', value: 361 },
      { label: 'Midwood', value: 348 },
      { label: 'Park Slope', value: 319 },
      { label: 'Prospect Heights', value: 326 },
      { label: 'Red Hook', value: 318 },
      { label: 'Sheepshead Bay', value: 349 },
      { label: 'Sunset Park', value: 323 },
      { label: 'Williamsburg', value: 302 },
      { label: 'Windsor Terrace', value: 324 },
    ]
  },
  {
    label: 'Queens',
    value: 400,
    neighborhoods: [
      { label: 'Astoria', value: 401 },
      { label: 'Bayside', value: 428 },
      { label: 'Corona', value: 409 },
      { label: 'Elmhurst', value: 408 },
      { label: 'Flushing', value: 416 },
      { label: 'Forest Hills', value: 415 },
      { label: 'Fresh Meadows', value: 419 },
      { label: 'Howard Beach', value: 425 },
      { label: 'Jackson Heights', value: 405 },
      { label: 'Jamaica', value: 432 },
      { label: 'Kew Gardens', value: 424 },
      { label: 'Long Island City', value: 402 },
      { label: 'Maspeth', value: 410 },
      { label: 'Middle Village', value: 411 },
      { label: 'Ozone Park', value: 426 },
      { label: 'Rego Park', value: 414 },
      { label: 'Richmond Hill', value: 423 },
      { label: 'Ridgewood', value: 412 },
      { label: 'Rockaways', value: 477 },
      { label: 'Sunnyside', value: 403 },
      { label: 'Whitestone', value: 417 },
      { label: 'Woodhaven', value: 422 },
      { label: 'Woodside', value: 404 },
    ]
  },
  {
    label: 'Manhattan',
    value: 100,
    neighborhoods: [
      { label: 'Battery Park City', value: 112 },
      { label: 'Chelsea', value: 115 },
      { label: 'Chinatown', value: 110 },
      { label: 'Civic Center', value: 103 },
      { label: 'East Village', value: 117 },
      { label: 'Financial District', value: 104 },
      { label: 'Flatiron', value: 158 },
      { label: 'Gramercy Park', value: 113 },
      { label: 'Greenwich Village', value: 116 },
      { label: 'Harlem', value: 154 },
      { label: 'Hell\'s Kitchen', value: 152 },
      { label: 'Inwood', value: 150 },
      { label: 'Kips Bay', value: 133 },
      { label: 'Little Italy', value: 108 },
      { label: 'Lower East Side', value: 109 },
      { label: 'Midtown', value: 120 },
      { label: 'Midtown East', value: 123 },
      { label: 'Midtown West', value: 124 },
      { label: 'Morningside Heights', value: 147 },
      { label: 'Murray Hill', value: 130 },
      { label: 'NoHo', value: 118 },
      { label: 'NoLiTa', value: 162 },
      { label: 'Roosevelt Island', value: 101 },
      { label: 'SoHo', value: 107 },
      { label: 'Stuyvesant Town/PCV', value: 106 },
      { label: 'TriBeCa', value: 105 },
      { label: 'Upper East Side', value: 140 },
      { label: 'Upper West Side', value: 137 },
      { label: 'Washington Heights', value: 149 },
      { label: 'West Village', value: 157 },
    ]
  },
  {
    label: 'Staten Island',
    value: 200,
    neighborhoods: [
      { label: 'Annadale', value: 507 },
      { label: 'Arden Heights', value: 508 },
      { label: 'Castleton Corners', value: 516 },
      { label: 'Clifton', value: 519 },
      { label: 'Dongan Hills', value: 522 },
      { label: 'Eltingville', value: 525 },
      { label: 'Great Kills', value: 531 },
      { label: 'Mariners Harbor', value: 544 },
      { label: 'New Dorp', value: 548 },
      { label: 'New Springville', value: 549 },
      { label: 'Port Richmond', value: 556 },
      { label: 'Rossville', value: 563 },
      { label: 'Saint George', value: 569 },
      { label: 'Stapleton', value: 571 },
      { label: 'Todt Hill', value: 575 },
      { label: 'Tottenville', value: 577 },
      { label: 'West Brighton', value: 580 },
    ]
  },
];
