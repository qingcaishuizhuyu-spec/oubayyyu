import { useCallback, useMemo, useState } from 'react'

export default function SceneManager({ scenes, initialSceneId }) {
  const [activeSceneId, setActiveSceneId] = useState(initialSceneId)

  const sceneMap = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, scene])),
    [scenes],
  )

  const goToScene = useCallback(
    (sceneId) => {
      if (!sceneMap.has(sceneId)) {
        console.warn(`Unknown scene: ${sceneId}`)
        return false
      }

      setActiveSceneId(sceneId)
      return true
    },
    [sceneMap],
  )

  const activeScene = sceneMap.get(activeSceneId) ?? scenes[0]

  if (!activeScene) {
    return null
  }

  return (
    <main
      className="scene-stage"
      data-scene={activeScene.id}
      aria-live="polite"
    >
      <div className="scene-stage__content" key={activeScene.id}>
        {activeScene.render({
          goToScene,
          sceneIds: [...sceneMap.keys()],
        })}
      </div>
    </main>
  )
}
