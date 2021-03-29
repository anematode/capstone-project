export class Keyboard {
  constructor () {
    this.keyStates = {}

    window.addEventListener("keydown", (e) => {
      this.keyStates[e.key] = true
    })

    window.addEventListener("keyup", (e) => {
      this.keyStates[e.key] = false
    })
  }

  isKeyPressed (key) {
    return !!this.keyStates[key]
  }
}
