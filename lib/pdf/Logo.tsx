import fs from 'fs'
import path from 'path'
import { Svg, Path } from '@react-pdf/renderer'

const svgSource = fs.readFileSync(path.join(process.cwd(), 'public/images/logo_b.svg'), 'utf-8')
const dAttr = svgSource.match(/\sd="([^"]+)"/)?.[1] ?? ''
const viewBoxAttr = svgSource.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 1734 423'

export function Logo({ width = 140 }: { width?: number }) {
  const [, , vbWidth, vbHeight] = viewBoxAttr.split(' ').map(Number)
  const height = width * (vbHeight / vbWidth)
  return (
    <Svg viewBox={viewBoxAttr} style={{ width, height }}>
      <Path d={dAttr} fill="#1C1A18" />
    </Svg>
  )
}
