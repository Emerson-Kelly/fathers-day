import Two from "https://esm.sh/two.js@0.8.12";
import Matter from "https://esm.sh/matter-js@0.19.0";

const { Engine, Render, World, Bodies, Events, Mouse, Body, Vector } = Matter;

// Physics engine
const engine = Engine.create();
engine.world.gravity.y = 0;

// Graphics engine
const two = new Two({
  fullscreen: true,
  imageSmoothingEnabled: true,
  type: Two.Types.canvas // type can be [svg, canvas, webgl]
}).appendTo(document.getElementById("main"));

// Data
let playerMesh, arrowMesh, ballMesh, holeMesh, flagMesh;
let ballBody;
let text = [];
let smallText = [];

const word = [
  { char: "H", margin: 36 },
  { char: "a", margin: 36 },
  { char: "p", margin: 36 },
  { char: "p", margin: 36 },
  { char: "y", margin: 36 },
  { char: " ", margin: 20 },
  { char: "F", margin: 36 },
  { char: "a", margin: 36 },
  { char: "t", margin: 36 },
  { char: "h", margin: 36 },
  { char: "e", margin: 36 },
  { char: "r", margin: 36 },
  { char: "'", margin: 20 },
  { char: "s", margin: 36 },
  { char: " ", margin: 20 },
  { char: "D", margin: 36 },
  { char: "a", margin: 36 },
  { char: "y", margin: 36 },
  { char: "!", margin: 20 }
];

const smallWord = [
  { char: "E", margin: 20 },
  { char: "n", margin: 20 },
  { char: "j", margin: 20 },
  { char: "o", margin: 20 },
  { char: "y", margin: 20 },
  { char: " ", margin: 10 },
  { char: "y", margin: 20 },
  { char: "o", margin: 20 },
  { char: "u", margin: 20 },
  { char: "r", margin: 20 },
  { char: " ", margin: 10 },
  { char: "d", margin: 20 },
  { char: "a", margin: 20 },
  { char: "y", margin: 20 },
  { char: "!", margin: 10 }
];

let wordWidth = 0;
word.forEach(e => {
  if (e.margin) wordWidth += e.margin;
});

let smallWordWidth = 0;
smallWord.forEach(e => {
  if (e.margin) smallWordWidth += e.margin;
});

init();
initPhysics();

let arrowSize = 0;

function init() {
  // Hole
  holeMesh = two.makeCircle(
    two.width - (two.width * 0.15) / 1,
    two.height / 2,
    20
  );
  holeMesh.fill = "#424242";
  holeMesh.noStroke();
  
  // Text
  let offset = 0;
  word.forEach((c, index) => {
    const characterMesh = two.makeText(c.char, 0, 0, {
      size: 60,
      weight: 700,
      leading: 18
    });
    characterMesh.fill = "#fff";
    characterMesh.position.set(
      two.width / 2 + offset - wordWidth / 2,
      two.height / 2
    );
    offset += c.margin;
    text.push({
      mesh: characterMesh,
      body: null
    });
  });
  
  // Smaller Text
  offset = 0;
  smallWord.forEach((c, index) => {
    const characterMesh = two.makeText(c.char, 0, 0, {
      size: 30,
      weight: 700,
      leading: 18
    });
    characterMesh.fill = "#fff";
    characterMesh.position.set(
      two.width / 2 + offset - smallWordWidth / 2,
      two.height / 2 + 50
    );
    offset += c.margin;
    smallText.push({
      mesh: characterMesh,
      body: null
    });
  });
  
  // Player
  ballMesh = two.makeCircle(0, 0, 10);
  ballMesh.stroke = "#f3f3f3";
  arrowMesh = new Two.Path(
    [
      new Two.Anchor(10, 0, 0, 0, 0, 0, Two.Commands.move),
      new Two.Anchor(0, 0, 0, 0, 0, 0, Two.Commands.line),
      new Two.Anchor(-10, 0, 0, 0, 0, 0, Two.Commands.line)
    ],
    true
  );
  arrowMesh.fill = "#F04D4D";
  arrowMesh.noStroke();
  playerMesh = two.makeGroup(arrowMesh, ballMesh);
  playerMesh.position.set((two.width * 0.15) / 1, two.height / 2);
  
  // Flag pole
  const flag = new Two.Path(
    [
      new Two.Anchor(-5, -75, 0, 0, 0, 0, Two.Commands.move),
      new Two.Anchor(-50, -50, 0, 0, 0, 0, Two.Commands.line),
      new Two.Anchor(-5, -30, 0, 0, 0, 0, Two.Commands.line)
    ],
    true
  );
  flag.fill = "#F04D4D";
  flag.noStroke();
  two.add(flag);
  const pole = two.makeRectangle(0, -29, 10, 95);
  pole.noStroke();
  flagMesh = two.makeGroup(flag, pole);
  flagMesh.position.set(holeMesh.position.x, holeMesh.position.y);
}

function initPhysics() {
  // Walls
  const options = { isStatic: true };
  const w1 = Bodies.rectangle(two.width / 2, -25, two.width, 60, options);
  const w2 = Bodies.rectangle(-25, two.height / 2, 60, two.height, options);
  const w3 = Bodies.rectangle(two.width + 25, two.height / 2, 60, two.height, options);
  const w4 = Bodies.rectangle(two.width / 2, two.height + 25, two.width, 60, options);
  World.add(engine.world, [w1, w2, w3, w4]);
  
  // Player
  ballBody = Bodies.circle(playerMesh.position.x, playerMesh.position.y, 20, {
    restitution: 1,
    friction: 0.3,
    frictionAir: 0.05,
    label: "ball"
  });
  World.add(engine.world, [ballBody]);
  
  // Hole
  const holeBody = Bodies.circle(holeMesh.position.x, holeMesh.position.y, 10, {
    isSensor: true,
    label: "hole"
  });
  World.add(engine.world, [holeBody]);
  
  // Text
  text.forEach(character => {
    const rect = character.mesh.getBoundingClientRect();
    const characterBody = Bodies.rectangle(
      character.mesh.position.x,
      character.mesh.position.y,
      rect.width - 10,
      rect.height * 2,
      {
        restitution: 1,
        friction: 0.3
      }
    );
    World.add(engine.world, [characterBody]);
    character.body = characterBody;
  });
  
  // Smaller Text
  smallText.forEach(character => {
    const rect = character.mesh.getBoundingClientRect();
    const characterBody = Bodies.rectangle(
      character.mesh.position.x,
      character.mesh.position.y,
      rect.width - 10,
      rect.height * 2,
      {
        restitution: 1,
        friction: 0.3
      }
    );
    World.add(engine.world, [characterBody]);
    character.body = characterBody;
  });
}

function handleCollision(event) {
  const { pairs } = event;
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    if (bodyA.label === "ball" && bodyB.label === "hole") {
      Body.setVelocity(bodyA, { x: 0, y: 0 });
      Body.setPosition(bodyA, { x: 100, y: two.height / 2 });
      console.log("Hole!");
    }
  });
}
Events.on(engine, "collisionStart", handleCollision);

const mouse = Mouse.create(document.querySelector("body"));
let mousedown = false;

function angle(x, y) {
  return Math.atan2(y, x) + Math.PI / 2;
}

function updateAngle() {
  if (!mousedown) {
    arrowMesh.vertices[0].set(10, 0);
    arrowMesh.vertices[1].set(0, 10);
    arrowMesh.vertices[2].set(-10, 0);
    return;
  }
  const deltaVector = Vector.sub(mouse.position, ballBody.position);
  arrowMesh.rotation = angle(deltaVector.x, deltaVector.y);
  arrowMesh.vertices[0].set(10, arrowSize);
  arrowMesh.vertices[1].set(0, arrowSize + 10);
  arrowMesh.vertices[2].set(-10, arrowSize);
}

function applyVelocity() {
  if (!mousedown || ballBody.velocity.x > 1 || ballBody.velocity.y > 1) return;
  const force = 0.2;
  const deltaVector = Vector.sub(mouse.position, ballBody.position);
  const normalizedDelta = Vector.normalise(deltaVector);
  const forceVector = Vector.mult(normalizedDelta, force);
  const op = Vector.neg(forceVector);
  arrowSize = 0;
  mousedown = false;
  Body.applyForce(ballBody, ballBody.position, op);
}

const app = document.getElementById("app");
app.addEventListener("pointerup", applyVelocity);
app.addEventListener("pointerdown", () => {
  if (ballBody.velocity.x > 1 || ballBody.velocity.y > 1) return;
  mousedown = true;
  arrowSize = 50;
});

Matter.Runner.run(engine);

// Runtime
two.bind("update", function() {
  playerMesh.translation.set(ballBody.position.x, ballBody.position.y);
  text.forEach(character => {
    if (character.body) {
      character.mesh.translation.set(character.body.position.x, character.body.position.y);
    }
  });
  smallText.forEach(character => {
    if (character.body) {
      character.mesh.translation.set(character.body.position.x, character.body.position.y);
    }
  });
  updateAngle();
});

two.play();
