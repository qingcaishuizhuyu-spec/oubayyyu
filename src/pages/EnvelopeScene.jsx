import { lazy, Suspense, useState } from 'react'
import SceneImage from '../components/SceneImage.jsx'
import TicketStub from '../components/TicketStub.jsx'
import { assets } from '../utils/assets.js'
import './EnvelopeScene.css'

const LuckyPaperCrumple = lazy(
  () => import('../components/LuckyPaperCrumple.jsx'),
)

export default function EnvelopeScene({ onComplete }) {
  const [phase, setPhase] = useState('envelope')

  return (
    <section
      className={`envelope-scene envelope-scene--${phase}`}
      aria-label={
        phase === 'envelope'
          ? 'Open the envelope'
          : phase === 'lucky'
            ? 'Your lucky magic'
            : phase === 'ticket'
              ? 'Hello Earth ticket'
              : 'A message before the records'
      }
    >
      <div className="envelope-scene__stage">
        {phase === 'envelope' && (
          <button
            className="envelope-scene__envelope"
            type="button"
            onClick={() => setPhase('lucky')}
            aria-label="Open the envelope"
          >
            <SceneImage
              src={assets.envelope}
              alt=""
              loading="eager"
            />
          </button>
        )}

        {phase === 'lucky' && (
          <Suspense
            fallback={
              <p className="envelope-scene__effect-loading">Loading</p>
            }
          >
            <LuckyPaperCrumple
              src={assets.luckyMagic}
              onEscaped={() => setPhase('ticket')}
            />
          </Suspense>
        )}

        {phase === 'ticket' && (
          <TicketStub
            src={assets.helloEarth}
            onTear={() => setPhase('invitation')}
          />
        )}

        {phase === 'invitation' && (
          <button
            className="envelope-scene__invitation-screen"
            type="button"
            onClick={onComplete}
            aria-label="Continue to the records"
          >
            <span className="scene-instruction envelope-scene__invitation-copy">
              I've picked out a few photos I really love and some songs that I
              think sound great and go perfectly with them. If you're curious,
              click the screen~
            </span>
          </button>
        )}
      </div>

      {phase === 'envelope' && (
        <button
          className="scene-instruction envelope-scene__prompt"
          type="button"
          onClick={() => setPhase('lucky')}
        >
          Open the envelope.
        </button>
      )}

      {phase === 'lucky' && (
        <>
          <div className="scene-instruction envelope-scene__lucky-intro">
            <p>Don't click your mouse! Try scrolling to read~</p>
            <p>
              Once you've finished reading, if you'd like to receive oubayyyu's
              lucky magic, click your mouse to keep the little paper ball safe~
            </p>
          </div>
          <p className="scene-instruction envelope-scene__hint">
            Hint: When the paper ball disappears off the screen, your good luck
            has already made its way into the real world!
          </p>
        </>
      )}

      {phase === 'ticket' && (
        <p className="scene-instruction envelope-scene__ticket-copy">
          Tear off the ticket stub to get your CDs.
        </p>
      )}
    </section>
  )
}
