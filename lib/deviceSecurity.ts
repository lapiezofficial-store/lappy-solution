import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ApprovedDevice {
  deviceId: string;
  deviceName: string;
  deviceInfo: string;
  ip: string;
  approvedAt: string;
  approvedBy: string;
  token256: string;
  lastUsedAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface PendingDeviceRequest {
  deviceId: string;
  deviceCode: string; // 6-digit code e.g. "842195"
  deviceName: string;
  deviceInfo: string;
  ip: string;
  requestedAt: string;
  expiresAt: number;
}

export interface MasterEmergencyKey {
  id: string; // 'KEY_OWNER_1' | 'KEY_OWNER_2'
  passkey: string;
  name: string;
  ownerPhone: string;
  maxUses: number;
  usedCount: number;
  isExpired: boolean;
  history: Array<{ usedAt: string; ip: string; deviceId: string }>;
}

const SECRET = process.env.DEVICE_SECURITY_SECRET || 
  process.env.ADMIN_SESSION_SECRET || 
  'lapiez-super-secure-256-bit-device-authorization-key-2026';

const OWNER_MASTER_PIN = process.env.OWNER_MASTER_PIN || '960882';

const DATA_DIR = path.join(process.cwd(), 'data');
const DEVICES_FILE = path.join(DATA_DIR, 'admin_devices.json');
const EMERGENCY_KEYS_FILE = path.join(DATA_DIR, 'master_emergency_keys.json');

// Default 2 Emergency Master Passkeys (strictly 2 uses each, then expire permanently)
const DEFAULT_EMERGENCY_KEYS: Record<string, MasterEmergencyKey> = {
  'LPZ-OWNER1-2026': {
    id: 'KEY_OWNER_1',
    passkey: 'LPZ-OWNER1-2026',
    name: 'Store Owner 1 (Primary Malik)',
    ownerPhone: '+91 96088 28288',
    maxUses: 2,
    usedCount: 0,
    isExpired: false,
    history: [],
  },
  'LPZ-OWNER2-2026': {
    id: 'KEY_OWNER_2',
    passkey: 'LPZ-OWNER2-2026',
    name: 'Store Owner 2 (Co-Owner)',
    ownerPhone: '+91 96088 28288',
    maxUses: 2,
    usedCount: 0,
    isExpired: false,
    history: [],
  },
};

// In-memory cache
interface DeviceStore {
  approvedDevices: Record<string, ApprovedDevice>;
  pendingRequests: Record<string, PendingDeviceRequest>;
  emergencyKeys: Record<string, MasterEmergencyKey>;
}

let memoryStore: DeviceStore = {
  approvedDevices: {},
  pendingRequests: {},
  emergencyKeys: { ...DEFAULT_EMERGENCY_KEYS },
};

let isInitialized = false;

function ensureDataFile() {
  if (isInitialized) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DEVICES_FILE)) {
      const content = fs.readFileSync(DEVICES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore.approvedDevices = parsed.approvedDevices || {};
      memoryStore.pendingRequests = parsed.pendingRequests || {};
    } else {
      saveStore();
    }

    if (fs.existsSync(EMERGENCY_KEYS_FILE)) {
      const content = fs.readFileSync(EMERGENCY_KEYS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore.emergencyKeys = {
        ...DEFAULT_EMERGENCY_KEYS,
        ...parsed,
      };
    } else {
      saveEmergencyKeys();
    }
  } catch (err) {
    console.warn('[DEVICE_SECURITY] File persistence fallback to in-memory:', err);
  }
  isInitialized = true;
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      DEVICES_FILE, 
      JSON.stringify({ 
        approvedDevices: memoryStore.approvedDevices, 
        pendingRequests: memoryStore.pendingRequests 
      }, null, 2), 
      'utf-8'
    );
  } catch (err) {
    console.warn('[DEVICE_SECURITY] Could not save store to disk:', err);
  }
}

function saveEmergencyKeys() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(EMERGENCY_KEYS_FILE, JSON.stringify(memoryStore.emergencyKeys, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DEVICE_SECURITY] Could not save emergency keys to disk:', err);
  }
}

/**
 * Get emergency keys summary for security dashboard
 */
export function getEmergencyKeysSummary() {
  ensureDataFile();
  return Object.values(memoryStore.emergencyKeys).map((k) => ({
    id: k.id,
    passkey: k.passkey,
    name: k.name,
    ownerPhone: k.ownerPhone,
    maxUses: k.maxUses,
    usedCount: k.usedCount,
    remainingUses: Math.max(0, k.maxUses - k.usedCount),
    isExpired: k.isExpired || k.usedCount >= k.maxUses,
    history: k.history,
  }));
}

/**
 * Verify and consume a 2-use Master Emergency Passkey
 */
export function verifyAndConsumeEmergencyKey(
  submittedKey: string,
  deviceId: string,
  ip: string
): { success: boolean; token?: string; remainingUses?: number; ownerName?: string; error?: string } {
  if (!submittedKey || typeof submittedKey !== 'string') {
    return { success: false, error: 'Empty key provided.' };
  }
  ensureDataFile();
  const cleanKey = submittedKey.trim().toUpperCase();

  let targetEntry: MasterEmergencyKey | null = null;
  for (const item of Object.values(memoryStore.emergencyKeys)) {
    if (item.passkey.toUpperCase() === cleanKey) {
      targetEntry = item;
      break;
    }
  }

  if (!targetEntry) {
    return { success: false, error: 'Invalid Emergency Passkey.' };
  }

  if (targetEntry.isExpired || targetEntry.usedCount >= targetEntry.maxUses) {
    return {
      success: false,
      error: `This Emergency Master Key (${targetEntry.passkey}) has already reached its limit of ${targetEntry.maxUses} uses and is EXPIRED.`,
    };
  }

  // Consume 1 use
  targetEntry.usedCount += 1;
  targetEntry.history.push({
    usedAt: new Date().toISOString(),
    ip: ip || 'unknown',
    deviceId: deviceId || 'unknown',
  });

  if (targetEntry.usedCount >= targetEntry.maxUses) {
    targetEntry.isExpired = true;
  }

  saveEmergencyKeys();

  // Approve this device permanently
  const { token } = approveDevice({
    deviceId: deviceId || `dev_emergency_${Date.now()}`,
    deviceName: `${targetEntry.name} Emergency Login`,
    ip,
    approvedBy: `Emergency Master Key: ${targetEntry.passkey} (Use ${targetEntry.usedCount}/${targetEntry.maxUses})`,
  });

  const remaining = Math.max(0, targetEntry.maxUses - targetEntry.usedCount);
  return {
    success: true,
    token,
    remainingUses: remaining,
    ownerName: targetEntry.name,
  };
}

/**
 * Generate 256-bit cryptographically secure token
 */
export function generate256BitToken(): string {
  return randomBytes(32).toString('hex'); // 64 hex chars = 256 bits of entropy
}

/**
 * Sign a token using HMAC-SHA256
 */
export function sign256(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('hex');
}

/**
 * Check if the system has any approved active devices registered
 */
export function hasAnyApprovedDevices(): boolean {
  ensureDataFile();
  return Object.values(memoryStore.approvedDevices).some((d) => d.status === 'ACTIVE');
}

/**
 * Constant-time safe string comparison
 */
function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify 256-bit token
 */
export function verify256BitDeviceToken(deviceId: string, token: string): boolean {
  if (!deviceId || !token || typeof token !== 'string') return false;
  ensureDataFile();

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [tokenDevId, raw256, signature] = parts;

  if (tokenDevId !== deviceId) return false;
  const expectedSig = sign256(`${tokenDevId}.${raw256}`);
  if (!safeEqual(signature, expectedSig)) return false;

  // Check in store
  const record = memoryStore.approvedDevices[deviceId];
  if (!record || record.status !== 'ACTIVE') return false;

  // Update last used time in background
  record.lastUsedAt = new Date().toISOString();
  return true;
}

/**
 * Verify if device is approved
 */
export function isDeviceApproved(deviceId: string, authCookieOrToken?: string | null): boolean {
  if (!deviceId) return false;
  ensureDataFile();

  const record = memoryStore.approvedDevices[deviceId];
  if (!record || record.status !== 'ACTIVE') return false;

  if (authCookieOrToken) {
    return verify256BitDeviceToken(deviceId, authCookieOrToken);
  }

  return true;
}

/**
 * Register a new device pending approval
 */
export function registerPendingDevice(params: {
  deviceId: string;
  deviceName?: string;
  deviceInfo?: string;
  ip?: string;
}): { deviceCode: string; expiresAt: number } {
  ensureDataFile();
  const { deviceId, deviceName, deviceInfo, ip } = params;

  // Generate 6-digit random code
  const codeNum = Math.floor(100000 + Math.random() * 900000);
  const deviceCode = String(codeNum);
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

  memoryStore.pendingRequests[deviceId] = {
    deviceId,
    deviceCode,
    deviceName: deviceName || 'Unknown Device',
    deviceInfo: deviceInfo || 'Browser / Web Client',
    ip: ip || 'unknown',
    requestedAt: new Date().toISOString(),
    expiresAt,
  };

  saveStore();
  return { deviceCode, expiresAt };
}

/**
 * Approve a device
 */
export function approveDevice(params: {
  deviceId: string;
  deviceName?: string;
  deviceInfo?: string;
  ip?: string;
  approvedBy?: string;
}): { token: string; device: ApprovedDevice } {
  ensureDataFile();
  const { deviceId, deviceName, deviceInfo, ip, approvedBy } = params;

  const raw256 = generate256BitToken();
  const signature = sign256(`${deviceId}.${raw256}`);
  const token = `${deviceId}.${raw256}.${signature}`;

  const approvedDevice: ApprovedDevice = {
    deviceId,
    deviceName: deviceName || memoryStore.pendingRequests[deviceId]?.deviceName || 'Approved Admin Device',
    deviceInfo: deviceInfo || memoryStore.pendingRequests[deviceId]?.deviceInfo || 'Secure Browser',
    ip: ip || memoryStore.pendingRequests[deviceId]?.ip || 'verified',
    approvedAt: new Date().toISOString(),
    approvedBy: approvedBy || 'Store Owner',
    token256: token,
    lastUsedAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  memoryStore.approvedDevices[deviceId] = approvedDevice;
  delete memoryStore.pendingRequests[deviceId];
  saveStore();

  return { token, device: approvedDevice };
}

/**
 * Verify Owner PIN (Master Malik Key - Supports Owner 1 and Owner 2)
 */
export function verifyOwnerPin(pin: string): { isValid: boolean; ownerName?: string } {
  if (!pin || typeof pin !== 'string') return { isValid: false };
  const clean = pin.trim();

  // Owner 1 (Primary Malik)
  if (clean === '960882' || clean === '9608828288' || clean === OWNER_MASTER_PIN) {
    return { isValid: true, ownerName: 'Store Owner 1 (Primary Malik)' };
  }

  // Owner 2 (Co-Owner)
  if (clean === '822114' || clean === '82211482') {
    return { isValid: true, ownerName: 'Store Owner 2 (Co-Owner)' };
  }

  return { isValid: false };
}

/**
 * Approve device using 6-digit code and Owner PIN or Emergency Key
 */
export function verifyAndApproveWithPin(params: {
  deviceId: string;
  pin: string;
  deviceInfo?: string;
  ip?: string;
}): { success: boolean; token?: string; error?: string } {
  const { deviceId, pin, deviceInfo, ip } = params;

  // First check if it's an emergency 2-use key
  const emergencyCheck = verifyAndConsumeEmergencyKey(pin, deviceId, ip || 'direct');
  if (emergencyCheck.success && emergencyCheck.token) {
    return { success: true, token: emergencyCheck.token };
  }

  // Check Owner PIN (Owner 1 or Owner 2)
  const pinVerification = verifyOwnerPin(pin);
  if (!pinVerification.isValid) {
    return { success: false, error: emergencyCheck.error && pin.length > 6 ? emergencyCheck.error : 'Invalid Owner Master PIN. Access Denied.' };
  }

  const { token } = approveDevice({
    deviceId,
    deviceInfo,
    ip,
    approvedBy: `${pinVerification.ownerName} PIN Verification`,
  });

  return { success: true, token };
}

/**
 * Revoke an approved device
 */
export function revokeDevice(deviceId: string): boolean {
  ensureDataFile();
  if (memoryStore.approvedDevices[deviceId]) {
    memoryStore.approvedDevices[deviceId].status = 'REVOKED';
    saveStore();
    return true;
  }
  return false;
}

/**
 * Delete device completely from registry
 */
export function removeDevice(deviceId: string): boolean {
  ensureDataFile();
  let deleted = false;
  if (memoryStore.approvedDevices[deviceId]) {
    delete memoryStore.approvedDevices[deviceId];
    deleted = true;
  }
  if (memoryStore.pendingRequests[deviceId]) {
    delete memoryStore.pendingRequests[deviceId];
    deleted = true;
  }
  saveStore();
  return deleted;
}

/**
 * List all approved and pending devices
 */
export function listAllDevices(): {
  approved: ApprovedDevice[];
  pending: PendingDeviceRequest[];
} {
  ensureDataFile();
  const now = Date.now();

  // Clean expired pending requests
  for (const [id, req] of Object.entries(memoryStore.pendingRequests)) {
    if (req.expiresAt < now) {
      delete memoryStore.pendingRequests[id];
    }
  }

  return {
    approved: Object.values(memoryStore.approvedDevices).filter((d) => d.status === 'ACTIVE'),
    pending: Object.values(memoryStore.pendingRequests),
  };
}

export const DEVICE_AUTH_COOKIE = {
  name: 'lapiez_device_auth',
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 Year Persistent Device Trust
  },
};

