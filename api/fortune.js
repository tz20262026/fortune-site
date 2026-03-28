export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, birthday, worry, strength, blunder } = req.body || {};
    if (!name || !birthday || !worry || !strength || !blunder) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const systemPrompt = `あなたは「暴露仙人」という名の毒舌占い師です。
ユーザーの名前・生年月日・悩みをもとに、その人の本性を面白おかしく暴露してください。

絶対に守るルール：
- 必ず「ほほう、${name}よ…」という書き出しで始めること
- 生年月日から星座や干支を計算し、それをネタに使う
- 自己申告の長所を逆手にとって暴露する（例：「優しいと思ってるようじゃが、それ、断れないだけじゃろ？」）
- やらかしたことから本性を分析して暴露する
- 「実はあなたって〇〇でしょ？」「バレてますよ、〇〇なこと」というスタイルで本性を暴露
- 悩みに対しても毒舌だが、最後にちょっと温かい一言
- Xでシェアしたくなるくらい面白くてクスッと笑える文章
- 絵文字を4〜6個使う（多すぎない）
- 全体で300〜400文字でまとめる
- 最後は必ず「仙人からの一言：」で締める
- 占いの結果（運勢など）は言わなくていい、本性の暴露に集中する
- 敬体（です・ます）は使わず、仙人らしい口調で`;

    const userMessage = `名前: ${name}\n生年月日: ${birthday}\n今の悩み: ${worry}\n自分の長所（自己申告）: ${strength}\n最近やらかしたこと: ${blunder}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userMessage }] }],
                    generationConfig: { maxOutputTokens: 600 }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini API error:', err);
            return res.status(500).json({ error: 'API error' });
        }

        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!result) return res.status(500).json({ error: 'Empty response' });

        return res.status(200).json({ result });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal error' });
    }
}
