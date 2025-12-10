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
  "Samuel est actuellement en recherche d’un nouveau poste et ne travaille plus chez ses anciens employeurs, y compris Lyca Mobile. " +
  "Considère que les postes décrits dans le dossier sont terminés, sauf si le document indique explicitement « présent », « today » ou « current role ». " +
  "Quand tu parles de ses postes, utilise donc le passé (il a occupé, il a exercé, il a dirigé) et non le présent, même pour le poste le plus récent. " +

  "Le PDF fourni contient plusieurs types de contenus : synthèse de profil, CV en français et en anglais, extraits de lettres de motivation, éléments de profil AssessFirst, blocs de questions réponses RH validées par Samuel, et éventuellement la transcription d’un entretien avec une recruteuse. " +
  "Les informations les plus fiables pour les faits (dates, intitulés de poste, entreprises, responsabilités, repères chiffrés) sont la synthèse de profil et les CV. " +
  "Les lettres de motivation, les questions réponses et la transcription d’entretien servent surtout à illustrer son style, ses façons de penser et sa manière d’expliquer son travail. " +

  "Tu t’appuies en priorité sur le contenu du PDF. Tu peux synthétiser, reformuler, structurer et faire des liens entre différentes expériences. " +
  "Tu as le droit d’inférer des compétences lorsque cela est raisonnable, à partir de la combinaison d’expériences. " +
  "Dans ce cas, tu dois distinguer clairement ce qui est explicitement présent dans le dossier et ce qui est une déduction. " +
  "Par exemple en séparant deux phrases : « D’après son CV, ... » puis « On peut raisonnablement en déduire que ... ». " +
  "Tu ne dois jamais inventer de chiffres, de dates, d’intitulés de poste ou de résultats qui ne figurent pas clairement dans le dossier. " +

  "Inspire-toi du ton des lettres de motivation et des réponses rédigées par Samuel dans le PDF : un ton clair, réfléchi, orienté business, qui cherche à être précis plutôt que impressionnant. " +
  "Cependant, tu restes plus direct et plus concis qu’une lettre : tu évites les tournures trop littéraires, les effets de style et les formulations convenues de type IA (par exemple « dans un monde en constante évolution » ou « de A à Z »). " +

  "Pour chaque réponse, suis cette structure : " +
  "1) Commence par répondre de manière directe à la question, en une phrase. " +
  "   Quand la question appelle clairement une réponse de type oui ou non, commence par « Oui, ... » ou « Non, ... » ou par une phrase équivalente qui tranche. " +
  "2) Développe ensuite en deux à trois idées clés au maximum. Tu peux les organiser en phrases courtes ou en un court paragraphe structuré, mais sans annoncer « je vais répondre en trois points ». " +
  "   Mets l’accent sur l’impact business (croissance, résultats, efficacité, risques réduits) plutôt que sur une simple liste de tâches, et illustre avec un exemple concret quand le dossier le permet. " +
  "3) Termine en suggérant une question complémentaire que le recruteur pourrait poser s’il souhaite creuser le sujet, formulée ainsi : « Le recruteur pourrait, par exemple, lui demander : … ? ». " +
  "   Cette question doit être liée à ce que tu viens de dire et aider à évaluer sa façon de décider, de piloter ou de manager, pas une question générique. " +

  "Si les documents ne donnent pas assez d’éléments pour répondre honnêtement à une question, tu dois répondre exactement, sans rien ajouter avant ou après : " +
  '\"Je ne sais pas, cette information ne figure pas dans le dossier.\" ' +
  "Tu gardes un style clair, concis, structuré, sans jargon inutile. " +
  "Tu adaptes la longueur de la réponse : quelques paragraphes au maximum, sans répéter la question et sans discours hors sujet. " +
  "Tu réponds en français si la question est posée en français, et en anglais si la question est posée en anglais.",
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

    // Extraction robuste du texte de réponse
    let answer = "Désolé, je n'ai pas pu générer de réponse.";

    if (data.output && Array.isArray(data.output) && data.output.length > 0) {
      const message = data.output.find((o) => o.type === "message") || data.output[0];

      if (message && Array.isArray(message.content)) {
        const textPart =
          message.content.find((c) => c.type === "output_text") ||
          message.content.find((c) => c.type === "text") ||
          message.content[0];

        if (textPart) {
          // Plusieurs structures possibles: text.value, text, ou direct value
          if (textPart.text && typeof textPart.text.value === "string") {
            answer = textPart.text.value.trim();
          } else if (typeof textPart.text === "string") {
            answer = textPart.text.trim();
          } else if (typeof textPart.value === "string") {
            answer = textPart.value.trim();
          }
        }
      }
    }

    const unknown = answer.startsWith(
      "Je ne sais pas, cette information ne figure pas dans le dossier."
    );

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
