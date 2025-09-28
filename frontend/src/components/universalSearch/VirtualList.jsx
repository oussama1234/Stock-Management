import React, { memo, useCallback, useMemo, useRef, useState } from 'react'

// Lightweight virtual list without external deps
// Assumptions: fixed row height; pass itemHeight and container height
// Props:
// - items: any[]
// - itemHeight: number (px)
// - height: number (px)
// - overscan: number
// - renderRow: ({ item, index, style }) => ReactNode
const VirtualList = memo(function VirtualList({ items, itemHeight = 44, height = 260, overscan = 6, renderRow }) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const totalHeight = items.length * itemHeight

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2
    const end = Math.min(items.length - 1, start + visibleCount)
    return { startIndex: start, endIndex: end }
  }, [scrollTop, itemHeight, height, overscan, items.length])

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const offsetY = startIndex * itemHeight
  const slice = items.slice(startIndex, endIndex + 1)

  return (
    <div ref={containerRef} onScroll={onScroll} style={{ height }} className="overflow-auto">
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {slice.map((item, i) => {
            const index = startIndex + i
            const style = { height: itemHeight }
            return (
              <div key={item.key || index} style={style}>
                {renderRow({ item, index, style })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default VirtualList
