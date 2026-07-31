export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
    'worklet'
    const rr = Math.max(0, Math.min(r, w / 2, h / 2))
    return (
        `M${x + rr},${y}` +
        `h${w - 2 * rr}` +
        `a${rr},${rr} 0 0 1 ${rr},${rr}` +
        `v${h - 2 * rr}` +
        `a${rr},${rr} 0 0 1 ${-rr},${rr}` +
        `h${-(w - 2 * rr)}` +
        `a${rr},${rr} 0 0 1 ${-rr},${-rr}` +
        `v${-(h - 2 * rr)}` +
        `a${rr},${rr} 0 0 1 ${rr},${-rr}` +
        `z`
    )
}
