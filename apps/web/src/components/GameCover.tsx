import { useState } from 'react'

/**
 * Portada de un juego.
 *
 * El catalogo del prototipo no trae imagenes reales (y no conviene alojar
 * material de las tiendas), asi que si falta `imageUrl` se dibuja un
 * marcador neutro: iniciales sobre un color derivado del titulo. Siempre
 * hay algo que mirar, nunca un hueco gris.
 */

function hashTitle(title: string): number {
  let h = 0
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function initials(title: string): string {
  const words = title.split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? '?'
  const second = words[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function GameCover({
  title,
  imageUrl,
  className = '',
}: {
  title: string
  imageUrl: string | null
  className?: string
}) {
  const [roto, setRoto] = useState(false)
  const mostrarImagen = Boolean(imageUrl) && !roto

  if (mostrarImagen) {
    return (
      <img
        src={imageUrl ?? ''}
        alt=""
        loading="lazy"
        onError={() => setRoto(true)}
        className={`object-cover ${className}`}
      />
    )
  }

  const hue = hashTitle(title) % 360
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 28%), hsl(${(hue + 40) % 360} 45% 18%))`,
      }}
    >
      <span className="text-2xl font-semibold tracking-wide text-white/80">
        {initials(title)}
      </span>
    </div>
  )
}
