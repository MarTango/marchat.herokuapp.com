function main() {
  var canvas = document.querySelector("canvas");
  const world = new World(
    canvas.getContext("2d"),
    []
  );
  window.world = world;

  const me = new Player(
    world,
    canvas.width * Math.random(),
    canvas.height * Math.random()
  );

  me.fillStyle = "red";
  world.entities.push(me);

  function tick() {
    world.render();
    world.tick();
    world.registerCollisions();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

class World {
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

class Entity {
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

class Bullet extends Entity {
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
    this.world.entities = this.world.entities.filter(x => x !== this);
  }

  /**
   * Continue moving in same direction; if at wall, bounce.
   */
  tick(dt) {
    const h = this.world.ctx.canvas.height;
    const w = this.world.ctx.canvas.width;

    [['x', 'vx', w], ['y', 'vy', h]].forEach(a => {
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

class Player extends Entity {
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
