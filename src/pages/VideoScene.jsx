import { useEffect, useRef, useState } from 'react'
import './VideoScene.css'

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function VideoScene({ track, onBack }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onBack()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onBack])

  const togglePlayback = async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    try {
      if (video.paused) {
        await video.play()
      } else {
        video.pause()
      }
    } catch {
      setFailed(true)
    }
  }

  const seek = (event) => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const nextTime = Number(event.target.value)
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <section className="video-scene" aria-label={`Record ${track.id} video`}>
      <button
        className="video-scene__back"
        type="button"
        onClick={onBack}
        aria-label="Back to CD selection"
      >
        <span aria-hidden="true">←</span>
        Back to CDs
      </button>

      <div className="video-scene__player">
        <video
          ref={videoRef}
          src={track.video}
          preload="metadata"
          playsInline
          onClick={togglePlayback}
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration || 0)
          }}
          onDurationChange={(event) => {
            setDuration(event.currentTarget.duration || 0)
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime || 0)
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setFailed(true)}
        >
          Your browser does not support this video.
        </video>

        <div className="video-scene__controls">
          <button
            className="video-scene__toggle"
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? 'Pause video' : 'Play video'}
          >
            <span aria-hidden="true">{playing ? 'Pause' : 'Play'}</span>
          </button>

          <input
            className="video-scene__progress"
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={Math.min(currentTime, duration || 0)}
            onChange={seek}
            aria-label="Video progress"
            style={{
              '--video-progress': `${
                duration ? (currentTime / duration) * 100 : 0
              }%`,
            }}
          />

          <span className="video-scene__time" aria-live="off">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {failed && (
          <p className="video-scene__error" role="alert">
            Video unavailable
          </p>
        )}
      </div>
    </section>
  )
}
