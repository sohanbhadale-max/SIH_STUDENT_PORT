import crypto from 'crypto'

// Secret key for AES-256-GCM encryption & HMAC signing
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'skillbridge-hyper-secure-aes-256-key-32b'
const KEY_32_BYTES = crypto.createHash('sha256').update(SECRET_KEY).digest()

/**
 * Generate SHA-256 Tamper-Evident Hash for Audit Logs
 */
export function generateAuditHash(payload) {
  const dataString = typeof payload === 'object' ? JSON.stringify(payload) : String(payload)
  return crypto.createHash('sha256').update(dataString + SECRET_KEY).digest('hex')
}

/**
 * AES-256-GCM Encryption for sensitive user data & document payloads
 */
export function encryptAES256(text) {
  if (!text) return text
  const iv = crypto.randomBytes(12) // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_32_BYTES, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag
  }
}

/**
 * AES-256-GCM Decryption
 */
export function decryptAES256(encryptedObj) {
  if (!encryptedObj || !encryptedObj.ciphertext) return ''
  const iv = Buffer.from(encryptedObj.iv, 'hex')
  const authTag = Buffer.from(encryptedObj.authTag, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_32_BYTES, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encryptedObj.ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Role-Based Access Control (RBAC) Middleware
 */
export function enforceRole(allowedRoles = []) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || 'student'
    if (!allowedRoles.includes(userRole) && !allowedRoles.includes('*')) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges for this role.',
        requiredRoles: allowedRoles,
        userRole
      })
    }
    next()
  }
}
