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

  function tick() {
    world.entities.push(
      new Bullet(
        world,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.PI * Math.random()
      )
    );

    world.draw();
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
        const threshold = e.constructor.RADIUS + f.constructor.RADIUS;

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

  draw() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.entities.forEach(e => e.draw());
  }
}

/**
 * @interface
 */
class Entity {
  draw() {}
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
    this.dx = vel * Math.sin(angle);
    this.dy = vel * Math.cos(angle);
  }

  draw() {
    const ctx = this.world.ctx;

    ctx.beginPath();
    ctx.arc(this.x, this.y, Bullet.RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  }

  collide() {
    this.world.entities = this.world.entities.filter(x => x !== this);
  }

  tick(dt) {
    const h = this.world.ctx.canvas.height;
    const w = this.world.ctx.canvas.width;

    if (this.x < 0 || this.x > w) {
      this.dx = -this.dx;
    }

    if (this.y < 0 || this.y > h) {
      this.dy = -this.dy;
    }

    this.x += this.dx * dt;
    this.y += this.dy * dt;
  }
}

Bullet.RADIUS = 1;
Bullet.DEFAULT_VEL = 0.2;


/**
 * @implements {Entity}
 */
class Player {
  /**
   * @param {number} angle Angle to the positive y-axis.
   */
  shoot(angle) {
    const bullet = new Bullet(
      this.x,
      this.y,
      angle
    );
    this.world.entities.push(bullet);
  }

  collide(entity) {
    if (entity instanceof Bullet) {
      this.world.entities = this.world.entities.filter(x => x !== this);
    }
  }
}

class PrimaryPlayer extends Player {
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
