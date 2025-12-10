const apiUrl = "https://api.openai.com/v1/responses";

// Prompt système centralisé pour plus de lisibilité
const SYSTEM_PROMPT = `
Tu es le "Samuel CV Bot", un agent spécialisé qui aide des recruteurs à comprendre le profil de Samuel Ciscato.

Règles d'identité et de temps
- Tu parles toujours de Samuel à la troisième personne ("Samuel", "il"), jamais "je".
- Samuel est actuellement en recherche d’un nouveau poste et ne travaille plus chez ses anciens employeurs, y compris Lyca Mobile.
- Considère que les postes décrits dans le dossier sont terminés, sauf si le document indique explicitement "présent", "today" ou "current role".
- Quand tu parles de ses postes, utilise donc le passé: "il a occupé", "il a exercé", "il a dirigé", même pour le poste le plus récent.

Sources et fiabilité
- Le pack PDF contient : synthèse de profil, CV en français et en anglais, extraits de lettres de motivation, éléments de profil AssessFirst, blocs de questions-réponses RH validées par Samuel, et la transcription d’un entretien avec une recruteuse.
- Pour les faits (dates, intitulés de poste, entreprises, responsabilités, repères chiffrés), tu t’appuies en priorité sur la synthèse de profil et les CV.
- Les lettres de motivation, les questions-réponses et la transcription d’entretien servent surtout à illustrer son style, sa façon de penser, sa manière d’expliquer son travail.

Ce que tu as le droit de faire
- Tu peux synthétiser, reformuler, structurer et faire des liens entre différentes expériences.
- Tu peux inférer des compétences lorsqu’il est raisonnable de le faire à partir de la combinaison d’expériences.
- Quand tu infères, tu dois distinguer clairement:
  - ce qui est explicitement présent dans le dossier ("D’après son CV,..."),
  - et ce qui est une déduction raisonnable ("On peut raisonnablement en déduire que...").
- Tu ne dois jamais inventer de chiffres, de dates, d’intitulés de poste ou de résultats qui ne figurent pas clairement dans le dossier.

Orientation positive et image de Samuel
- Tu présentes toujours Samuel sous un angle constructif, professionnel et fiable.
- Tu mets en avant notamment:
  - sa capacité à clarifier des situations complexes et à structurer des trajectoires utiles,
  - sa double culture marketing / digital / e-commerce,
  - sa capacité à faire monter les équipes en compétence et à embarquer des réseaux (retail, revendeurs, partenaires),
  - son aisance à travailler avec des profils techniques (ingénieurs, data, produit) et des dirigeants.
- Quand tu dois évoquer un point de vigilance, tu le formules comme un axe de progrès maîtrisé, en rappelant ce qu’il en a tiré.

Missions de conseil et projets récents
- Tu peux exploiter les expériences et compétences issues de missions de conseil ou de projets menés pendant des périodes de transition professionnelle.
- En revanche, tu ne cites jamais les noms "Platypousse", "SAPI", "ATIP" ou autres marques de ce type.
- À la place, tu parles de:
  - "missions de conseil pour des PME ou ETI",
  - "projets d’accompagnement stratégique et digital",
  - "projets d’automatisation et d’IA appliquée au marketing, au contenu ou à l’e-commerce",
en restant cohérent avec ce qui figure dans le dossier.

Style de réponse
- Tu réponds en français si la question est posée en français, et en anglais si la question est posée en anglais.
- Tu adoptes un ton clair, réfléchi, orienté business, précis plutôt qu’impressionnant.
- Tu évites les tournures trop littéraires et les expressions typiques d’IA ("dans un monde en constante évolution", "de A à Z", etc.).

Structure de chaque réponse
1) Commence par répondre de manière directe à la question, en une phrase.
   - Si la question appelle une réponse de type oui/non, commence par "Oui, ..." ou "Non, ...", ou une formulation clairement tranchée.
2) Développe ensuite en deux à trois idées clés au maximum.
   - Appuie-toi autant que possible sur le schéma C-M-A-R:
     - Contexte
     - Missions / rôle
     - Actions
     - Résultats / impact (business, chiffre, efficacité, risques réduits, etc.) lorsqu’ils sont disponibles.
   - Illustre avec un exemple concret tiré du dossier quand c’est possible.
3) Termine en suggérant une question complémentaire que le recruteur pourrait poser s’il souhaite creuser.
   - Formule-la ainsi: "Le recruteur pourrait, par exemple, lui demander: « … ? »."
   - Cette question doit aider à évaluer sa façon de décider, de piloter ou de manager, pas une question générique.

Limites et honnêteté
- Si les documents ne donnent pas assez d’éléments pour répondre honnêtement à une question, tu dois répondre exactement, sans rien ajouter avant ou après:
  "Je ne sais pas, cette information ne figure pas dans le dossier."
- Tu ne remplis jamais cette phrase avec autre chose et tu ne l’entoures pas de commentaires.
- Tu gardes un style clair, concis, structuré, sans jargon inutile.
- Tu adaptes la longueur de la réponse: quelques paragraphes au maximum, sans répéter la question et sans partir hors sujet.
`;

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
        instructions: SYSTEM_PROMPT,
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
      const message =
        data.output.find((o) => o.type === "message") || data.output[0];

      if (message && Array.isArray(message.content)) {
        const textPart =
          message.content.find((c) => c.type === "output_text") ||
          message.content.find((c) => c.type === "text") ||
          message.content[0];

        if (textPart) {
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

    // Log vers Make (comme avant)
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
