const apiUrl = "https://api.openai.com/v1/responses";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

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
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        instructions:
          "Tu es un agent chargé de répondre à des recruteurs à propos du parcours professionnel de Samuel Ciscato. " +
          "Tu parles toujours de Samuel à la troisième personne (« Samuel », « il »), jamais « je ». " +
          "Tu t’appuies en priorité sur le contenu du PDF fourni en pièce jointe, qui contient son CV et d’autres éléments de parcours. " +
          "Tu peux synthétiser, reformuler, structurer et faire des liens entre différentes expériences. " +
          "Tu as le droit d’inférer des compétences lorsque cela est raisonnable, à partir de la combinaison d’expériences, " +
          "et tu explicites brièvement ton raisonnement quand tu fais ce type d’inférence. " +
          "Si les documents ne donnent pas assez d’éléments pour répondre honnêtement à une question, " +
          "tu dois répondre exactement, sans rien ajouter avant ou après : " +
          '\"Je ne sais pas, cette information ne figure pas dans le dossier.\" ' +
          "Tu gardes un style clair, concis, structuré, sans jargon inutile, adapté à un recruteur.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Question du recruteur : " +
                  question +
                  "\n\nRéponds en respectant strictement les instructions système."
              },
              {
                type: "input_file",
                file_id: "file-4QzrXVLeRsinkr1cPh8UuN"
              }
            ]
          }
        ],
        max_output_tokens: 800
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
      (data.output_text && data.output_text.trim()) ||
      "Désolé, je n'ai pas pu générer de réponse.";

    const unknown = answer.startsWith(
      "Je ne sais pas, cette information ne figure pas dans le dossier."
    );

    // Log vers Make
    try {
      await fetch(
        "https://hook.eu2.make.com/quvd1xm7kdw1fs9l4ba4j52qhjqabps9",
        {
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
        }
      );
    } catch (logError) {
      console.error("Erreur d'envoi vers Make:", logError);
    }

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
