exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const { nombre, fecha, hora, lugar } = JSON.parse(event.body);

    if (!nombre || !fecha || !hora || !lugar) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Datos incompletos" })
      };
    }

    /* ===============================
       1️⃣ GEOLOCALIZAR CIUDAD (GRATIS)
       =============================== */
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lugar)}`
    );

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Lugar no encontrado" })
      };
    }

    const latitude = parseFloat(geoData[0].lat);
    const longitude = parseFloat(geoData[0].lon);

    /* ===============================
       2️⃣ PREPARAR DATOS PARA ASTRO API
       =============================== */
    const [year, month, day] = fecha.split("-").map(Number);
    const [hour, minute] = hora.split(":").map(Number);

    const payload = {
      year,
      month,
      day,
      hour,
      minute,
      latitude,
      longitude,
      timezone: 0   // UTC (suficiente para iniciar)
    };

    /* ===============================
       3️⃣ LLAMADA A FREE ASTRO API
       =============================== */
    const astroResponse = await fetch(
      "https://api.freeastroapi.com/v1/natal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "c9a468ff5331037cad13b246f3190922d8a4fa69e4297e7af1632ca667441360"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!astroResponse.ok) {
      const err = await astroResponse.text();
      throw new Error(err);
    }

    const cartaAstral = await astroResponse.json();

    /* ===============================
       4️⃣ RESPUESTA FINAL
       =============================== */
    return {
      statusCode: 200,
      body: JSON.stringify({
        mensaje: `Carta astral occidental generada para ${nombre}`,
        persona: { nombre, fecha, hora, lugar },
        coordenadas: { latitude, longitude },
        carta: cartaAstral
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error al generar la carta astral",
        detalle: error.message
      })
    };
  }
};
