var canvas = document.querySelector("canvas");

function main() {
  const world = new World(
    canvas.getContext("2d"),
    []
  );
  window.world = world;

  const me = new PrimaryPlayer(
    world,
    canvas.width * Math.random(),
    canvas.height * Math.random()
  );

  me.fillStyle = "red";
  world.entities.push(me);

  for (let i = 0; i < 5; i++) {
    const bullet = new Bullet(
      world,
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.PI * Math.random()
    );
    // bullet.fillStyle = "#" + Math.floor(Math.random() * 16777215).toString(16);
    bullet.fillStyle = "black";
    // world.entities.push(bullet);
  }

  // world.entities.push(me);

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
      this.entities.forEach(f => {
        const threshold = e.radius + f.radius;

        if (e !== f
            && Math.abs(e.x - f.x) < threshold
            && Math.abs(e.y - f.y) < threshold
           ) {
          console.log("Collision!");
          e.collide(f);
          f.collide(e);
        }
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

/**
 * @interface
 */
class Entity {
  render() {}
  tick(dt) {}
  collide(entity) {}
}

/**
 * @implements {Entity}
 */
class Bullet {
  constructor(world, x, y, angle, vel) {
    vel = vel || Bullet.DEFAULT_VEL;

    this.world = world;
    this.x = x;
    this.y = y;
    this.vx = vel * Math.cos(angle);
    this.vy = vel * Math.sin(angle);
    this.radius = Bullet.RADIUS;
  }

  render() {
    const ctx = this.world.ctx;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillStyle || "red";
    ctx.fill();
    ctx.closePath();
  }

  collide() {
    this.world.entities = this.world.entities.filter(x => x !== this);
  }

  tick(dt) {
    const h = this.world.ctx.canvas.height;
    const w = this.world.ctx.canvas.width;

    if (this.x < this.radius || this.x + this.radius > w) {
      this.vx = -this.vx;
    }

    if (this.y < this.radius || this.y + this.radius > h) {
      this.vy = -this.vy;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

Bullet.RADIUS = 1;
Bullet.DEFAULT_VEL = 0.2;


/**
 * @implements {Entity}
 */
class Player {

  constructor(world, x, y) {
    this.world = world;
    this.pos = [x, y];
  }
  /**
   * @param {number} angle Angle to the positive y-axis.
   */
  shoot(angle) {
    const r = this.radius + Bullet.RADIUS + 1;

    const bullet = new Bullet(
      this.world,
      this.x + Math.cos(angle) * r,
      this.y - Math.sin(angle) * r,
      angle
    );
    this.world.entities.push(bullet);
  }

  collide(entity) {
    if (entity instanceof Bullet) {
      this.world.entities = this.world.entities.filter(x => x !== this);
    }
  }

  render() {
    const ctx = this.world.ctx;

    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillStyle || "black";
    ctx.fill();
    ctx.closePath();
  }

  tick(dt) {
    this.pos = this.pos.map((x, i) => {
      return x + this.dir[i] * this.speed * dt;
    });
    [this.x, this.y] = this.pos;
  }
}

class PrimaryPlayer extends Player {
  constructor(world, x, y) {
    super(world, x, y);
    this.dir = [0, 0];
    this.speed = 0.1;
    this.radius = 7;

    window.addEventListener("keydown", e => this._keyDownHandler(this, e));
    window.addEventListener("keyup", e => this._keyUpHandler(this, e));
  }

  _keyDownHandler(self, e) {
    var k = e.key.toLowerCase();
    var keys = {
      w: [1, -1],
      a: [0, -1],
      s: [1, 1],
      d: [0, 1]
    };
    var j = keys[k];
    if (j) {
      self.dir[j[0]] = j[1];
    }
  }

  _keyUpHandler(self, e) {
    var k = e.key.toLowerCase();
    if ("ws".indexOf(k) > -1) {
      self.dir[1] = 0;
    } else if ("ad".indexOf(k) > -1) {
      self.dir[0] = 0;
    }
  }
}

class EnemyPlayer extends Player {
  /**
   * @param {RTCPeerConnection} connection
   */
  constructor(connection) {
    this.conn = connection;
    const chan = connection.createDataChannel("game");
    this.chan = chan;
    chan.onmessage = (e) => {
      console.log(e);
    };
  }
}
