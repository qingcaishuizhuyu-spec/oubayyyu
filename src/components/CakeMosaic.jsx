import { useRef } from 'react'
import useCakeMosaic from '../hooks/useCakeMosaic.js'

export default function CakeMosaic({ src, reducedMotion }) {
  const canvasRef = useRef(null)
  const status = useCakeMosaic(canvasRef, src, reducedMotion)

  return (
    <div
      className="cake-mosaic"
      data-status={status}
      role="img"
      aria-label="A nineteenth birthday cake"
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      {status === 'loading' && (
        <p className="cake-mosaic__status">Loading</p>
      )}
      {status === 'error' && (
        <p className="cake-mosaic__status" role="alert">
          Image unavailable
        </p>
      )}
    </div>
  )
}
