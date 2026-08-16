import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
