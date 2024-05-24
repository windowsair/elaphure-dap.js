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
  if (window.location.protocol === 'https:') {
    const url: URL = new URL(window.location.href)

    /**
     * Once we are in the https context, we can't just switch to http on port 80.
     * So we try to use port 8080, where the web server will use a 301 redirect
     * to port 80.
     */
    url.port = '8080'
    url.protocol = 'http:'

    window.location.href = url.toString()
  }
}

export function redirectToHttps() {
  if (window.location.protocol === 'http:') {
    window.location.protocol = 'https:'
  }
}
