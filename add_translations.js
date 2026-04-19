const fs = require('fs');
const path = require('path');

function walk(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            files = files.concat(walk(dirPath));
        } else {
            files.push(dirPath);
        }
    });
    return files;
}

const pagesDir = path.join(__dirname, 'pages');
const files = walk(pagesDir).filter(f => f.endsWith('.tsx') && !f.includes('_app.tsx') && !f.includes('_document.tsx'));

const codeToAppend = `\nexport async function getServerSideProps({ locale }: any) {\n  const { serverSideTranslations } = require('next-i18next/pages/serverSideTranslations');\n  return {\n    props: {\n      ...(await serverSideTranslations(locale ?? 'en', ['common'])),\n    },\n  };\n}\n`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('serverSideTranslations')) {
        fs.writeFileSync(file, content + codeToAppend);
        console.log(`Updated ${file}`);
    }
});
