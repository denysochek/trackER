// Web Crypto API implementation for Client-Side Zero-Knowledge Encryption
// Uses PBKDF2 for key derivation + AES-256-GCM for album/track payload encryption

const PBKDF2_ITERATIONS = 100000;

export function generateSalt() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive authentication hash (to verify password match without storing raw password)
export async function hashPasswordForAuth(password, saltHex) {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBytes = hexToBytes(saltHex);
  const authBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );

  return bytesToHex(new Uint8Array(authBits));
}

// Derive AES-256-GCM encryption key from password & salt
export async function deriveEncryptionKey(password, saltHex) {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBytes = hexToBytes(saltHex);
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt any JavaScript object using AES-256-GCM
export async function encryptData(dataObj, cryptoKey) {
  if (!cryptoKey) {
    throw new Error('No encryption key provided');
  }
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(dataObj));

  // Generate unique 12-byte initialization vector (IV) per encryption
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    cryptoKey,
    plaintext
  );

  // Return compact bundle: IV (12 bytes) + Ciphertext as Base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

// Decrypt ciphertext string back into JavaScript object
export async function decryptData(encryptedBase64, cryptoKey) {
  if (!cryptoKey) {
    throw new Error('No encryption key provided');
  }
  const combinedBuffer = base64ToArrayBuffer(encryptedBase64);
  const combinedBytes = new Uint8Array(combinedBuffer);

  // Extract 12-byte IV and Ciphertext
  const iv = combinedBytes.slice(0, 12);
  const ciphertext = combinedBytes.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}
// Export AES-GCM CryptoKey to base64 raw string for session persistence
export async function exportKeyToBase64(cryptoKey) {
  if (!cryptoKey) return null;
  const exported = await window.crypto.subtle.exportKey('raw', cryptoKey);
  return arrayBufferToBase64(exported);
}

// Import base64 raw string back into AES-GCM CryptoKey
export async function importKeyFromBase64(base64Key) {
  if (!base64Key) return null;
  const rawBuffer = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'raw',
    rawBuffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}
