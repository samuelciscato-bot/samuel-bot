const apiUrl = "https://api.openai.com/v1/chat/completions";

exports.handler = async (event) => {
  // Méthode autorisée
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  // Parsing du body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "JSON invalide" })
    };
  }

  const { question } = body || {};

  if (!question) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Question manquante" })
    };
  }

  try {
    // Appel OpenAI
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

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erreur OpenAI:", errorText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Erreur OpenAI", details: errorText })
      };
    }

    const data = await res.json();

    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n'ai pas pu générer de réponse.";

    // Détection de non-réponse standard (on ajustera le prompt plus tard)
    const unknown = answer.startsWith(
      "Je ne sais pas, cette information ne figure pas dans le dossier."
    );

    // Log vers Make (ne bloque pas la réponse si ça échoue)
    try {
      await fetch("https://hook.eu2.make.com/quvd1xm7kdw1fs9l4ba4j52qhjqabps9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          unknown,
          sessionId:
            event.headers["x-nf-client-connection-ip"] ||
            event.headers["client-ip"] ||
            "unknown",
          source: "site-netlify",
          lang: "fr"
        })
      });
    } catch (logError) {
      console.error("Erreur d'envoi vers Make:", logError);
      // on ne renvoie pas d'erreur au client pour ça
    }

    // Réponse au front
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    console.error("Erreur serveur:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur", details: String(err) })
    };
  }
};
