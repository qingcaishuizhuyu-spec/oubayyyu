import { useMemo, useState } from 'react'
import AppShell from './components/AppShell.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import SceneManager from './components/SceneManager.jsx'
import CakeScene from './pages/CakeScene.jsx'
import CakePickerScene from './pages/CakePickerScene.jsx'
import EnvelopeScene from './pages/EnvelopeScene.jsx'
import RecordScene from './pages/RecordScene.jsx'
import VideoScene from './pages/VideoScene.jsx'
import { assets } from './utils/assets.js'
import { tracks } from './utils/tracks.js'

export default function App() {
  const [selectedCake, setSelectedCake] = useState(null)

  const scenes = useMemo(
    () => [
      {
        id: 'cake-picker',
        render: ({ goToScene }) => (
          <CakePickerScene
            cakes={assets.cakeChoices}
            onSelect={(imageSrc) => {
              setSelectedCake(imageSrc)
              goToScene('cake')
            }}
          />
        ),
      },
      {
        id: 'cake',
        render: ({ goToScene }) => (
          <CakeScene
            imageSrc={selectedCake ?? assets.cake}
            onComplete={() => goToScene('envelope')}
          />
        ),
      },
      {
        id: 'envelope',
        render: ({ goToScene }) => (
          <EnvelopeScene onComplete={() => goToScene('records')} />
        ),
      },
      {
        id: 'records',
        render: ({ goToScene }) => (
          <RecordScene
            tracks={tracks}
            onOpen={(trackId) => goToScene(`track-${trackId}`)}
          />
        ),
      },
      ...tracks.map((track) => ({
        id: `track-${track.id}`,
        render: ({ goToScene }) => (
          <VideoScene
            track={track}
            onBack={() => goToScene('records')}
          />
        ),
      })),
    ],
    [selectedCake],
  )

  return (
    <ErrorBoundary>
      <AppShell>
        <SceneManager scenes={scenes} initialSceneId="cake-picker" />
      </AppShell>
    </ErrorBoundary>
  )
}
