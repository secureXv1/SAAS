export function toMinute(hhmm) {
  const [h,m] = String(hhmm).split(':').map(Number)
  return h*60 + (m||0)
}
export function fromMinute(min) {
  const h = Math.floor((min||0)/60)
  const m = (min||0) % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}
export function buildTimeOptions(step=15) {
  const out=[]
  for (let m=0; m<24*60; m+=step) out.push(fromMinute(m))
  return out
}
