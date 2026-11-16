type Gable = 'step' | 'bell' | 'point'

const WIDTHS = [52, 44, 60, 48, 56, 46]
const HEIGHTS = [64, 86, 54, 78, 70, 94]
const GABLES: Gable[] = ['step', 'bell', 'point']
const COLORS = ['#FFC58F', '#F7A8B8', '#AFC3FF', '#FFDD75', '#B5E3B4']

const VIEW_WIDTH = 6000
const VIEW_HEIGHT = 140
const GROUND = 128

function housePath(x: number, w: number, h: number, gable: Gable): string {
  const top = GROUND - h
  if (gable === 'point') {
    return `M${x},${GROUND} V${top} L${x + w / 2},${top - w * 0.45} L${x + w},${top} V${GROUND} Z`
  }
  if (gable === 'bell') {
    const peak = top - w * 0.55
    return `M${x},${GROUND} V${top} Q${x},${peak} ${x + w / 2},${peak} Q${x + w},${peak} ${x + w},${top} V${GROUND} Z`
  }
  const s = w / 6
  return `M${x},${GROUND} V${top} h${s} v${-s} h${s} v${-s} h${w - 4 * s} v${s} h${s} v${s} h${s} V${GROUND} Z`
}

function buildHouses() {
  const houses = []
  let x = 0
  for (let i = 0; x < VIEW_WIDTH; i++) {
    const w = WIDTHS[i % WIDTHS.length]
    const h = HEIGHTS[i % HEIGHTS.length]
    houses.push({ x, w, h, gable: GABLES[i % GABLES.length], color: COLORS[i % COLORS.length] })
    x += w
  }
  return houses
}

const HOUSES = buildHouses()

export function Skyline() {
  return (
    <svg className="skyline" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} aria-hidden>
      <g stroke="#1A1A40" strokeWidth="2.5" strokeLinejoin="round">
        {HOUSES.map((house) => {
          const windowW = house.w * 0.22
          const rows = Math.max(1, Math.floor((house.h - 30) / 22))
          return (
            <g key={house.x}>
              <path d={housePath(house.x, house.w, house.h, house.gable)} fill={house.color} />
              {Array.from({ length: rows }, (_, row) =>
                [0.2, 0.58].map((offset) => (
                  <rect
                    key={`${row}-${offset}`}
                    x={house.x + house.w * offset}
                    y={GROUND - house.h + 8 + row * 22}
                    width={windowW}
                    height={13}
                    rx={2}
                    fill="#FFF8E7"
                    strokeWidth="2"
                  />
                )),
              )}
              <rect
                x={house.x + house.w * 0.38}
                y={GROUND - 18}
                width={house.w * 0.24}
                height={18}
                fill="#1A1A40"
              />
            </g>
          )
        })}
      </g>
      <rect x="0" y={GROUND} width={VIEW_WIDTH} height="12" fill="#7FB7F5" />
      <line x1="0" y1={GROUND} x2={VIEW_WIDTH} y2={GROUND} stroke="#1A1A40" strokeWidth="2.5" />
    </svg>
  )
}
