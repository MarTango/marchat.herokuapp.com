/**
 * @prop {World} world
 */
export default class Entity {
  /**
   * @param {World} world
   */
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
  }

  /**
   * Draw a circle at the position (this.x, this.y) with radius
   * `this.radius`
   */
  render() {
    const ctx = this.world.ctx;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
    ctx.closePath();
  }
}
