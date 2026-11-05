import { useMemo } from 'react'
import AppShell from './components/AppShell.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import SceneManager from './components/SceneManager.jsx'
import CakeScene from './pages/CakeScene.jsx'
import EnvelopeScene from './pages/EnvelopeScene.jsx'
import RecordScene from './pages/RecordScene.jsx'
import VideoScene from './pages/VideoScene.jsx'
import { tracks } from './utils/tracks.js'

export default function App() {
  const scenes = useMemo(
    () => [
      {
        id: 'cake',
        render: ({ goToScene }) => (
          <CakeScene onComplete={() => goToScene('envelope')} />
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
    [],
  )

  return (
    <ErrorBoundary>
      <AppShell>
        <SceneManager scenes={scenes} initialSceneId="cake" />
      </AppShell>
    </ErrorBoundary>
  )
}
