export function buildAuthHeaders(token) {
  if (typeof token !== 'string' || !token.trim() || /[\r\n]/.test(token)) {
    throw Object.assign(new Error('Missing or invalid API token'), { code: 'CONFIGURATION_ERROR' });
  }
  return { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Authorization: 'Bearer ' + token };
}
