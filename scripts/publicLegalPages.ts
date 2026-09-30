import type { Plugin } from 'vite'

/** Vite dev cần ánh xạ clean URL trước middleware SPA; Hosting/preview đã hỗ trợ. */
export function publicLegalPages(): Plugin {
  return {
    name: 'public-legal-pages',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD') {
          req.url = req.url?.replace(/^\/(privacy|terms)\/?(?=\?|$)/, '/$1.html')
        }
        next()
      })
    },
  }
}
