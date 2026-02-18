import { defineConfig } from 'vite'
import { resolve } from 'path'
import inject from '@rollup/plugin-inject'
import getEntries from './get-entries'

let entries = await getEntries('src')

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
            sourceMap: false,
        }),
    ],
    optimizeDeps: {
        include: ['p5', 'p5/lib/addons/p5.sound.js'],
    },

    build: {
        outDir: '../dist',
        emptyOutDir: true,
        commonjsOptions: {},
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                ...entries,
            },
        },
    },
})
