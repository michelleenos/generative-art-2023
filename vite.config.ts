import { defineConfig } from 'vite'
import { resolve } from 'path'
import inject from '@rollup/plugin-inject'
import getEntries from './get-entries'

let entries = await getEntries('src')
console.log(entries)

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
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                ...entries,
                // './src/0128/index.html': resolve(
                //     __dirname,
                //     'src/0128/index.html'
                // ),
            },
        },
    },
})
