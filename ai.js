/**
 * AI Story Relay - AI Module
 * Google Gemini API integration
 */

const API_KEY = 'AIzaSyBPV172iGeSxu9XP3cjm96pdl_z_imf-j0'; // 設定済み

async function generateContinuation(currentStory, latestInput) {
    if (API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        // Mock response for testing if no API key
        console.warn('API Key not set. Using mock response.');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return `[MOCK] 彼は静かに頷き、空を見上げました。そこには見たこともないほど輝く星々が瞬いていました。`;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `
あなたは優れたファンタジー小説家です。
以下の「現在の物語」に続く、プレイヤーの「最新の入力」を受け取り、その続きをさらに1〜2文だけ自然に、かつ魅力的に書き足してください。
物語全体が短編小説として成立するように、文体（です・ます、だ・である）は現在の物語に合わせてください。

# 現在の物語:
${currentStory}

# プレイヤーの最新の入力:
${latestInput}

# 指示:
- 書き足すのは「1〜2文」だけにしてください。
- プレイヤーの入力を否定せず、物語を広げてください。
- 出力は追加する文章のみを返してください。解説は不要です。
`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('AI Error:', error);
        return '（AIは静かに考え込んでしまったようです...）';
    }
}

async function finalizeStory(fullStory) {
    if (API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            title: '[MOCK] 星降る夜の奇跡',
            content: fullStory + '\n\nこうして、世界は再び平穏を取り戻したのでした。めでたしめでたし。'
        };
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `
以下のプロット（リレー小説の結果）を受け取り、一つの完結した物語として美しく整えてください。
適宜、表現を調整し、物語の雰囲気に合った魅力的なタイトルを付けてください。

# リレー小説の原稿:
${fullStory}

# 出力形式 (JSON):
{
  "title": "物語のタイトル",
  "content": "整えられた物語の全文"
}
`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        return result;
    } catch (error) {
        console.error('AI Error:', error);
        return { title: '無題の物語', content: fullStory };
    }
}
