// สร้างชุดตัวเลขสำหรับทุกเลเวล
// เลือกตัวเลขจากช่วง 1..numberPoolMax ให้ครบ playCount แบบกระจาย
export function createNumberSet(numberPoolMax: number, playCount: number) {
  const safeNumberPoolMax = Math.max(Math.floor(numberPoolMax), 1)
  const safePlayCount = Math.min(
    Math.max(Math.floor(playCount), 1),
    safeNumberPoolMax,
  )

  const buckets = createNumberBuckets(safeNumberPoolMax, safePlayCount)

  const selectedNumbers = buckets.map((bucket) => {
    const randomIndex = Math.floor(Math.random() * bucket.length)

    return bucket[randomIndex]
  })

  return selectedNumbers.sort((a, b) => a - b)
}

// แบ่งช่วงตัวเลขออกเป็น bucket เพื่อสุ่มเลขที่กระจายตัว
function createNumberBuckets(numberPoolMax: number, bucketCount: number) {
  const buckets: number[][] = []

  for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
    const start =
      Math.floor((bucketIndex * numberPoolMax) / bucketCount) + 1

    const end = Math.floor(
      ((bucketIndex + 1) * numberPoolMax) / bucketCount,
    )

    const bucket: number[] = []

    for (let value = start; value <= end; value += 1) {
      bucket.push(value)
    }

    if (bucket.length > 0) {
      buckets.push(bucket)
    }
  }

  return buckets
}