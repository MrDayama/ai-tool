import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const API_KEY = process.env.GEMINI_API_KEY; // GitHub Secretsから取得
const MODEL_NAME = 'gemini-2.5-flash';

const MAX_ITERATIONS = 3;
const INSTRUCTIONS_FILE = '.ai/instructions.md';
const FILES_TO_READ = ['index.html', 'style.css', 'app.js'];

async function callGenAI(prompt) {
    if (!API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in the environment.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        system_instruction: {
            parts: [{
                text: `あなたはCI/CDの内部で動作する自律的なAIエンジニアエージェントです。
目的: 与えられた指示に従ってコードを修正し、テストを通過させること。
出力フォーマット: 必ず以下の厳格なJSONフォーマットのみを返してください。それ以外のマークダウン（\`\`\`jsonなど）や挨拶、説明文は一切含めないでください。
{
  "files": [
    {
      "path": "app.js",
      "content": "完全な新しいファイルの内容..."
    }
  ]
}`
            }]
        },
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
}

function getExistingCodeContext() {
    let context = '現在のコードベース:\n';
    for (const file of FILES_TO_READ) {
        if (fs.existsSync(file)) {
            context += `\n--- ${file} ---\n`;
            context += fs.readFileSync(file, 'utf-8');
            context += `\n------------------\n`;
        }
    }
    return context;
}

async function runAgent() {
    if (!fs.existsSync(INSTRUCTIONS_FILE)) {
        console.log('No instructions found. Exiting.');
        return;
    }

    const instructions = fs.readFileSync(INSTRUCTIONS_FILE, 'utf-8');
    if (instructions.trim() === '') {
        console.log('Instructions are empty. Exiting.');
        return;
    }

    console.log('🚀 AI CI/CD Agent started...');
    let currentContext = getExistingCodeContext();
    let conversationHistory = `指示内容:\n${instructions}\n\n${currentContext}\n変更点を出力してください。`;

    for (let attempt = 1; attempt <= MAX_ITERATIONS; attempt++) {
        console.log(`\n▶️ Iteration ${attempt}/${MAX_ITERATIONS}`);

        try {
            console.log('⚙️ Asking Gemini for code changes...');
            const responseJson = await callGenAI(conversationHistory);

            if (responseJson.files && responseJson.files.length > 0) {
                console.log(`📝 Writing ${responseJson.files.length} modified files...`);
                for (const file of responseJson.files) {
                    fs.writeFileSync(file.path, file.content, 'utf-8');
                    console.log(`  - Updated ${file.path}`);
                }
            }

            console.log('🧪 Running CI/CD tests...');
            try {
                const { stdout, stderr } = await execAsync('npm test');
                console.log('✅ Tests PASSED!');
                console.log(stdout);

                // テストが通ったら、指示ファイルをクリアして終了
                fs.writeFileSync(INSTRUCTIONS_FILE, '', 'utf-8');
                console.log('🎉 AI development cycle completed successfully.');
                break;

            } catch (testError) {
                console.log('❌ Tests FAILED!');
                console.log('Stdout:', testError.stdout);
                console.log('Stderr:', testError.stderr);

                if (attempt === MAX_ITERATIONS) {
                    console.error('⚠️ Maximum iterations reached. Exiting with failure.');
                    process.exit(1);
                }

                console.log('🔄 Feeding errors back to AI for correction...');

                const newCodeContext = getExistingCodeContext();
                conversationHistory = `以下のコードでテストエラーが発生しました:
${newCodeContext}

エラーの出力内容:
${testError.stdout}
${testError.stderr}

このエラーを解決するために、コードを修正して再出力してください。`;
            }

        } catch (apiError) {
            console.error('API or Parsing Error:', apiError.message);
            if (attempt === MAX_ITERATIONS) process.exit(1);
        }
    }
}

runAgent().catch(err => {
    console.error('Fatal agent error:', err);
    process.exit(1);
});
