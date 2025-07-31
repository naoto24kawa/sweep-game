export class DOMHandler {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  setupCanvas(canvas: HTMLCanvasElement): void {
    console.log('Setting up canvas')
    
    canvas.style.display = 'block'
    canvas.style.margin = 'auto'
    
    canvas.addEventListener('contextmenu', (e) => {
      console.log('Context menu prevented')
      e.preventDefault()
    })
    
    // キャンバスにクリックイベントリスナーを追加してデバッグ
    canvas.addEventListener('click', (e) => {
      console.log('Canvas click event:', e)
    })
    
    canvas.addEventListener('mousedown', (e) => {
      console.log('Canvas mousedown event:', e)
    })
    
    this.container.appendChild(canvas)
    console.log('Canvas appended to container:', this.container)
  }

  clearContainer(): void {
    this.container.innerHTML = ''
  }
}