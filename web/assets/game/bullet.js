import Entity from "./entity.js";

export default class Bullet extends Entity {
  /**
   * @param {World} world
   */
  constructor(world, x, y, vx, vy) {
    super(world, x, y);
    this.world = world;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = Bullet.RADIUS;
  }

  /**
   * Remove self from world's entities
   */
  collide() {
    this.world.entities = this.world.entities.filter((x) => x !== this);
  }

  /**
   * Continue moving in same direction; if at wall, bounce.
   */
  tick(dt) {
    const h = this.world.ctx.canvas.height;
    const w = this.world.ctx.canvas.width;

    [
      ["x", "vx", w],
      ["y", "vy", h],
    ].forEach((a) => {
      const x = a[0];
      const v = a[1];

      var pos = this[x];
      var vel = this[v];

      if (pos - this.radius < 0) {
        this[v] = Math.abs(vel);
      } else if (pos + this.radius > a[2]) {
        this[v] = -Math.abs(vel);
      }

      this[x] += this[v] * dt;
    });
  }
}

Bullet.RADIUS = 1;
Bullet.DEFAULT_VEL = 0.2;
