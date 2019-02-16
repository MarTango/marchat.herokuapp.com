import Entity from "./entity.js";
import Bullet from "./bullet.js";

export default class Player extends Entity {
  /**
   * @param {World} world
   */
  constructor(world, x, y) {
    super(world, x, y);
    this.x = x;
    this.y = y;

    this.dir = [0, 0];
    this.speed = 0.1;
    this.radius = 7;

    this._keyDownHandler = e => {
      var k = e.key.toLowerCase();
      var keys = {
        w: [1, -1],
        a: [0, -1],
        s: [1, 1],
        d: [0, 1]
      };
      var j = keys[k];
      if (j) {
        this.dir[j[0]] = j[1];
      }
    };

    this._keyUpHandler = e => {
      var k = e.key.toLowerCase();
      if ("ws".indexOf(k) > -1) {
        this.dir[1] = 0;
      } else if ("ad".indexOf(k) > -1) {
        this.dir[0] = 0;
      }
    };

    this._mousedownHandler = e => {
      const mx = e.offsetX;
      const my = e.offsetY;

      var vx = mx - this.x;
      var vy = my - this.y;

      const magnitude = Math.sqrt(vx * vx + vy * vy);
      vx /= magnitude;
      vy /= magnitude;
      this.shoot(vx, vy);
    };

    window.addEventListener("keydown", this._keyDownHandler);
    window.addEventListener("keyup", this._keyUpHandler);
    window.addEventListener("mousedown", this._mousedownHandler);
  }

  collide(entity) {
    if (entity instanceof Bullet) {
      this.world.entities = this.world.entities.filter(x => x !== this);
      window.removeEventListener("keydown", this._keyDownHandler);
      window.removeEventListener("keyup", this._keyUpHandler);
      window.removeEventListener("mousedown", this._mousedownHandler);
    }
  }

  tick(dt) {
    const boundaries = [
      this.world.ctx.canvas.width, this.world.ctx.canvas.height
    ];

    [this.x, this.y] = [this.x, this.y].map((x, i) => {
      const m = x + this.dir[i] * this.speed * dt;
      const out =  Math.max(
        this.radius,
        Math.min(
          m,
          boundaries[i] - this.radius
        )
      );

      return out;
    });
  }

  shoot(vx, vy) {
    const r = this.radius + Bullet.RADIUS + 3;

    const bullet = new Bullet(
      this.world,
      this.x + vx * r,
      this.y + vy * r,
      vx * Bullet.DEFAULT_VEL,
      vy * Bullet.DEFAULT_VEL
    );
    bullet.fillStyle = this.fillStyle;

    this.world.entities.push(bullet);
    return bullet;
  }

}
