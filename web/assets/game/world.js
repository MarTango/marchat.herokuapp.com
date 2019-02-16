/**
 * @prop {CanvasRenderingContext2D} ctx
 * @prop {Entity[]} entities
 */
export default class World {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Entity[]} entities
   */
  constructor(ctx, entities) {
    this.ctx = ctx;
    this.entities = entities;
  }

  registerCollisions() {
    this.entities.forEach(e => {
      this.entities.filter(f => {
        const threshold = e.radius + f.radius;
        return f !== e && Math.abs(e.x - f.x) < threshold && Math.abs(e.y - f.y) < threshold;
      }).forEach(f => {
          e.collide(f);
          f.collide(e);
      });
    });
  }

  tick() {
    const newTime = new Date();
    const oldTime = this.time || newTime;
    this.time = newTime;

    const dt = newTime - oldTime;
    this.entities.forEach(e => e.tick(dt));
  }

  render() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.entities.forEach(e => e.render());
  }
}
