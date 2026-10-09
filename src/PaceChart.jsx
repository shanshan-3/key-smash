import { useEffect, useRef } from 'react'

export default function PaceChart({ samples = [], comparison = [], label = 'WPM over time', kind = 'pace', comparisonLabel = 'Previous best' }) {
  const history = kind === 'history'
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const points = samples.filter((s) => Number.isFinite(s.second) && Number.isFinite(s.net))
  const pbPoints = comparison.filter((s) => Number.isFinite(s.second) && Number.isFinite(s.net))

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !points.length) return
    function draw() {
      const width = container.clientWidth
      if (!width) return
      const height = 230
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = height * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      const pad = { left: 46, right: 16, top: 28, bottom: 36 }
      const w = width - pad.left - pad.right
      const h = height - pad.top - pad.bottom
      const maxTime = Math.max(1, ...points.map((p) => p.second), ...pbPoints.map((p) => p.second))
      const maxWpm = Math.max(20, Math.ceil(Math.max(...points.map((p) => p.net), ...pbPoints.map((p) => p.net)) / 20) * 20)
      const x = (second) => pad.left + second / maxTime * w
      const y = (value) => pad.top + h - value / maxWpm * h
      ctx.font = '11px "Space Mono", monospace'
      ctx.fillStyle = '#50504a'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 4; i++) {
        const value = maxWpm * i / 4
        ctx.fillText(Math.round(value).toString(), pad.left - 10, y(value) + 4)
        ctx.beginPath()
        ctx.strokeStyle = '#dedbd2'
        ctx.lineWidth = 1
        ctx.moveTo(pad.left, y(value))
        ctx.lineTo(width - pad.right, y(value))
        ctx.stroke()
      }
      ctx.textAlign = 'left'
      ctx.fillText('WPM', 0, 13)
      ctx.textAlign = 'center'
      if (history) {
        const step = Math.max(1, Math.ceil(points.length / 5))
        points.forEach((point, i) => {
          if (i % step === 0 || i === points.length - 1) ctx.fillText(point.label.slice(5), x(point.second), height - 10)
        })
      } else for (let i = 0; i <= 4; i++) {
          const second = maxTime * i / 4
          ctx.fillText(`${Number(second.toFixed(1))}s`, x(second), height - 10)
        }
      function line(series, dashed) {
        if (!series.length) return
        ctx.beginPath()
        ctx.strokeStyle = '#111111'
        ctx.lineWidth = dashed ? 2 : 3
        ctx.setLineDash(dashed ? [6, 5] : [])
        series.forEach((p, i) => i === 0 ? ctx.moveTo(x(p.second), y(p.net)) : ctx.lineTo(x(p.second), y(p.net)))
        ctx.stroke()
        ctx.setLineDash([])
        if (series.length === 1) {
          ctx.fillStyle = '#111111'
          ctx.fillRect(x(series[0].second) - 3, y(series[0].net) - 3, 6, 6)
        }
      }
      line(pbPoints, true)
      line(points, false)
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(container)
    return () => observer.disconnect()
  })

  if (!points.length) return <p className="empty-copy">{history ? 'Complete a test to start your progress chart.' : 'This run has no pace samples. Complete another test to record a curve.'}</p>
  return (
    <figure className="pace-chart">
      <figcaption className="chart-heading"><h3>{label}</h3><div className="chart-legend"><span><i /> {history ? 'Daily average' : 'This run'}</span>{pbPoints.length > 0 && <span><i className="dashed" /> {comparisonLabel}</span>}</div></figcaption>
      <div ref={containerRef}><canvas ref={canvasRef} role="img" aria-label={`${label}. ${points.length} recorded ${history ? 'days' : 'intervals'}. Measurements are available below.`} /></div>
      <details className="sample-details"><summary>{history ? 'View daily averages' : 'View pace measurements'}</summary><div className="table-scroll" tabIndex={0} role="region" aria-label={history ? 'Daily averages' : 'Pace measurements'}><table><thead><tr><th scope="col">{history ? 'Date' : 'Seconds'}</th><th scope="col">{history ? 'Average WPM' : 'Net WPM'}</th>{!history && <th scope="col">Raw WPM</th>}</tr></thead><tbody>{points.map((p) => <tr key={p.second}><td>{history ? p.label : Number(p.second.toFixed(2))}</td><td>{p.net}</td>{!history && <td>{p.raw}</td>}</tr>)}</tbody></table>{pbPoints.length > 0 && <table><caption>{comparisonLabel}</caption><thead><tr><th scope="col">Seconds</th><th scope="col">Net WPM</th></tr></thead><tbody>{pbPoints.map((point) => <tr key={point.second}><td>{Number(point.second.toFixed(2))}</td><td>{point.net}</td></tr>)}</tbody></table>}</div></details>
    </figure>
  )
}
