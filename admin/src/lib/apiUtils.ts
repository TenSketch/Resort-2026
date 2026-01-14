/**
 * Utility for making authenticated API calls with automatic token validation
 */

export const handleAuthError = (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    // Token is invalid or expired
    localStorage.removeItem('admin_token')
    // Trigger auth state update
    window.dispatchEvent(new Event('admin-auth-changed'))
    // Redirect to login
    window.location.href = '/auth/login'
    return true
  }
  return false
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin_token')
  
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // Auto-logout on auth errors
  if (handleAuthError(response)) {
    throw new Error('Authentication failed. Please login again.')
  }
  
  return response
}
