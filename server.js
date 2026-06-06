const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/corrigir', async (req, res) => {
  const { theme, essay, photoBase64, photoMime, photoNote, mode } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  const prompt = `Você é corretor do ENEM. Avalie nas 5 competências de 0 a 200 (múltiplos de 40). Retorne SOMENTE JSON sem texto antes ou depois:
{"competencias":[{"nome":"Competência I","desc":"Domínio da norma culta","nota":160,"nivel":"alta","feedback":"texto"},{"nome":"Competência II","desc":"Compreensão do tema","nota":120,"nivel":"media","feedback":"texto"},{"nome":"Competência III","desc":"Organização","nota":160,"nivel":"alta","feedback":"texto"},{"nome":"Competência IV","desc":"Coesão e coerência","nota":120,"nivel":"media","feedback":"texto"},{"nome":"Competência V","desc":"Proposta de intervenção","nota":80,"nivel":"baixa","feedback":"texto"}]}
Nível: alta=160-200, media=80-120, baixa=0-40. Feedback 2-3 frases específicas.
Tema: ${theme || 'não informado'}
Redação: ${essay || 'não fornecida'}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    res.json(JSON.parse(clean.substring(start, end + 1)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
