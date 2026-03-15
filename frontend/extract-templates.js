const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.component.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const templateRegex = /template\s*:\s*`([\s\S]*?)`\s*,/g;
      const htmlFile = fullPath.replace('.component.ts', '.component.html');
      const htmlFileName = path.basename(htmlFile);

      let match;
      let didModify = false;
      // We process the file with the regex. Since we are modifying the content, 
      // we only want to do the replace if we found something.
      let newContent = content;
      
      while ((match = templateRegex.exec(content)) !== null) {
        let templateContent = match[1];
        
        const lines = templateContent.split('\n');
        if (lines.length > 0 && lines[0].trim() === '') lines.shift();
        if (lines.length > 0 && lines[lines.length-1].trim() === '') lines.pop();
        
        fs.writeFileSync(htmlFile, lines.join('\n'));
        console.log('Created: ' + htmlFile);
        
        const replacement = `templateUrl: './${htmlFileName}',`;
        newContent = newContent.replace(match[0], replacement);
        didModify = true;
      }

      if (didModify) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'app'));
