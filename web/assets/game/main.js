import World from "./world.js";
import Player from "./player.js";

function main() {
  const canvas = document.querySelector("canvas");
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

document.querySelector("button").addEventListener("click", main);
