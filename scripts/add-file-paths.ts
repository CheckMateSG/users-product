// scripts/add-file-paths.ts
import * as fs from "fs"
import * as path from "path"

const rootDir = path.join(__dirname, "..")

function addFilePath(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf8")
  const relativePath = path.relative(rootDir, filePath)

  // Skip if file already has a path comment
  if (content.startsWith("// ")) {
    return
  }

  const newContent = `// ${relativePath}\n${content}`
  fs.writeFileSync(filePath, newContent)
}

function processDirectory(dir: string): void {
  try {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      // Skip node_modules and .git directories
      if (file === "node_modules" || file === ".git") {
        return
      }

      if (stat.isDirectory()) {
        processDirectory(fullPath)
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        console.log(`Processing: ${fullPath}`)
        addFilePath(fullPath)
      }
    })
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error)
  }
}

console.log("Starting to process files...")
processDirectory(rootDir)
console.log("Finished processing files.")
