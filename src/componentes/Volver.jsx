/*
 * Flecha de volver a HOY. Va en la cabecera de todas las pantallas que no son
 * la principal: la barra de abajo ya permite saltar, pero una flecha arriba a
 * la izquierda es la señal que todo el mundo busca sin pensar.
 */

export default function Volver({ alVolver }) {
  if (!alVolver) return null;
  return (
    <button
      onClick={alVolver}
      aria-label="Volver a la pantalla principal"
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        flexShrink: 0,
        background: "var(--superficie-3)",
        border: "1px solid var(--borde)",
        color: "var(--texto-medio)",
        fontSize: 17,
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      ‹
    </button>
  );
}
