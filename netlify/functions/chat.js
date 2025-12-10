const apiUrl = "https://api.openai.com/v1/chat/completions";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  const { question } = JSON.parse(event.body || "{}");

  if (!question) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Question manquante" })
    };
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant qui répond brièvement aux questions sur la carrière de Samuel Ciscato. Pour l'instant, tu peux répondre de manière générale, ce sera affiné plus tard."
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await res.json();

    const answer =
      data.choices?.[0]?.message?.content ||
      "Désolé, je n'ai pas pu générer de réponse.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur", details: String(err) })
    };
  }
};
