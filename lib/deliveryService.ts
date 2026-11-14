import fs from 'fs';
import path from 'path';

export interface DeliverySlab {
  id: string;
  name: string;
  minKm: number;
  maxKm: number;
  price: number;
  estimatedTime: string;
  description: string;
  popularAreas: string[];
}

export interface DeliverySettings {
  enabled: boolean;
  freeDeliveryAbove: number; // e.g. 5000 (0 to disable)
  storeCoordinates: {
    lat: number;
    lng: number;
    address: string;
  };
  slabs: DeliverySlab[];
}

export interface CustomerLocationRecord {
  id: string;
  area: string;
  city: string;
  pincode: string;
  landmark?: string;
  distanceKm: number;
  distanceSlab: string;
  deliveryFee: number;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  enabled: true,
  freeDeliveryAbove: 5000,
  storeCoordinates: {
    lat: 24.1611,
    lng: 83.8055,
    address: 'Chiniya Road, Garhwa, Jharkhand - 822114',
  },
  slabs: [
    {
      id: 'slab-1',
      name: 'Garhwa Town Core',
      minKm: 0,
      maxKm: 5,
      price: 0, // Free inside Garhwa Town
      estimatedTime: '30 - 60 mins',
      description: 'Chiniya Rd, Main Market, Tandwa, Sahijana, Bus Stand',
      popularAreas: ['Main Market', 'Chiniya Road', 'Tandwa', 'Sahijana', 'Dipauwa', 'Bus Stand', 'Kachahri Road'],
    },
    {
      id: 'slab-2',
      name: 'Garhwa Outskirts & Rural',
      minKm: 5,
      maxKm: 15,
      price: 60,
      estimatedTime: '2 - 4 hours',
      description: 'Meral, Bishunpur, Pipra, Kalyanpur, Koradih',
      popularAreas: ['Meral', 'Bishunpur', 'Pipra', 'Kalyanpur', 'Pachkediya', 'Koradih'],
    },
    {
      id: 'slab-3',
      name: 'Nearby Block HQs',
      minKm: 15,
      maxKm: 35,
      price: 120,
      estimatedTime: 'Same-Day Evening',
      description: 'Majhiaon, Ranka, Rehla, Bishrampur, Nagar Untari, Ramna',
      popularAreas: ['Majhiaon', 'Ranka', 'Rehla', 'Bishrampur', 'Nagar Untari', 'Ramna', 'Chiniya Rural'],
    },
    {
      id: 'slab-4',
      name: 'Palamu & Outer Districts',
      minKm: 35,
      maxKm: 100,
      price: 200,
      estimatedTime: 'Next-Day Fast Delivery',
      description: 'Daltonganj (Medininagar), Bhawanathpur, Latehar, Outer Region',
      popularAreas: ['Daltonganj', 'Medininagar', 'Bhawanathpur', 'Latehar', 'Chainpur', 'Satbarwa'],
    },
  ],
};

const DATA_DIR = path.join(process.cwd(), 'data');
const RATES_FILE = path.join(DATA_DIR, 'delivery_rates.json');
const LOCATIONS_FILE = path.join(DATA_DIR, 'customer_locations.json');

// In-memory caches
let cachedSettings: DeliverySettings | null = null;
let cachedLocations: CustomerLocationRecord[] | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

export function getDeliverySettings(): DeliverySettings {
  if (cachedSettings) return cachedSettings;

  ensureDataDir();
  try {
    if (fs.existsSync(RATES_FILE)) {
      const data = fs.readFileSync(RATES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.slabs) && parsed.slabs.length > 0) {
        cachedSettings = {
          ...DEFAULT_DELIVERY_SETTINGS,
          ...parsed,
          slabs: parsed.slabs,
        };
        return cachedSettings!;
      }
    }
  } catch (e) {
    console.error('Error reading delivery rates file:', e);
  }

  cachedSettings = { ...DEFAULT_DELIVERY_SETTINGS };
  try {
    fs.writeFileSync(RATES_FILE, JSON.stringify(cachedSettings, null, 2), 'utf-8');
  } catch (e) {}

  return cachedSettings;
}

export function saveDeliverySettings(newSettings: Partial<DeliverySettings>): DeliverySettings {
  const current = getDeliverySettings();
  const merged: DeliverySettings = {
    ...current,
    ...newSettings,
    slabs: newSettings.slabs || current.slabs,
  };

  cachedSettings = merged;
  ensureDataDir();
  try {
    fs.writeFileSync(RATES_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing delivery rates file:', e);
  }

  return merged;
}

export function calculateDeliveryFee(
  distanceKm: number,
  subtotal: number = 0
): { fee: number; isFree: boolean; slab: DeliverySlab } {
  const settings = getDeliverySettings();
  const slabs = settings.slabs;

  // Find matching slab
  const matchedSlab =
    slabs.find((s) => distanceKm >= s.minKm && distanceKm < s.maxKm) ||
    slabs[slabs.length - 1];

  // Check if subtotal qualifies for free delivery
  if (settings.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove) {
    return { fee: 0, isFree: true, slab: matchedSlab };
  }

  return { fee: matchedSlab.price, isFree: matchedSlab.price === 0, slab: matchedSlab };
}

export function recordCustomerLocation(location: {
  area: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  distanceKm: number;
  distanceSlab?: string;
  deliveryFee?: number;
  ip?: string;
  userAgent?: string;
}): CustomerLocationRecord {
  ensureDataDir();
  if (!cachedLocations) {
    try {
      if (fs.existsSync(LOCATIONS_FILE)) {
        const raw = fs.readFileSync(LOCATIONS_FILE, 'utf-8');
        cachedLocations = JSON.parse(raw);
      }
    } catch {
      cachedLocations = [];
    }
  }
  if (!Array.isArray(cachedLocations)) {
    cachedLocations = [];
  }

  const { fee, slab } = calculateDeliveryFee(location.distanceKm);

  const record: CustomerLocationRecord = {
    id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    area: location.area || 'Garhwa Town',
    city: location.city || 'Garhwa',
    pincode: location.pincode || '822114',
    landmark: location.landmark,
    distanceKm: Math.round(location.distanceKm * 10) / 10,
    distanceSlab: location.distanceSlab || slab.name,
    deliveryFee: location.deliveryFee !== undefined ? location.deliveryFee : fee,
    ip: location.ip,
    userAgent: location.userAgent,
    timestamp: new Date().toISOString(),
  };

  // Keep last 100 locations
  cachedLocations = [record, ...cachedLocations.slice(0, 99)];

  try {
    fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(cachedLocations, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing customer locations file:', e);
  }

  return record;
}

export function getRecentCustomerLocations(limit: number = 30): CustomerLocationRecord[] {
  if (cachedLocations) {
    return cachedLocations.slice(0, limit);
  }

  ensureDataDir();
  try {
    if (fs.existsSync(LOCATIONS_FILE)) {
      const raw = fs.readFileSync(LOCATIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedLocations = parsed;
        return cachedLocations.slice(0, limit);
      }
    }
  } catch (e) {
    console.error('Error reading customer locations file:', e);
  }

  cachedLocations = [];
  return [];
}

