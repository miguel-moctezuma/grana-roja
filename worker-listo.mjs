const TZ = "America/Monterrey";
const PRIMER_DIA = "2026-12-02";
const TOTAL = 24;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function fechaMonterrey(instante) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instante);
}

function numeroDeDia(fecha) {
  const actual = Date.parse(fecha + "T00:00:00Z");
  const inicio = Date.parse(PRIMER_DIA + "T00:00:00Z");
  return Math.floor((actual - inicio) / 86400000) + 1;
}

function disponibles(dia, abiertos) {
  return Math.max(0, Math.min(dia, TOTAL) - abiertos);
}

async function leerEstado(env) {
  const raw = await env.PROGRESO.get("estado");
  const estado = raw ? JSON.parse(raw) : {};
  estado.regalos ||= {};
  estado.dias ||= {};
  return estado;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ ok: false, reason: "metodo" }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, reason: "cuerpo" }, 400);
    }
    const ruta = new URL(request.url).pathname;
    if (env.ADMIN_CODE && env.ADMIN_CODE !== env.ACCESS_CODE && body?.acceso === env.ADMIN_CODE) {
      if (ruta === "/estado") return json({ ok: true, modo: "invitado" });
      return json({ ok: false, reason: "vista_previa" }, 403);
    }

    if (!env.ACCESS_CODE || body?.acceso !== env.ACCESS_CODE) {
      return json({ ok: false, reason: "acceso" }, 401);
    }

    const fecha = env.TEST_DATE || fechaMonterrey(new Date());
    const dia = numeroDeDia(fecha);
    const estado = await leerEstado(env);
    const abiertos = Object.keys(estado.regalos).length;
    const pendientes = disponibles(dia, abiertos);

    if (ruta === "/estado") {
      return json({ ok: true, fecha, dia, regalos: estado.regalos, disponibles: pendientes });
    }

    if (ruta === "/abrir") {
      const regalo = Number(body.regalo);
      if (!Number.isInteger(regalo) || regalo < 1 || regalo > TOTAL) {
        return json({ ok: false, reason: "regalo" }, 400);
      }
      if (estado.regalos[regalo]) {
        return json({ ok: true, yaAbierto: true, diaApertura: estado.regalos[regalo] });
      }
      if (dia < 1) return json({ ok: false, reason: "aun_no" });
      if (!pendientes) return json({ ok: false, reason: "limite" });

      const codigos = (env.CODES || "").split(",").map(s => s.trim()).filter(Boolean);
      if (codigos.length !== TOTAL) return json({ ok: false, reason: "config" }, 500);

      const turno = abiertos + 1;
      estado.regalos[regalo] = turno;
      estado.dias[turno] = regalo;
      await env.PROGRESO.put("estado", JSON.stringify(estado));
      return json({ ok: true, codigo: codigos[turno - 1] });
    }

    return json({ ok: false, reason: "ruta" }, 404);
  },
};
