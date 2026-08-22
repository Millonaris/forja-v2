/*
 * Barra de pestañas.
 *
 * La spec pedía cuatro (§5). Son cinco: DIETA se añadió a petición expresa,
 * porque hasta el 8 de septiembre es lo único con fecha límite y lo que más
 * veces al día se consulta. Ajustes sigue fuera, detrás del engranaje de HOY.
 */

const PESTANAS = [
  { id: "hoy", icono: "◆", etiqueta: "HOY" },
  { id: "entrenar", icono: "▲", etiqueta: "ENTRENAR" },
  { id: "dieta", icono: "◈", etiqueta: "DIETA" },
  { id: "progreso", icono: "●", etiqueta: "PROGRESO" },
  { id: "plan", icono: "■", etiqueta: "PLAN" },
];

export default function NavInferior({ activa, alCambiar }) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "var(--ancho)",
        zIndex: 40,
        background: "rgba(14,14,14,.92)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(255,255,255,.07)",
        display: "flex",
        padding: "10px 4px calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      {PESTANAS.map((p) => {
        const puesta = p.id === activa;
        return (
          <button
            key={p.id}
            onClick={() => alCambiar(p.id)}
            aria-current={puesta ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              padding: "4px 0",
              cursor: "pointer",
              // El estado no depende solo del color (§55): la pestaña activa
              // va además con el icono a plena opacidad.
              color: puesta ? "var(--fuerza)" : "var(--texto-tenue)",
              opacity: puesta ? 1 : 0.75,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{p.icono}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".02em" }}>
              {p.etiqueta}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
