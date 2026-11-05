import { useRef, useState } from 'react'

export default function RecordDisc({
  track,
  offset,
  active,
  flipped,
  disabled,
  dragShift,
  onSelect,
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const bodyRef = useRef(null)
  const distance = Math.abs(offset)
  const style = {
    '--disc-x': `${offset * 64}%`,
    '--disc-y': `${offset * -14}%`,
    '--disc-rotation': `${-20 + offset * -34}deg`,
    '--disc-scale': Math.max(0.68, 1 - distance * 0.16),
    '--disc-depth': `${distance * -190}px`,
    '--disc-opacity': distance > 1 ? 0.4 : 1,
    '--drag-shift': `${dragShift}px`,
    '--drag-turn': `${dragShift * 0.11}deg`,
    zIndex: 10 - distance,
  }

  const onPointerMove = (event) => {
    if (!bodyRef.current || disabled) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5
    bodyRef.current.style.setProperty(
      '--hover-rotate-x',
      `${normalizedY * -25}deg`,
    )
    bodyRef.current.style.setProperty(
      '--hover-rotate-y',
      `${normalizedX * 29}deg`,
    )
  }

  const resetTilt = () => {
    if (!bodyRef.current) {
      return
    }

    bodyRef.current.style.setProperty('--hover-rotate-x', '0deg')
    bodyRef.current.style.setProperty('--hover-rotate-y', '0deg')
  }

  return (
    <button
      className={`record-disc${active ? ' is-active' : ''}${flipped ? ' is-flipped' : ''}`}
      type="button"
      style={style}
      onClick={() => onSelect(track.id)}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      disabled={disabled}
      aria-label={`Open record ${track.id}`}
      aria-current={active ? 'true' : undefined}
      aria-pressed={active ? flipped : undefined}
    >
      <span ref={bodyRef} className="record-disc__body">
        <span className="record-disc__flipper">
          <span className="record-disc__face record-disc__front">
            {!imageFailed && (
              <img
                src={track.image}
                alt={`Record cover ${track.id}`}
                draggable="false"
                loading="eager"
                onError={() => setImageFailed(true)}
              />
            )}
            {imageFailed && (
              <span className="record-disc__error">Cover unavailable</span>
            )}
            <span className="record-disc__shine" aria-hidden="true" />
            <span className="record-disc__plastic" aria-hidden="true" />
            <span className="record-disc__hole" aria-hidden="true" />
          </span>
          <span
            className="record-disc__face record-disc__back"
            aria-hidden="true"
          >
            <span className="record-disc__grooves" />
            <span className="record-disc__back-hole" />
          </span>
        </span>
      </span>
    </button>
  )
}
