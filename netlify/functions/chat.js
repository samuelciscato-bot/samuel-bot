exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  const { question } = JSON.parse(event.body || "{}");

  // V1: réponse de test, sans IA
  const fakeAnswer = `Tu as posé la question: "${question}". 
Pour l'instant, je suis une réponse de test sans IA.`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer: fakeAnswer })
  };
};
