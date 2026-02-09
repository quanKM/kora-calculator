import { useEffect, useState } from 'react'
import { parseRoomsFromCsv, RawPricingRow } from '../lib/pricingCsvParser'
import type { Room } from '../lib/types'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/src/assets/pricing.csv')
        const text = await res.text()
        const [headerLine, ...dataLines] = text.split('\n').filter((line) => line.trim().length > 0)
        const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

        const rows: RawPricingRow[] = dataLines.map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
          const row: Record<string, string> = {}
          headers.forEach((h, idx) => {
            row[h] = cols[idx] ?? ''
          })
          return row as RawPricingRow
        })

        const parsedRooms = parseRoomsFromCsv(rows)
        if (!cancelled) {
          setRooms(parsedRooms)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError('Không thể tải dữ liệu giá phòng. Vui lòng thử lại hoặc liên hệ lễ tân.')
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { rooms, loading, error }
}

