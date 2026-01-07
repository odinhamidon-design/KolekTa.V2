const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  let html = markdown;

  // Escape HTML special chars in code blocks first
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="code-block ${lang}"><code>${escaped}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
    const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Checkboxes
  html = html.replace(/- \[ \] /g, '<span class="checkbox">&#9744;</span> ');
  html = html.replace(/- \[x\] /g, '<span class="checkbox checked">&#9745;</span> ');

  // Unordered lists
  html = html.replace(/^(\s*)-\s+(.*)$/gm, (match, indent, content) => {
    const level = indent.length / 2;
    return `<li class="level-${level}">${content}</li>`;
  });

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="ordered">$1</li>');

  // Paragraphs (lines that aren't already HTML)
  const lines = html.split('\n');
  const processed = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('<li')) {
      if (!inList) {
        processed.push('<ul>');
        inList = true;
      }
      processed.push(line);
    } else {
      if (inList) {
        processed.push('</ul>');
        inList = false;
      }
      if (line.trim() && !line.startsWith('<') && !line.match(/^\s*$/)) {
        processed.push(`<p>${line}</p>`);
      } else {
        processed.push(line);
      }
    }
  }
  if (inList) processed.push('</ul>');

  return processed.join('\n');
}

async function generatePDF() {
  console.log('Reading markdown file...');
  const mdPath = path.join(__dirname, '..', 'PANEL_QUESTIONS.md');
  const markdown = fs.readFileSync(mdPath, 'utf-8');

  console.log('Converting to HTML...');
  const content = markdownToHtml(markdown);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kolek-Ta Capstone Panel Questions</title>
  <style>
    @page {
      margin: 1.5cm 2cm;
      @bottom-center {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }

    h1 {
      color: #1a5f2a;
      font-size: 24pt;
      border-bottom: 3px solid #1a5f2a;
      padding-bottom: 10px;
      margin-top: 30px;
      page-break-after: avoid;
    }

    h2 {
      color: #2d7a3e;
      font-size: 16pt;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
      margin-top: 25px;
      page-break-after: avoid;
    }

    h3 {
      color: #333;
      font-size: 12pt;
      margin-top: 20px;
      background: #f5f5f5;
      padding: 10px 15px;
      border-left: 4px solid #2d7a3e;
      page-break-after: avoid;
    }

    p {
      margin: 10px 0;
      text-align: justify;
    }

    strong {
      color: #1a5f2a;
    }

    a {
      color: #2563eb;
      text-decoration: none;
    }

    code.inline-code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 10pt;
      color: #d63384;
    }

    pre.code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 9pt;
      line-height: 1.4;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    pre.code-block code {
      color: #d4d4d4;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    th {
      background: #2d7a3e;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e0e0e0;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    ul, ol {
      margin: 10px 0;
      padding-left: 25px;
    }

    li {
      margin: 5px 0;
    }

    li.level-1 {
      margin-left: 20px;
    }

    li.level-2 {
      margin-left: 40px;
    }

    hr {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 30px 0;
    }

    .checkbox {
      font-size: 14pt;
      margin-right: 5px;
    }

    .checkbox.checked {
      color: #2d7a3e;
    }

    /* Page breaks */
    h1:not(:first-of-type) {
      page-break-before: always;
    }

    /* Cover page styling */
    h1:first-of-type {
      text-align: center;
      font-size: 28pt;
      margin-top: 100px;
      border: none;
    }

    h1:first-of-type + p {
      text-align: center;
      font-size: 14pt;
      color: #666;
    }

    /* Table of contents */
    h2:first-of-type {
      page-break-before: always;
    }

    /* Answer boxes */
    h3 + p strong:first-child {
      display: block;
      margin-bottom: 10px;
    }

    /* Footer */
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #999;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    <p>Kolek-Ta Waste Collection Management System - Capstone Project</p>
    <p>Prepared for Panel Defense - December 2024</p>
  </div>
</body>
</html>
  `;

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(__dirname, '..', 'PANEL_QUESTIONS.pdf');

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '2cm',
      bottom: '2cm',
      left: '2cm',
      right: '2cm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 9pt; text-align: center; color: #999;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `
  });

  await browser.close();

  console.log(`\nPDF generated successfully!`);
  console.log(`Location: ${pdfPath}`);
}

generatePDF().catch(console.error);
