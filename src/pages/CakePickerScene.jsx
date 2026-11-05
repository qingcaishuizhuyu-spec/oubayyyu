import { useEffect, useRef, useState } from 'react'
import CakeChoiceCard from '../components/CakeChoiceCard.jsx'
import useReducedMotion from '../hooks/useReducedMotion.js'
import './CakePickerScene.css'

export default function CakePickerScene({ cakes, onSelect }) {
  const sectionRef = useRef(null)
  const selectTimer = useRef(0)
  const selectHandler = useRef(onSelect)
  const reducedMotion = useReducedMotion()
  const [activePosition, setActivePosition] = useState(0)
  const [selecting, setSelecting] = useState(null)

  selectHandler.current = onSelect

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    let frameId = 0

    const updatePosition = () => {
      frameId = 0
      const section = sectionRef.current
      if (!section) {
        return
      }

      const maxScroll = Math.max(1, section.offsetHeight - window.innerHeight)
      const traveled = Math.min(maxScroll, Math.max(0, -section.getBoundingClientRect().top))
      setActivePosition((traveled / maxScroll) * (cakes.length - 1))
    }

    const requestUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updatePosition)
      }
    }

    updatePosition()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      window.clearTimeout(selectTimer.current)
    }
  }, [cakes.length])

  const chooseCake = (index) => {
    if (selecting !== null) {
      return
    }

    setSelecting(index)
    selectTimer.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
      selectHandler.current?.(cakes[index].src)
    }, reducedMotion ? 90 : 720)
  }

  const progress =
    cakes.length > 1 ? activePosition / (cakes.length - 1) : 0

  return (
    <section
      ref={sectionRef}
      className={`cake-picker${selecting !== null ? ' is-selecting' : ''}`}
      style={{ height: `${100 + (cakes.length - 1) * 82}svh` }}
      aria-labelledby="cake-picker-title"
    >
      <div className="cake-picker__viewport">
        <div className="cake-picker__glow" aria-hidden="true" />
        <h1
          id="cake-picker-title"
          className="scene-instruction cake-picker__title"
        >
          Choose your birthday cake.
        </h1>

        <div className="cake-picker__stage">
          {cakes.map((cake, index) => (
            <CakeChoiceCard
              key={cake.src}
              cake={cake}
              index={index}
              activePosition={activePosition}
              selecting={selecting}
              onSelect={chooseCake}
            />
          ))}
        </div>

        <div className="cake-picker__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </section>
  )
}
