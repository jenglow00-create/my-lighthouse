/**
 * 데이터 무결성 검증
 */

/**
 * HMAC 생성
 */
export async function generateHMAC(
  data: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    dataBuffer
  );

  // Base64 인코딩
  return bufferToBase64(signature);
}

/**
 * HMAC 검증
 */
export async function verifyHMAC(
  data: string,
  hmac: string,
  key: CryptoKey
): Promise<boolean> {
  try {
    const expectedHMAC = await generateHMAC(data, key);
    return expectedHMAC === hmac;
  } catch (error) {
    return false;
  }
}

/**
 * HMAC 키 생성
 */
export async function generateHMACKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    true, // extractable
    ['sign', 'verify']
  );
}

/**
 * 키를 Base64로 내보내기
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

/**
 * Base64 키를 CryptoKey로 가져오기
 */
export async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(keyBase64);

  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  );
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
