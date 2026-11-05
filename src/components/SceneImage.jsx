import { useState } from 'react'

export default function SceneImage({
  src,
  alt,
  className = '',
  imageClassName = '',
  loading = 'lazy',
}) {
  const [status, setStatus] = useState('loading')

  return (
    <div
      className={`scene-image ${className}`}
      data-status={status}
    >
      {status !== 'error' && (
        <img
          className={imageClassName}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'loading' && (
        <span className="scene-image__status" aria-hidden="true">
          Loading
        </span>
      )}
      {status === 'error' && (
        <span className="scene-image__status" role="alert">
          Image unavailable
        </span>
      )}
    </div>
  )
}
