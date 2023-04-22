import { defineConfig } from 'vite'
import { resolve } from 'path'
import inject from '@rollup/plugin-inject'

export default defineConfig({
    root: 'src',
    resolve: {
        alias: {
            '~/': `${resolve(__dirname, 'src')}/`,
        },
    },
    // https://github.com/processing/p5.js/issues/4479#issuecomment-1454863540
    plugins: [
        inject({
            p5: 'p5',
        }),
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
})
