#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import path from "path";

// Find all TypeScript/JavaScript files in src directory
const files = glob.sync("src/**/*.{ts,tsx,js,jsx}", {
  ignore: ["node_modules/**", ".next/**", "out/**", "build/**"],
});

console.log(`Found ${files.length} files to process...`);

let totalFixed = 0;

files.forEach((filePath) => {
  const content = readFileSync(filePath, "utf8");
  let newContent = content;
  let fileFixed = 0;

  // Fix relative imports to absolute imports
  // Pattern 1: ./something -> @/path/to/current/dir/something
  // Pattern 2: ../something -> @/path/to/parent/dir/something

  const lines = content.split("\n");
  const newLines = lines.map((line) => {
    // Match import statements with relative paths
    const importMatch = line.match(
      /^(\s*(?:import|export).*from\s+['"])(\.\.?\/[^'"]*)(['"].*)/
    );

    if (importMatch) {
      const [, prefix, relativePath, suffix] = importMatch;

      // Calculate the absolute path
      const currentDir = path.dirname(filePath);
      const absolutePath = path.resolve(currentDir, relativePath);
      const srcIndex = absolutePath.indexOf("/src/");

      if (srcIndex !== -1) {
        // Convert to @/ path
        const srcRelativePath = absolutePath.substring(srcIndex + 5); // Remove '/src/'
        const newImportPath = `@/${srcRelativePath}`;
        const newLine = `${prefix}${newImportPath}${suffix}`;

        console.log(`  ${filePath}: ${relativePath} -> ${newImportPath}`);
        fileFixed++;
        return newLine;
      }
    }

    return line;
  });

  if (fileFixed > 0) {
    newContent = newLines.join("\n");
    writeFileSync(filePath, newContent, "utf8");
    totalFixed += fileFixed;
  }
});

console.log(
  `\nFixed ${totalFixed} relative imports across ${files.length} files.`
);
