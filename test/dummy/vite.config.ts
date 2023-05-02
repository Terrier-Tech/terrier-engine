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
    resolve: {
        alias: {
            '@tap': path.resolve('../../app/frontend/tap')
        }
    }
});
