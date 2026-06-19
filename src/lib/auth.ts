const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
const SESSION_KEY = 'gtf_admin_session';

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}
