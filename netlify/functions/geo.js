exports.handler = async (event) => {
  try {
    const header = event.headers["x-nf-geo"] || event.headers["x-nf-geo"].toLowerCase;
    let city = null;
    let country = null;

    if (event.headers["x-nf-geo"]) {
      const geo = JSON.parse(event.headers["x-nf-geo"]);
      city = geo.city || null;
      // suivant les versions de Netlify, country peut etre un code ou un objet
      if (typeof geo.country === "string") {
        country = geo.country;
      } else if (geo.country && geo.country.name) {
        country = geo.country.name;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, country })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: null, country: null })
    };
  }
};
