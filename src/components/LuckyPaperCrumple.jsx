import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './LuckyPaperCrumple.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}

function crumpleOffset(x, y) {
  return (
    Math.sin(x * 10.7 + y * 4.1) * 0.052 +
    Math.cos(y * 13.1 - x * 3.7) * 0.042 +
    Math.sin((x + y) * 19.4) * 0.028
  )
}

export default function LuckyPaperCrumple({ src, onEscaped }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const hitRef = useRef(null)
  const fallbackRef = useRef(null)
  const escapedRef = useRef(onEscaped)
  const [status, setStatus] = useState('loading')

  escapedRef.current = onEscaped

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const hit = hitRef.current
    const fallback = fallbackRef.current
    if (!root || !canvas || !hit || !fallback) {
      return undefined
    }

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setStatus('error')
      return undefined
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.z = 10

    const ambient = new THREE.AmbientLight(0xffffff, 1.45)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
    keyLight.position.set(-3, 4, 7)
    const rimLight = new THREE.DirectionalLight(0xbcc6d3, 1.25)
    rimLight.position.set(4, -2, 5)
    scene.add(ambient, keyLight, rimLight)

    const group = new THREE.Group()
    scene.add(group)

    const planeGeometry = new THREE.PlaneGeometry(1, 1, 72, 72)
    const originalPlanePositions = Float32Array.from(
      planeGeometry.attributes.position.array,
    )
    let planeMaterial
    let plane
    let sphere
    let sphereMaterial
    let texture
    let ready = false
    let dragging = false
    let started = false
    let escaped = false
    let escapeDirection = null
    let pointerId = null
    let lastX = 0
    let lastY = 0
    let fold = 0
    let zoom = 1
    let zoomTarget = 1
    let hasPanned = false
    const cursor = { x: 0, y: 0 }
    let imageAspect = 1832 / 1388
    let fitScale = 1
    let ballRadius = 76
    let viewportWidth = 1
    let viewportHeight = 1
    let animationFrame = 0
    let lastTime = 0
    let disposed = false
    let escapeTimer = 0

    const updateHitTarget = () => {
      if (!started) {
        const planeWidth = fitScale * zoom
        const planeHeight = fitScale * zoom * imageAspect
        const centerX = viewportWidth / 2 + group.position.x
        const centerY = viewportHeight / 2 - group.position.y
        hit.style.transform = `translate3d(${
          centerX - planeWidth / 2
        }px, ${centerY - planeHeight / 2}px, 0)`
        hit.style.width = `${planeWidth}px`
        hit.style.height = `${planeHeight}px`
        return
      }

      const centerX = viewportWidth / 2 + group.position.x
      const centerY = viewportHeight / 2 - group.position.y
      const size = ballRadius * 2
      hit.style.transform = `translate3d(${centerX - size / 2}px, ${
        centerY - size / 2
      }px, 0)`
      hit.style.width = `${size}px`
      hit.style.height = `${size}px`
    }

    const triggerEscape = (direction) => {
      if (escaped || !started) {
        return
      }

      escaped = true
      dragging = false
      escapeDirection = direction
      hit.dataset.escaped = 'true'

      if (pointerId !== null && hit.hasPointerCapture(pointerId)) {
        hit.releasePointerCapture(pointerId)
      }
      pointerId = null
    }

    const checkForEscape = () => {
      if (escaped || !started || fold < 0.28) {
        return
      }

      const centerX = viewportWidth / 2 + group.position.x
      const centerY = viewportHeight / 2 - group.position.y
      // 光标到达屏幕边缘后，纸团继续带惯性飞出，触屏设备也能完成该动作。
      const margin = ballRadius * 0.8

      if (centerX < margin) {
        triggerEscape([-1, 0])
      } else if (centerX > viewportWidth - margin) {
        triggerEscape([1, 0])
      } else if (centerY < margin) {
        triggerEscape([0, -1])
      } else if (centerY > viewportHeight - margin) {
        triggerEscape([0, 1])
      }
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      viewportWidth = Math.max(1, rect.width)
      viewportHeight = Math.max(1, rect.height)
      cursor.x = viewportWidth / 2
      cursor.y = viewportHeight / 2
      renderer.setSize(viewportWidth, viewportHeight, false)

      camera.left = -viewportWidth / 2
      camera.right = viewportWidth / 2
      camera.top = viewportHeight / 2
      camera.bottom = -viewportHeight / 2
      camera.updateProjectionMatrix()

      const maxWidth = viewportWidth * 0.7
      const maxHeight =
        viewportHeight * (viewportWidth < 768 ? 0.34 : 0.44)
      fitScale = Math.min(maxWidth, maxHeight / imageAspect)
      ballRadius = clamp(Math.min(viewportWidth, viewportHeight) * 0.105, 38, 78)
      if (!started && !hasPanned) {
        group.position.set(0, 0, 0)
      }
      updateHitTarget()
    }

    const animate = (time) => {
      if (disposed) {
        return
      }

      const delta = lastTime ? Math.min(0.04, (time - lastTime) / 1000) : 1 / 60
      lastTime = time

      const targetFold = started ? 1 : 0
      const easing = 1 - Math.exp(-delta * 4.2)
      fold += (targetFold - fold) * easing
      const previousZoom = zoom
      zoom += (zoomTarget - zoom) * (1 - Math.exp(-delta * 7.5))
      if (!started && Math.abs(zoom - previousZoom) > 0.00001) {
        const pointerX = cursor.x - viewportWidth / 2
        const pointerY = viewportHeight / 2 - cursor.y
        const ratio = zoom / previousZoom
        group.position.x =
          pointerX - (pointerX - group.position.x) * ratio
        group.position.y =
          pointerY - (pointerY - group.position.y) * ratio
        hasPanned = true
      }
      checkForEscape()

      if (escaped && escapeDirection) {
        const speed = 1150
        group.position.x += escapeDirection[0] * speed * delta
        group.position.y -= escapeDirection[1] * speed * delta
      }

      if (plane && planeMaterial) {
        const positions = planeGeometry.attributes.position.array
        for (let i = 0; i < positions.length; i += 3) {
          const x = originalPlanePositions[i]
          const y = originalPlanePositions[i + 1]
          positions[i] =
            x + Math.sin(y * 8.2 + 1.4) * 0.018 * fold
          positions[i + 1] =
            y + Math.cos(x * 9.1 - 0.8) * 0.018 * fold
          positions[i + 2] =
            crumpleOffset(x * 2, y * 2) *
            fold *
            fitScale *
            imageAspect *
            0.82
        }
        planeGeometry.attributes.position.needsUpdate = true
        planeGeometry.computeVertexNormals()

        const collapse = 1 - fold * 0.78
        const scaledFit = fitScale * zoom
        plane.scale.set(
          scaledFit * collapse,
          scaledFit * imageAspect * collapse,
          1,
        )
        planeMaterial.opacity = 1 - smoothstep(0.18, 0.72, fold)
        plane.visible = planeMaterial.opacity > 0.002
      }

      if (sphere && sphereMaterial) {
        const scale = ballRadius * smoothstep(0.2, 0.92, fold)
        sphere.scale.setScalar(Math.max(0.001, scale))
        sphereMaterial.opacity = smoothstep(0.22, 0.72, fold)
        sphere.visible = sphereMaterial.opacity > 0.002
        sphere.rotation.x = fold * 0.24
        sphere.rotation.y = fold * -0.34
      }

      updateHitTarget()
      renderer.render(scene, camera)

      if (escaped) {
        const centerX = viewportWidth / 2 + group.position.x
        const centerY = viewportHeight / 2 - group.position.y
        const isGone =
          centerX + ballRadius < 0 ||
          centerX - ballRadius > viewportWidth ||
          centerY + ballRadius < 0 ||
          centerY - ballRadius > viewportHeight

        if (isGone && !escapeTimer) {
          escapeTimer = window.setTimeout(
            () => escapedRef.current?.(),
            260,
          )
        }
      }

      animationFrame = requestAnimationFrame(animate)
    }

    const onPointerDown = (event) => {
      if (!ready || escaped || dragging) {
        return
      }
      if (event.button !== 0 || !event.isPrimary) {
        return
      }

      event.preventDefault()
      dragging = true
      started = true
      zoomTarget = 1
      pointerId = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
      hit.setPointerCapture(event.pointerId)
      hit.dataset.holding = 'true'
      hit.setAttribute('aria-pressed', 'true')
    }

    const onPointerMove = (event) => {
      if (!dragging || event.pointerId !== pointerId) {
        return
      }

      const deltaX = event.clientX - lastX
      const deltaY = event.clientY - lastY
      group.position.x += deltaX
      group.position.y -= deltaY
      lastX = event.clientX
      lastY = event.clientY
      checkForEscape()
    }

    const onPointerUp = (event) => {
      if (event.pointerId !== pointerId) {
        return
      }

      dragging = false
      pointerId = null
      hit.dataset.holding = 'false'
      hit.setAttribute('aria-pressed', 'false')
      checkForEscape()
    }

    const onKeyDown = (event) => {
      if (!ready || escaped) {
        return
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (!event.repeat) {
          started = true
          hit.dataset.holding = 'true'
          hit.setAttribute('aria-pressed', 'true')
        }
      }

      if (started && event.key.startsWith('Arrow')) {
        event.preventDefault()
        const step = event.shiftKey ? 42 : 22
        if (event.key === 'ArrowLeft') group.position.x -= step
        if (event.key === 'ArrowRight') group.position.x += step
        if (event.key === 'ArrowUp') group.position.y += step
        if (event.key === 'ArrowDown') group.position.y -= step
        checkForEscape()
      }
    }

    const onKeyUp = (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        hit.dataset.holding = 'false'
        hit.setAttribute('aria-pressed', 'false')
      }
    }

    const onCursorMove = (event) => {
      const rect = root.getBoundingClientRect()
      cursor.x = event.clientX - rect.left
      cursor.y = event.clientY - rect.top
    }

    const onWheel = (event) => {
      if (started || escaped) {
        return
      }

      event.preventDefault()
      zoomTarget = clamp(zoomTarget + event.deltaY * 0.0009, 0.68, 3.2)
    }

    hit.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    hit.addEventListener('keydown', onKeyDown)
    hit.addEventListener('keyup', onKeyUp)
    root.addEventListener('pointermove', onCursorMove, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: false })

    const observer = new ResizeObserver(resize)
    observer.observe(root)
    resize()

    const loader = new THREE.TextureLoader()
    loader.load(
      src,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose()
          return
        }

        texture = loadedTexture
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        )
        imageAspect =
          texture.image?.naturalHeight / texture.image?.naturalWidth ||
          imageAspect

        planeMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.94,
          metalness: 0,
          transparent: true,
          side: THREE.DoubleSide,
        })
        plane = new THREE.Mesh(planeGeometry, planeMaterial)
        group.add(plane)

        const sphereGeometry = new THREE.SphereGeometry(1, 64, 48)
        const spherePositions = sphereGeometry.attributes.position
        const vertex = new THREE.Vector3()
        for (let i = 0; i < spherePositions.count; i += 1) {
          vertex.fromBufferAttribute(spherePositions, i)
          const noise =
            0.9 +
            Math.sin(vertex.x * 9.7 + vertex.y * 6.1) * 0.075 +
            Math.cos(vertex.z * 12.3 - vertex.y * 5.4) * 0.055
          vertex.multiplyScalar(noise)
          spherePositions.setXYZ(i, vertex.x, vertex.y, vertex.z)
        }
        sphereGeometry.computeVertexNormals()

        sphereMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.82,
          metalness: 0.03,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        })
        sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.visible = false
        group.add(sphere)

        ready = true
        hit.disabled = false
        hit.dataset.ready = 'true'
        fallback.dataset.hidden = 'true'
        setStatus('ready')
        resize()
      },
      undefined,
      () => {
        if (!disposed) {
          setStatus('error')
        }
      },
    )

    animationFrame = requestAnimationFrame(animate)

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      window.clearTimeout(escapeTimer)
      observer.disconnect()
      hit.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      hit.removeEventListener('keydown', onKeyDown)
      hit.removeEventListener('keyup', onKeyUp)
      root.removeEventListener('pointermove', onCursorMove)
      window.removeEventListener('wheel', onWheel)
      planeGeometry.dispose()
      planeMaterial?.dispose()
      sphere?.geometry.dispose()
      sphereMaterial?.dispose()
      texture?.dispose()
      renderer.dispose()
    }
  }, [src])

  return (
    <div
      ref={rootRef}
      className="lucky-paper"
      data-status={status}
      aria-label="Lucky magic paper"
    >
      <canvas ref={canvasRef} className="lucky-paper__canvas" />
      <img
        ref={fallbackRef}
        className="lucky-paper__fallback"
        src={src}
        alt="Lucky magic note"
        draggable="false"
        onError={() => setStatus('error')}
      />
      <button
        ref={hitRef}
        className="lucky-paper__hit"
        type="button"
        disabled={status !== 'ready'}
        aria-label="Hold the lucky note to crumple it, then drag the paper ball off screen"
        aria-pressed="false"
      />
      {status === 'loading' && (
        <p className="lucky-paper__status">Loading</p>
      )}
      {status === 'error' && (
        <p className="lucky-paper__status" role="alert">
          Paper effect unavailable
        </p>
      )}
    </div>
  )
}
