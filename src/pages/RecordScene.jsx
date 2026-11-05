import { useCallback, useEffect, useRef, useState } from 'react'
import RecordDisc from '../components/RecordDisc.jsx'
import './RecordScene.css'

function getCircularOffset(index, activeIndex, length) {
  let offset = index - activeIndex
  const boundary = length / 2

  if (offset > boundary) {
    offset -= length
  } else if (offset < -boundary) {
    offset += length
  }

  return offset
}

export default function RecordScene({ tracks, onOpen }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [opening, setOpening] = useState(false)
  const [dragShift, setDragShift] = useState(0)
  const openingRef = useRef(false)
  const dragStartX = useRef(null)
  const pressStartedAt = useRef(0)
  const dragged = useRef(false)
  const wheelLock = useRef(0)
  const openTimer = useRef(0)

  const move = useCallback(
    (direction) => {
      if (openingRef.current) {
        return
      }

      setFlipped(false)
      setActiveIndex(
        (current) => (current + direction + tracks.length) % tracks.length,
      )
    },
    [tracks.length],
  )

  const openRecord = useCallback(
    (trackId) => {
      if (openingRef.current) {
        return
      }

      openingRef.current = true
      setOpening(true)
      openTimer.current = window.setTimeout(() => onOpen(trackId), 480)
    },
    [onOpen],
  )

  const selectRecord = useCallback(
    (trackId) => {
      if (dragged.current || openingRef.current) {
        dragged.current = false
        return
      }

      const targetIndex = tracks.findIndex((track) => track.id === trackId)
      setFlipped(false)

      if (targetIndex !== activeIndex) {
        setActiveIndex(targetIndex)
      }

      openRecord(trackId)
    },
    [activeIndex, openRecord, tracks],
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        move(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        move(1)
      } else if (event.key === ' ') {
        event.preventDefault()
        if (!openingRef.current) {
          setFlipped((current) => !current)
        }
      } else if (event.key === 'Enter') {
        event.preventDefault()
        openRecord(tracks[activeIndex].id)
      }
    }

    const onWheel = (event) => {
      event.preventDefault()
      const now = performance.now()
      if (now < wheelLock.current || openingRef.current) {
        return
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY

      if (Math.abs(delta) < 8) {
        return
      }

      wheelLock.current = now + 360
      move(delta > 0 ? 1 : -1)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onWheel)
    }
  }, [activeIndex, move, openRecord, tracks])

  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current)
    },
    [],
  )

  const onPointerDown = (event) => {
    dragStartX.current = event.clientX
    pressStartedAt.current = performance.now()
    dragged.current = false
    setDragShift(0)
  }

  const onPointerMove = (event) => {
    if (dragStartX.current === null) {
      return
    }

    if (Math.abs(event.clientX - dragStartX.current) > 10) {
      dragged.current = true
    }

    if (dragged.current) {
      setDragShift(event.clientX - dragStartX.current)
    }
  }

  const onPointerUp = (event) => {
    if (dragStartX.current === null) {
      return
    }

    const distance = event.clientX - dragStartX.current
    dragStartX.current = null
    setDragShift(0)

    if (performance.now() - pressStartedAt.current > 180) {
      dragged.current = true
    }

    if (Math.abs(distance) > 48) {
      move(distance < 0 ? 1 : -1)
    }
  }

  return (
    <section
      className={`record-scene${opening ? ' is-opening' : ''}`}
      aria-labelledby="records-title"
    >
      <h1 id="records-title" className="sr-only">
        Choose a record
      </h1>

      <header className="record-scene__header" aria-hidden="true">
        <span>19</span>
        <span>
          {String(activeIndex + 1).padStart(2, '0')} /{' '}
          {String(tracks.length).padStart(2, '0')}
        </span>
      </header>

      <div
        className="record-scene__stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {tracks.map((track, index) => {
          const offset = getCircularOffset(index, activeIndex, tracks.length)

          return (
            <RecordDisc
              key={track.id}
              track={track}
              offset={offset}
              active={offset === 0}
              flipped={offset === 0 && flipped}
              disabled={opening}
              dragShift={dragShift}
              onSelect={selectRecord}
            />
          )
        })}
      </div>

      <button
        className="record-scene__arrow record-scene__arrow--previous"
        type="button"
        onClick={() => move(-1)}
        aria-label="Previous record"
      >
        ←
      </button>
      <button
        className="record-scene__arrow record-scene__arrow--next"
        type="button"
        onClick={() => move(1)}
        aria-label="Next record"
      >
        →
      </button>

      <p className="record-scene__guide" aria-hidden="true">
        <span>← → Browse</span>
        <span>Space Flip</span>
        <span>Click / Enter Open</span>
      </p>
    </section>
  )
}
