/**
 * 암호화 유틸리티 (Web Crypto API)
 */

/**
 * 비밀번호에서 암호화 키 생성 (PBKDF2)
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // 비밀번호를 CryptoKey로 변환
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // PBKDF2로 AES 키 생성
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // OWASP 권장
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Salt 생성
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * IV (Initialization Vector) 생성
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * 데이터 암호화 (AES-GCM)
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{
  ciphertext: string;
  iv: string;
}> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const iv = generateIV();

  // 암호화
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );

  // Base64 인코딩
  const ciphertext = bufferToBase64(encryptedBuffer);
  const ivBase64 = bufferToBase64(iv);

  return {
    ciphertext,
    iv: ivBase64
  };
}

/**
 * 데이터 복호화 (AES-GCM)
 */
export async function decryptData(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  try {
    const ciphertextBuffer = base64ToBuffer(ciphertext);
    const ivBuffer = base64ToBuffer(iv);

    // 복호화
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('복호화에 실패했습니다. 비밀번호를 확인해주세요.');
  }
}

/**
 * 비밀번호 해싱 (SHA-256)
 *
 * ⚠️ 주의: 클라이언트 사이드 해싱은 보안 강화용이지만
 * 실제 인증은 서버에서 bcrypt 등으로 해야 함
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return bufferToBase64(hashBuffer);
}

/**
 * ArrayBuffer를 Base64로 변환
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64를 ArrayBuffer로 변환
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 무작위 토큰 생성
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToBase64(array);
}

/**
 * 안전한 비밀번호 생성
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}
