exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { theme, essay } = body;

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
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    const parsed = JSON.parse(clean.substring(start, end + 1));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
