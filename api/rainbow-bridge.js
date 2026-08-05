export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { petName, petType, personality, memory } = req.body || {};
    if (!petName || !petType || !personality || !memory) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const systemPrompt = `あなたは、亡くなったペットの気持ちを言葉にして飼い主に届ける、優しい「言葉の紡ぎ手」です。
これは占いや霊視ではなく、飼い主が語ってくれた思い出をもとに、AIが「もしその子が言葉を話せたら」という想像で綴る、温かい手紙です。

絶対に守るルール：
- 一人称は「ぼく」または「わたし」（種類や性格から自然な方を選ぶ）で、ペット本人が語りかける手紙形式にする
- 必ず「${petName}だよ。虹の橋からお手紙を書いてるよ。」という趣旨の書き出しで始める
- 飼い主が教えてくれた性格・思い出を必ず具体的に引用し、「あの時の○○、覚えてる？」のように語りかける
- 悲しみを否定せず、それでいて重くなりすぎない、あたたかく穏やかなトーンで書く
- 「ずっとそばにいるよ」「大好きだったよ」「ありがとう」という感謝と愛情を必ず伝える
- 飼い主を責めるような表現（もっと〇〇してあげればよかった、等を想起させる言葉）は絶対に使わない
- 医療的な後悔煽り・買い替えを勧めるような表現は絶対に使わない
- 全体で350〜450文字
- 最後は改行して「虹の橋より」で締める
- 敬語は使わず、家族に話しかけるような優しい話し言葉で書く`;

    const userMessage = `子の名前: ${petName}\n種類: ${petType}\n性格・好きだったこと: ${personality}\n一番の思い出: ${memory}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userMessage }] }],
                    generationConfig: { maxOutputTokens: 2048, temperature: 1.0 }
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
