import { readdir } from 'fs/promises'
import { resolve } from 'path'

const getEntries = async (dirName) => {
    let entries = {}
    const items = await readdir(dirName, { withFileTypes: true })

    for (const item of items) {
        if (item.isDirectory()) {
            entries = {
                ...entries,
                ...(await getEntries(`${dirName}/${item.name}`)),
            }
        } else if (item.name.endsWith('.html')) {
            // entries.push(`${dirName}/${item.name}`)
            entries[`${dirName}/${item.name}`] = resolve(
                __dirname,
                `${dirName}/${item.name}`
            )
        }
    }

    return entries
}

// getEntries('src').then((files) => console.log(files))
export default getEntries
