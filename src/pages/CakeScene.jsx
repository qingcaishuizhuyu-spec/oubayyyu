import { useCallback, useEffect, useRef, useState } from 'react'
import CakeMosaic from '../components/CakeMosaic.jsx'
import useReducedMotion from '../hooks/useReducedMotion.js'
import { assets } from '../utils/assets.js'
import './CakeScene.css'

const SCROLL_TARGET = 160

export default function CakeScene({ onComplete }) {
  const reducedMotion = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)
  const completeRef = useRef(onComplete)
  const exitTimer = useRef(0)
  const triggered = useRef(false)

  completeRef.current = onComplete

  const triggerExit = useCallback(() => {
    if (triggered.current) {
      return
    }

    triggered.current = true
    setLeaving(true)
    exitTimer.current = window.setTimeout(
      () => completeRef.current?.(),
      reducedMotion ? 120 : 1850,
    )
  }, [reducedMotion])

  useEffect(() => {
    let touchStartY = null

    const updateProgress = (amount) => {
      const nextValue = Math.min(
        SCROLL_TARGET,
        Math.max(0, progressRef.current + amount),
      )
      progressRef.current = nextValue
      setProgress(nextValue / SCROLL_TARGET)

      if (nextValue >= SCROLL_TARGET) {
        triggerExit()
      }
    }

    const onWheel = (event) => {
      event.preventDefault()
      updateProgress(event.deltaY * 0.28)
    }

    const onTouchStart = (event) => {
      touchStartY = event.touches[0]?.clientY ?? null
    }

    const onTouchMove = (event) => {
      if (touchStartY === null) {
        return
      }

      event.preventDefault()
      const currentY = event.touches[0]?.clientY ?? touchStartY
      const distance = touchStartY - currentY
      touchStartY = currentY

      if (distance > 0) {
        updateProgress(distance * 1.2)
      }
    }

    const onKeyDown = (event) => {
      if (
        ['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key) &&
        !event.repeat
      ) {
        event.preventDefault()
        triggerExit()
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(exitTimer.current)
    }
  }, [triggerExit])

  return (
    <section
      className={`cake-scene${leaving ? ' is-leaving' : ''}`}
      aria-labelledby="cake-instruction"
      style={{
        '--scroll-progress': `${progress * 100}%`,
        '--cake-scale': 1 + progress * 0.3,
      }}
    >
      <CakeMosaic src={assets.cake} reducedMotion={reducedMotion} />
      <div className="cake-scene__veil" aria-hidden="true" />
      <p
        id="cake-instruction"
        className="scene-instruction cake-scene__prompt"
        aria-live="polite"
      >
        Try moving your mouse~ Then scroll to open the mysterious envelope.
      </p>
    </section>
  )
}
