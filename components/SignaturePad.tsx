'use client'

import { useEffect, useRef, useState } from 'react'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
}

export default function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || mode !== 'draw') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1C1A18'
  }, [mode])

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawing.current = true
    hasDrawn.current = true
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    canvas.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function handlePointerUp() {
    if (!drawing.current) return
    drawing.current = false
    emitDraw()
  }

  function emitDraw() {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn.current) { onChange(null); return }
    onChange(canvas.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    onChange(null)
  }

  function switchMode(next: 'draw' | 'type') {
    setMode(next)
    if (next === 'type') {
      emitTyped(typedName)
    } else {
      clear()
    }
  }

  function emitTyped(name: string) {
    setTypedName(name)
    if (!name.trim()) { onChange(null); return }
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 120
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1C1A18'
    ctx.font = "48px 'Great Vibes', cursive"
    ctx.textBaseline = 'middle'
    ctx.fillText(name, 12, 60)
    onChange(canvas.toDataURL('image/png'))
  }

  return (
    <div className="sigpad">
      <div className="sigpad-tabs">
        <button type="button" onClick={() => switchMode('draw')} className={`sigpad-tab${mode === 'draw' ? ' active' : ''}`}>
          Draw
        </button>
        <button type="button" onClick={() => switchMode('type')} className={`sigpad-tab${mode === 'type' ? ' active' : ''}`}>
          Type your name
        </button>
      </div>

      {mode === 'draw' ? (
        <div>
          <canvas
            ref={canvasRef}
            width={480}
            height={140}
            className="sigpad-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          <button type="button" onClick={clear} className="sigpad-clear">Clear</button>
        </div>
      ) : (
        <div className="sigpad-type-box">
          <input
            type="text"
            placeholder="Type your full name"
            value={typedName}
            onChange={e => emitTyped(e.target.value)}
            className="sigpad-type-input"
          />
        </div>
      )}
    </div>
  )
}
