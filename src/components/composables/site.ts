export function isLocalNetwork(hostname: string = window.location.hostname) {
  return (
    (['localhost', '127.0.0.1', '', '::1'].includes(hostname)) ||
    (hostname.startsWith('192.168.')) ||
    (hostname.startsWith('10.')) ||
    (hostname.endsWith('.local'))
  )
}

export function isHttps(location: Location = window.location) {
  return location.protocol === 'https:'
}

export function redirectToHttp() {
  if (window.location.protocol == 'https:') {
    window.location.href = window.location.href.replace(/^https:/, 'http:')
  }
}

export function redirectToHttps() {
  if (window.location.protocol == 'http:') {
    window.location.href = window.location.href.replace(/^http:/, 'https:')
  }
}
