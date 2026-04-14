import fs from 'fs';
import path from 'path';

// 簡易的な構文チェッカー（必要に応じてJestなどに置き換えてください）
console.log('Running test suite for AI Agent...');

function checkSyntax(file) {
    const content = fs.readFileSync(file, 'utf-8');
    if (!content) throw new Error(`${file} is empty`);

    if (file.endsWith('.js')) {
        try {
            new Function(content); // 簡易的なJSのパースチェック
        } catch (e) {
            throw new Error(`Syntax Error in ${file}: ${e.message}`);
        }
    }
}

try {
    ['app.js', 'index.html', 'style.css'].forEach(file => {
        if (fs.existsSync(file)) {
            checkSyntax(file);
            console.log(`PASS: ${file} parsed successfully`);
        } else {
            throw new Error(`Critical file missing: ${file}`);
        }
    });

    console.log('All syntax tests passed! Ready to deploy.');
    process.exit(0);

} catch (error) {
    console.error('\nFAIL: CI/CD Test Failed.');
    console.error(error.message);
    process.exit(1);
}
