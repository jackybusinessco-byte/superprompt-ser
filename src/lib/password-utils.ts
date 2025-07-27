/**
 * Hash a password using SHA-256 and return as lowercase hex string
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password as lowercase hex string
 */
export async function hashPassword(password: string): Promise<string> {
  // Convert the password string to a Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert the hash buffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex.toLowerCase()
}

/**
 * Verify a password against a hashed password
 * @param {string} password - The plain text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
} 