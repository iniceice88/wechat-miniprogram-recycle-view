const fs = require('fs-extra')

async function copyWxFiles() {
  try {
    await fs.copy('miniprogram/recycle-view', 'dist/recycle-view', {
      filter: (src) => {
        return !src.endsWith('.ts')
      },
    })
  } catch (err) {
    console.error('Error copying files:', err)
  }
}

copyWxFiles()
