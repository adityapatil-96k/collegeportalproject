const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const sourcePath = path.join(root, 'SYSTEM_DIAGRAMS.md');
const outDir = path.join(root, 'diagram_exports');
const tempDir = path.join(outDir, '.tmp');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseDiagrams(markdown) {
  const lines = markdown.split(/\r?\n/);
  const diagrams = [];
  let i = 0;
  while (i < lines.length) {
    const headingMatch = lines[i].match(/^##\s+Fig\s+(\d+)\.(\d+)\s+(.+)$/);
    if (!headingMatch) {
      i += 1;
      continue;
    }

    const figure = `Fig ${headingMatch[1]}.${headingMatch[2]}`;
    const slug = `fig_${headingMatch[1]}_${headingMatch[2]}`;
    const title = headingMatch[3].trim();

    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== '```mermaid') j += 1;
    if (j >= lines.length) {
      throw new Error(`Mermaid block not found for ${figure}`);
    }

    j += 1;
    const codeLines = [];
    while (j < lines.length && lines[j].trim() !== '```') {
      codeLines.push(lines[j]);
      j += 1;
    }
    if (j >= lines.length) {
      throw new Error(`Mermaid block is not closed for ${figure}`);
    }

    diagrams.push({
      figure,
      title,
      slug,
      code: codeLines.join('\n').trim() + '\n',
    });
    i = j + 1;
  }
  return diagrams;
}

function run() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  ensureDir(outDir);
  ensureDir(tempDir);

  const markdown = fs.readFileSync(sourcePath, 'utf8');
  const diagrams = parseDiagrams(markdown);

  if (diagrams.length === 0) {
    throw new Error('No diagrams found in SYSTEM_DIAGRAMS.md');
  }

  const exported = [];

  for (const diagram of diagrams) {
    const inputPath = path.join(tempDir, `${diagram.slug}.mmd`);
    const outputPath = path.join(outDir, `${diagram.slug}.png`);

    fs.writeFileSync(inputPath, diagram.code, 'utf8');

    const cmd = `npx -y @mermaid-js/mermaid-cli -i "${inputPath}" -o "${outputPath}" -s 2`;
    execSync(cmd, { stdio: 'pipe' });

    exported.push({
      file: path.basename(outputPath),
      figure: diagram.figure,
      title: diagram.title,
    });
  }

  fs.rmSync(tempDir, { recursive: true, force: true });

  const indexPath = path.join(outDir, 'index.txt');
  const indexContent = exported
    .map((item) => `${item.file} => ${item.figure} ${item.title}`)
    .join('\n');
  fs.writeFileSync(indexPath, indexContent + '\n', 'utf8');

  console.log(`Exported ${exported.length} diagrams to ${outDir}`);
  for (const item of exported) {
    console.log(`${item.file} - ${item.figure} ${item.title}`);
  }
}

run();
