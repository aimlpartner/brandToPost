// vite.config.ts
import tailwindcss from "file:///D:/updated_b2p_prod/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///D:/updated_b2p_prod/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { defineConfig } from "file:///D:/updated_b2p_prod/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///D:/updated_b2p_prod/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "D:\\updated_b2p_prod";
var vite_config_default = defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: false
        },
        includeAssets: ["icon.png"],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api/]
        },
        manifest: {
          name: "BrandToPost",
          short_name: "BrandToPost",
          description: "Turn your Brand Position into weekly, platform-specific campaigns.",
          theme_color: "#0A0A0F",
          background_color: "#0A0A0F",
          display: "standalone",
          icons: [
            {
              src: "icon.png",
              sizes: "192x192 512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, ".")
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      watch: {
        ignored: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/public/campaign_images/**", "**/public/whatsapp_images/**"]
      },
      hmr: process.env.DISABLE_HMR !== "true" ? {
        port: 24678
      } : false
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx1cGRhdGVkX2IycF9wcm9kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx1cGRhdGVkX2IycF9wcm9kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi91cGRhdGVkX2IycF9wcm9kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7ZGVmaW5lQ29uZmlnfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksIFxuICAgICAgdGFpbHdpbmRjc3MoKSxcbiAgICAgIFZpdGVQV0Eoe1xuICAgICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBpbmNsdWRlQXNzZXRzOiBbJ2ljb24ucG5nJ10sXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiAxMDI0LFxuICAgICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpL11cbiAgICAgICAgfSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiAnQnJhbmRUb1Bvc3QnLFxuICAgICAgICAgIHNob3J0X25hbWU6ICdCcmFuZFRvUG9zdCcsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdUdXJuIHlvdXIgQnJhbmQgUG9zaXRpb24gaW50byB3ZWVrbHksIHBsYXRmb3JtLXNwZWNpZmljIGNhbXBhaWducy4nLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnIzBBMEEwRicsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwQTBBMEYnLFxuICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdpY29uLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MiA1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLicpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgLy8gSE1SIGlzIGRpc2FibGVkIGluIEFJIFN0dWRpbyB2aWEgRElTQUJMRV9ITVIgZW52IHZhci5cbiAgICAgIC8vIERvIG5vdCBtb2RpZnlcdTAwRTJcdTAwODBcdTAwOTRmaWxlIHdhdGNoaW5nIGlzIGRpc2FibGVkIHRvIHByZXZlbnQgZmxpY2tlcmluZyBkdXJpbmcgYWdlbnQgZWRpdHMuXG4gICAgICB3YXRjaDoge1xuICAgICAgICBpZ25vcmVkOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsICcqKi9kaXN0LyoqJywgJyoqLy5naXQvKionLCAnKiovcHVibGljL2NhbXBhaWduX2ltYWdlcy8qKicsICcqKi9wdWJsaWMvd2hhdHNhcHBfaW1hZ2VzLyoqJ10sXG4gICAgICB9LFxuICAgICAgaG1yOiBwcm9jZXNzLmVudi5ESVNBQkxFX0hNUiAhPT0gJ3RydWUnID8ge1xuICAgICAgICBwb3J0OiAyNDY3OCxcbiAgICAgIH0gOiBmYWxzZSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStPLE9BQU8saUJBQWlCO0FBQ3ZRLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUSxvQkFBbUI7QUFDM0IsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxNQUFNO0FBQ2hDLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxRQUNkLFlBQVk7QUFBQSxVQUNWLFNBQVM7QUFBQSxRQUNYO0FBQUEsUUFDQSxlQUFlLENBQUMsVUFBVTtBQUFBLFFBQzFCLFNBQVM7QUFBQSxVQUNQLCtCQUErQixJQUFJLE9BQU87QUFBQSxVQUMxQywwQkFBMEIsQ0FBQyxRQUFRO0FBQUEsUUFDckM7QUFBQSxRQUNBLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQWE7QUFBQSxVQUNiLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsY0FDTixTQUFTO0FBQUEsWUFDWDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsR0FBRztBQUFBLE1BQ2xDO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQSxNQUdOLE9BQU87QUFBQSxRQUNMLFNBQVMsQ0FBQyxzQkFBc0IsY0FBYyxjQUFjLGdDQUFnQyw4QkFBOEI7QUFBQSxNQUM1SDtBQUFBLE1BQ0EsS0FBSyxRQUFRLElBQUksZ0JBQWdCLFNBQVM7QUFBQSxRQUN4QyxNQUFNO0FBQUEsTUFDUixJQUFJO0FBQUEsSUFDTjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
