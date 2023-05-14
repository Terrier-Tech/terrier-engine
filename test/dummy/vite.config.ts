import { defineConfig } from "vite"
import RubyPlugin from "vite-plugin-ruby"
import path from "path"

export default defineConfig({
    plugins: [RubyPlugin()],
    server: {
        hmr: {
            host: "localhost",
            protocol: "ws",
        },
    },
    build: {
        minify: true
    },
    esbuild: {
        keepNames: true
    },
    resolve: {
        alias: {
            '@terrier': path.resolve('../../app/frontend/terrier'),
            '@data-dive': path.resolve('../../app/frontend/data-dive'),
        },
    }
});
