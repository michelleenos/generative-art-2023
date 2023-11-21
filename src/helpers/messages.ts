let colors = {
    yellow: '#f6b02c',
    blue: '#5bc0eb',
    orange: '#f96900',
    green: '#9bc53d',
}

export const showMessage = (message: string, color: keyof typeof colors = 'yellow') => {
    let el = document.createElement('div')
    el.innerHTML = message
    el.style.position = 'fixed'
    el.style.top = '0'
    el.style.left = '50%'
    el.style.padding = '10px'
    el.style.backgroundColor = colors[color]
    el.style.fontFamily = 'monospace'
    el.style.fontSize = '14px'
    el.style.fontWeight = 'bold'
    el.style.pointerEvents = 'none'
    el.style.transition = 'all 0.3s ease-out'
    el.style.opacity = '0'
    el.style.transform = 'translate(-50%, 100%)'
    document.body.appendChild(el)

    setTimeout(() => {
        el.style.opacity = '1'
        el.style.transform = 'translate(-50%, 0)'
    }, 10)

    setTimeout(() => {
        document.body.removeChild(el)
    }, 10000)
}
