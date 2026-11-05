import { useState } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function CakeChoiceCard({
  cake,
  index,
  activePosition,
  selecting,
  onSelect,
}) {
  const [failed, setFailed] = useState(false)
  const offset = index - activePosition
  const distance = Math.abs(offset)
  const isSelected = selecting === index
  const x = isSelected ? 0 : clamp(offset * 18, -48, 48)
  const y = isSelected ? 0 : Math.min(18, distance * 3.4)
  const depth = isSelected ? 0 : Math.min(420, distance * 150)
  const rotation = isSelected ? 0 : clamp(offset * -17, -50, 50)
  const scale = isSelected
    ? 1.42
    : Math.max(0.58, 1 - distance * 0.14)
  const opacity = isSelected
    ? 1
    : Math.max(0.08, 1 - distance * 0.22)

  return (
    <button
      className={`cake-choice${isSelected ? ' is-selected' : ''}`}
      type="button"
      onClick={() => onSelect(index)}
      disabled={selecting !== null && !isSelected}
      aria-label={`Choose birthday cake ${index + 1}`}
      aria-current={distance < 0.5 ? 'true' : undefined}
      style={{
        '--choice-x': `${x}vw`,
        '--choice-y': `${y}vh`,
        '--choice-depth': `${depth}px`,
        '--choice-rotation': `${rotation}deg`,
        '--choice-scale': scale,
        '--choice-opacity': opacity,
        '--choice-ratio': `${cake.width} / ${cake.height}`,
        zIndex: isSelected ? 100 : Math.max(1, 20 - Math.round(distance * 5)),
      }}
    >
      <span className="cake-choice__surface">
        {!failed && (
          <img
            src={cake.src}
            alt=""
            loading={index < 3 ? 'eager' : 'lazy'}
            decoding="async"
            draggable="false"
            onError={() => setFailed(true)}
          />
        )}
        {failed && (
          <span className="cake-choice__error">Image unavailable</span>
        )}
        <span className="cake-choice__gloss" aria-hidden="true" />
      </span>
    </button>
  )
}
