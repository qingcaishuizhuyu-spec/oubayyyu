import { useEffect, useRef, useState } from 'react'

function drawCover(context, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale

  context.clearRect(0, 0, width, height)
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  )
}

/**
 * 以低分辨率画布构建马赛克，再用跟随指针的高分辨率圆形区域揭示细节。
 * 这种画法只缩放两张小画布，避免逐块绘制上千个矩形。
 */
export default function useCakeMosaic(canvasRef, imageSrc, reducedMotion) {
  const [status, setStatus] = useState('loading')
  const pointer = useRef({
    x: 0.5,
    y: 0.48,
    targetX: 0.5,
    targetY: 0.48,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    const mosaicCanvas = document.createElement('canvas')
    const detailCanvas = document.createElement('canvas')
    const revealCanvas = document.createElement('canvas')
    const mosaicContext = mosaicCanvas.getContext('2d')
    const detailContext = detailCanvas.getContext('2d')
    const revealContext = revealCanvas.getContext('2d')
    const image = new Image()
    let animationFrame = 0
    let resizeObserver
    let width = 0
    let height = 0
    let imageReady = false
    let cancelled = false

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = false

      if (!imageReady) {
        return
      }

      const mosaicSize = Math.max(10, Math.min(width, height) / 54)
      mosaicCanvas.width = Math.max(1, Math.ceil(width / mosaicSize))
      mosaicCanvas.height = Math.max(1, Math.ceil(height / mosaicSize))
      detailCanvas.width = Math.ceil(mosaicCanvas.width * 4)
      detailCanvas.height = Math.ceil(mosaicCanvas.height * 4)
      revealCanvas.width = detailCanvas.width
      revealCanvas.height = detailCanvas.height

      mosaicContext.imageSmoothingEnabled = false
      detailContext.imageSmoothingEnabled = false
      drawCover(
        mosaicContext,
        image,
        mosaicCanvas.width,
        mosaicCanvas.height,
      )
      drawCover(detailContext, image, detailCanvas.width, detailCanvas.height)
    }

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointer.current.targetX = Math.min(
        1,
        Math.max(0, (event.clientX - rect.left) / rect.width),
      )
      pointer.current.targetY = Math.min(
        1,
        Math.max(0, (event.clientY - rect.top) / rect.height),
      )
    }

    const render = (time) => {
      if (!imageReady || width === 0 || height === 0) {
        animationFrame = requestAnimationFrame(render)
        return
      }

      const smoothing = reducedMotion ? 1 : 0.14
      pointer.current.x +=
        (pointer.current.targetX - pointer.current.x) * smoothing
      pointer.current.y +=
        (pointer.current.targetY - pointer.current.y) * smoothing

      const pointerX = pointer.current.x * width
      const pointerY = pointer.current.y * height
      const idleShift = reducedMotion ? 0 : Math.sin(time * 0.00035) * 6
      const parallaxX = (pointer.current.x - 0.5) * -16
      const parallaxY = (pointer.current.y - 0.5) * -12

      context.clearRect(0, 0, width, height)
      context.fillStyle = '#050505'
      context.fillRect(0, 0, width, height)
      context.imageSmoothingEnabled = false
      context.drawImage(
        mosaicCanvas,
        -12 + parallaxX,
        -12 + parallaxY,
        width + 24,
        height + 24,
      )

      const radius = Math.min(145, Math.max(78, width * 0.2))
      const detailScaleX = detailCanvas.width / width
      const detailScaleY = detailCanvas.height / height
      const revealX = pointerX * detailScaleX
      const revealY = (pointerY + idleShift) * detailScaleY
      const revealRadius = radius * Math.min(detailScaleX, detailScaleY)

      revealContext.clearRect(
        0,
        0,
        revealCanvas.width,
        revealCanvas.height,
      )
      revealContext.globalCompositeOperation = 'source-over'
      revealContext.drawImage(detailCanvas, 0, 0)
      revealContext.globalCompositeOperation = 'destination-in'
      const mask = revealContext.createRadialGradient(
        revealX,
        revealY,
        revealRadius * 0.32,
        revealX,
        revealY,
        revealRadius,
      )
      mask.addColorStop(0, 'rgba(255, 255, 255, 1)')
      mask.addColorStop(0.58, 'rgba(255, 255, 255, 0.92)')
      mask.addColorStop(1, 'rgba(255, 255, 255, 0)')
      revealContext.fillStyle = mask
      revealContext.fillRect(
        0,
        0,
        revealCanvas.width,
        revealCanvas.height,
      )
      revealContext.globalCompositeOperation = 'source-over'

      context.imageSmoothingEnabled = true
      context.drawImage(revealCanvas, 0, 0, width, height)

      animationFrame = requestAnimationFrame(render)
    }

    image.decoding = 'async'
    image.onload = () => {
      if (cancelled) {
        return
      }

      imageReady = true
      setStatus('ready')
      resize()
    }
    image.onerror = () => {
      if (!cancelled) {
        setStatus('error')
      }
    }
    image.src = imageSrc

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    canvas.addEventListener('pointermove', onPointerMove, { passive: true })
    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
    }
  }, [canvasRef, imageSrc, reducedMotion])

  return status
}
