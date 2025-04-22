/* eslint-disable no-console */
const fs = require('fs')
let packageJson = require('../package.json')

// Current Time
const now = new Date()

// Read Markdown File
fs.readFile('CHANGELOG.md', 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }

  // Find Matched Line With `#`
  const regexHash = /^#.*/gm
  const matchedHash = data.match(regexHash)?.[1]

  // Find Matched Data Inside `[]`
  const regexBrackets = /\[(.*?)\]/g
  const matchedBrackets = matchedHash.match(regexBrackets)

  // Current Version
  const version = matchedBrackets[0].replace(/\[|\]/g, '')

  // Deploy Time
  const formattedDate = `${ now.getDate() }-${ (now.getMonth() + 1).toString().padStart(2, '0') }-${ now.getFullYear() } ${ now.getHours() % 12 || 12 }:${ String(now.getMinutes()).padStart(2, '0') }:${ String(now.getSeconds()).padStart(2, '0') } ${ now.getHours() >= 12 ? 'PM' : 'AM' }`

  // Update package.json With New Version And UpdatedAt Time
  packageJson = { ...packageJson, version, updatedAt: formattedDate }

  // Write Updated package.json Back To File
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))
})
