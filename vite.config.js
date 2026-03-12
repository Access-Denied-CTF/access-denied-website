import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        sourcemap: false,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                account: resolve(__dirname, 'account.html'),
                login: resolve(__dirname, 'login.html'),
                signup: resolve(__dirname, 'signup.html'),
                scoreboard: resolve(__dirname, 'scoreboard.html'),
                rules: resolve(__dirname, 'rules.html'),
            },
        },
    },
});
