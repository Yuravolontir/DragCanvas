import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@craftjs') || id.includes('@mui') || id.includes('@emotion')) {
            return 'editor-vendor';
          }
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
          return undefined;
        },
      },
    },
  },
  server: {
    /**
     * Listen on every interface, and tell the browser where to find the HMR
     * socket.
     *
     * WSL2 in its default NAT mode forwards localhost for plain HTTP but does
     * not reliably carry the WebSocket upgrade, so the page loads and then
     * never updates - Vite prints "failed to connect to websocket" and the tab
     * quietly serves whatever it downloaded first. Combined with the polling
     * watcher below that is a trap: the server sees every edit and the browser
     * hears about none of them.
     *
     * If this still fails, the durable fix is one level down - put
     * `networkingMode=mirrored` in %USERPROFILE%\.wslconfig and run
     * `wsl --shutdown`, which removes the whole class of problem.
     */
    host: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: 5173,
    },
    watch: {
      /**
       * Poll for changes instead of waiting to be told about them.
       *
       * This project lives on /mnt/c - a Windows drive mounted into WSL over
       * 9p - and that filesystem does not deliver inotify events. Vite's
       * watcher therefore hears nothing, serves the modules it transformed at
       * startup, and every edit appears to have no effect until the server is
       * restarted. That failure is nastier than a plain error, because the code
       * on disk is correct and the browser is confidently wrong.
       *
       * Polling costs a little CPU. Silently editing a file that nobody reads
       * costs an afternoon.
       *
       * Not needed if the project is moved onto the Linux filesystem (~/), which
       * would also make installs and builds several times faster.
       */
      usePolling: true,
      interval: 300,
    },
  },
})
