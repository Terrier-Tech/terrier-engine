import { defineConfig } from "vite";
import RubyPlugin from "vite-plugin-ruby";

export default defineConfig({
    plugins: [RubyPlugin()],
    server: {
        hmr: {
            host: "localhost",
            protocol: "ws",
        },
    },
});
