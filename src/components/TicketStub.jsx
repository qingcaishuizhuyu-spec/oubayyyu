import { useEffect, useRef, useState } from 'react'
import './TicketStub.css'

export default function TicketStub({ src, onTear }) {
  const rootRef = useRef(null)
  const stubRef = useRef(null)
  const dragStart = useRef(0)
  const dragDistance = useRef(0)
  const pointerId = useRef(null)
  const tearTimer = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [grabbing, setGrabbing] = useState(false)
  const [torn, setTorn] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(
    () => () => {
      window.clearTimeout(tearTimer.current)
    },
    [],
  )

  const tearTicket = () => {
    if (torn) {
      return
    }

    setTorn(true)
    dragDistance.current = 220
    setDragX(220)
    tearTimer.current = window.setTimeout(onTear, 900)
  }

  const onPointerDown = (event) => {
    if (torn || event.button !== 0 || !event.isPrimary) {
      return
    }

    event.preventDefault()
    pointerId.current = event.pointerId
    dragStart.current = event.clientX
    setGrabbing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (pointerId.current !== event.pointerId) {
      return
    }

    const ticketWidth =
      rootRef.current?.getBoundingClientRect().width ?? 800
    const nextDrag = Math.max(
      -8,
      Math.min(ticketWidth * 0.34, event.clientX - dragStart.current),
    )
    dragDistance.current = nextDrag
    setDragX(nextDrag)
  }

  const onPointerUp = (event) => {
    if (pointerId.current !== event.pointerId) {
      return
    }

    pointerId.current = null
    setGrabbing(false)

    if (stubRef.current?.hasPointerCapture(event.pointerId)) {
      stubRef.current.releasePointerCapture(event.pointerId)
    }

    const ticketWidth =
      rootRef.current?.getBoundingClientRect().width ?? 800
    if (dragDistance.current > ticketWidth * 0.16) {
      tearTicket()
    } else {
      dragDistance.current = 0
      setDragX(0)
    }
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      tearTicket()
    }
  }

  const onTicketPointerMove = (event) => {
    if (grabbing || torn || !rootRef.current) {
      return
    }

    const rect = rootRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    rootRef.current.style.setProperty('--ticket-tilt-x', `${y * -29}deg`)
    rootRef.current.style.setProperty('--ticket-tilt-y', `${x * 35}deg`)
  }

  const resetTilt = () => {
    rootRef.current?.style.setProperty('--ticket-tilt-x', '0deg')
    rootRef.current?.style.setProperty('--ticket-tilt-y', '0deg')
  }

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  })

  const tearProgress = Math.min(
    1,
    Math.max(0, dragX / ((rootRef.current?.clientWidth ?? 800) * 0.16)),
  )

  return (
    <div
      ref={rootRef}
      className="tear-ticket"
      data-grabbing={grabbing ? 'true' : undefined}
      data-torn={torn ? 'true' : undefined}
      style={{
        '--tear-x': `${dragX}px`,
        '--tear-rotate': `${dragX * 0.045}deg`,
        '--tear-lift': `${dragX * 0.08}px`,
        '--tear-progress': tearProgress,
      }}
      onPointerMove={onTicketPointerMove}
      onPointerLeave={resetTilt}
    >
      <div className="tear-ticket__plane">
        <div className="tear-ticket__body">
          {!failed && (
            <img
              src={src}
              alt="Hello, with a view of Earth"
              draggable="false"
              onError={() => setFailed(true)}
            />
          )}
          {failed && <span className="tear-ticket__error">Image unavailable</span>}
        </div>

        <button
          ref={stubRef}
          className="tear-ticket__stub"
          type="button"
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          aria-label="Drag or press Enter to tear off the ticket stub"
        >
          <span className="tear-ticket__stub-paper" aria-hidden="true">
            <span
              className="tear-ticket__stub-image"
              style={{ backgroundImage: `url("${src}")` }}
            />
            <span className="tear-ticket__stub-edge" />
          </span>
        </button>

        <span className="tear-ticket__perforation" aria-hidden="true" />
        <span className="tear-ticket__notch tear-ticket__notch--top" aria-hidden="true" />
        <span
          className="tear-ticket__notch tear-ticket__notch--bottom"
          aria-hidden="true"
        />
        <span className="tear-ticket__fibres" aria-hidden="true" />
      </div>
    </div>
  )
}
