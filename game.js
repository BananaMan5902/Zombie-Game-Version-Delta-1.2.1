```javascript
// ============================================================
// ZOMBIE SURVIVAL
// COMPLETE PLAYABLE VERSION
// ============================================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// -----------------------------
// HUD ELEMENTS
// -----------------------------

const waveText = document.getElementById("wave");
const killsText = document.getElementById("kills");
const healthText = document.getElementById("health");
const bonusText = document.getElementById("bonus");
const weaponNameText = document.getElementById("weaponName");
const ammoText = document.getElementById("ammo");
const waveMessage = document.getElementById("waveMessage");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");
const gameOverTitle = document.getElementById("gameOverTitle");
const gameOverText = document.getElementById("gameOverText");

const marketMenu = document.getElementById("marketMenu");
const marketKills = document.getElementById("marketKills");
const marketText = document.getElementById("marketText");
const upgradeButton = document.getElementById("upgradeButton");
const closeMarket = document.getElementById("closeMarket");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");


// ============================================================
// CANVAS
// ============================================================

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;


// ============================================================
// WORLD
// ============================================================

const WORLD_WIDTH = 7000;
const WORLD_HEIGHT = 7000;

const ROAD_WIDTH = 150;

const MARKET = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    width: 420,
    height: 300
};


// ============================================================
// GAME VARIABLES
// ============================================================

let running = false;
let gameLoopRunning = false;

let lastTime = 0;

let wave = 1;
let kills = 0;
let damageBonus = 0;

let zombies = [];
let bullets = [];
let flames = [];
let particles = [];
let trees = [];
let houses = [];
let roads = [];

let remainingToSpawn = 0;
let spawnTimer = 0;
let nextWaveTimer = 2;

let messageTimer = 0;

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

const keys = {};

const camera = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2
};


// ============================================================
// PLAYER
// ============================================================

const player = {

    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2 + 700,

    radius: 17,

    speed: 245,
    sprint: 350,

    health: 100,
    maxHealth: 100,

    weapon: 1,

    pistolCooldown: 0,
    shotgunCooldown: 0,
    flameCooldown: 0,
    machineCooldown: 0,
    rifleCooldown: 0,

    invulnerable: 0

};


// ============================================================
// WEAPONS
// ============================================================

const weapons = {

    pistol: {
        name: "PISTOL",
        damage: 28,
        fireRate: 0.24,
        range: 900
    },

    shotgun: {
        name: "SHOTGUN",
        damage: 18,
        fireRate: 0.85,
        range: 520
    },

    flamethrower: {
        name: "FLAMETHROWER",
        damage: 6,
        fireRate: 0.09,
        range: 370
    },

    machinegun: {
        name: "MACHINE GUN",
        damage: 11,
        fireRate: 0.075,
        range: 1050
    },

    rifle: {
        name: "RIFLE",
        damage: 90,
        fireRate: 0.9,
        range: 1500
    }

};


// ============================================================
// ZOMBIE TYPES
// ============================================================

const zombieTypes = {

    weakSlow: {
        name: "Walker",
        health: 45,
        speed: 50,
        damage: 7,
        radius: 15
    },

    tankSlow: {
        name: "Tank",
        health: 180,
        speed: 30,
        damage: 15,
        radius: 22
    },

    fastWeak: {
        name: "Runner",
        health: 35,
        speed: 105,
        damage: 8,
        radius: 13
    },

    tankFast: {
        name: "Brute",
        health: 280,
        speed: 62,
        damage: 20,
        radius: 25
    }

};


// ============================================================
// INPUT
// ============================================================

window.addEventListener("keydown", function(e) {

    keys[e.key.toLowerCase()] = true;

    if (e.key === "1") {
        player.weapon = 1;
        updateHUD();
    }

    if (e.key === "2") {
        player.weapon = 2;
        updateHUD();
    }

    if (e.key === "3") {
        player.weapon = 3;
        updateHUD();
    }

    if (e.key === "4") {
        player.weapon = 4;
        updateHUD();
    }

    if (e.key === "5") {
        player.weapon = 5;
        updateHUD();
    }

    if (e.key.toLowerCase() === "e") {

        if (running && isNearMarket()) {
            toggleMarket();
        }

    }

});


window.addEventListener("keyup", function(e) {

    keys[e.key.toLowerCase()] = false;

});


canvas.addEventListener("mousemove", function(e) {

    mouse.x = e.clientX;
    mouse.y = e.clientY;

});


canvas.addEventListener("mousedown", function() {

    mouse.down = true;

});


window.addEventListener("mouseup", function() {

    mouse.down = false;

});


window.addEventListener("blur", function() {

    mouse.down = false;

    for (const key in keys) {
        keys[key] = false;
    }

});


window.addEventListener("resize", function() {

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

});


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function rand(min, max) {
    return Math.random() * (max - min) + min;
}


function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


function damageMultiplier() {
    return 1 + damageBonus / 100;
}


function worldToScreen(x, y) {

    return {
        x: x - camera.x + W / 2,
        y: y - camera.y + H / 2
    };

}


function screenToWorld(x, y) {

    return {
        x: x + camera.x - W / 2,
        y: y + camera.y - H / 2
    };

}


// ============================================================
// MAP GENERATION
// ============================================================

function generateMap() {

    trees = [];
    houses = [];
    roads = [];


    // Main vertical road

    roads.push({
        x: WORLD_WIDTH / 2 - ROAD_WIDTH / 2,
        y: 0,
        width: ROAD_WIDTH,
        height: WORLD_HEIGHT
    });


    // Main horizontal road

    roads.push({
        x: 0,
        y: WORLD_HEIGHT / 2 - ROAD_WIDTH / 2,
        width: WORLD_WIDTH,
        height: ROAD_WIDTH
    });


    // Secondary roads

    roads.push({
        x: 1300,
        y: 0,
        width: 95,
        height: WORLD_HEIGHT
    });

    roads.push({
        x: 5600,
        y: 0,
        width: 95,
        height: WORLD_HEIGHT
    });

    roads.push({
        x: 0,
        y: 1300,
        width: WORLD_WIDTH,
        height: 95
    });

    roads.push({
        x: 0,
        y: 5600,
        width: WORLD_WIDTH,
        height: 95
    });


    // Houses

    for (let i = 0; i < 85; i++) {

        let x;
        let y;

        let valid = false;

        for (let attempt = 0; attempt < 100; attempt++) {

            x = rand(250, WORLD_WIDTH - 250);
            y = rand(250, WORLD_HEIGHT - 250);

            if (
                !isOnRoad(x, y) &&
                !isInsideMarket(x, y)
            ) {
                valid = true;
                break;
            }

        }

        if (!valid) continue;

        houses.push({

            x: x,
            y: y,

            width: rand(80, 150),
            height: rand(65, 120)

        });

    }


    // Sparse trees

    for (let i = 0; i < 260; i++) {

        let x;
        let y;
        let valid = false;

        for (let attempt = 0; attempt < 100; attempt++) {

            x = rand(100, WORLD_WIDTH - 100);
            y = rand(100, WORLD_HEIGHT - 100);

            if (
                !isOnRoad(x, y) &&
                !isInsideMarket(x, y)
            ) {
                valid = true;
                break;
            }

        }

        if (!valid) continue;

        trees.push({

            x: x,
            y: y,

            radius: rand(14, 25)

        });

    }

}


function isOnRoad(x, y) {

    for (const road of roads) {

        if (
            x > road.x &&
            x < road.x + road.width &&
            y > road.y &&
            y < road.y + road.height
        ) {
            return true;
        }

    }

    return false;

}


function isInsideMarket(x, y) {

    return (

        x > MARKET.x - MARKET.width / 2 &&
        x < MARKET.x + MARKET.width / 2 &&
        y > MARKET.y - MARKET.height / 2 &&
        y < MARKET.y + MARKET.height / 2

    );

}


// ============================================================
// ZOMBIE
// ============================================================

class Zombie {

    constructor(type, x, y) {

        const data = zombieTypes[type];

        this.type = type;

        this.x = x;
        this.y = y;

        this.health =
            data.health *
            (1 + wave * 0.018);

        this.maxHealth = this.health;

        this.speed =
            data.speed *
            (1 + wave * 0.004);

        this.damage = data.damage;

        this.radius = data.radius;

        this.dead = false;

        this.burning = false;

        this.burnTimer = 0;

        this.burnDamage = 0;

        this.attackCooldown = 0;

    }


    update(dt) {

        if (this.dead) return;


        // -------------------------
        // FIRE DAMAGE
        // -------------------------

        if (this.burning) {

            this.burnTimer -= dt;

            this.health -=
                this.burnDamage * dt;

            if (this.burnTimer <= 0) {
                this.burning = false;
            }


            // Fire spreads

            for (const other of zombies) {

                if (
                    other !== this &&
                    !other.dead &&
                    !other.burning &&
                    distance(this, other) < 75
                ) {

                    if (Math.random() < dt * 1.5) {
                        igniteZombie(other);
                    }

                }

            }


            if (this.health <= 0) {
                killZombie(this);
                return;
            }

        }


        // -------------------------
        // MOVE
        // -------------------------

        const dx = player.x - this.x;
        const dy = player.y - this.y;

        const d = Math.hypot(dx, dy);

        if (d > 1) {

            this.x +=
                (dx / d) *
                this.speed *
                dt;

            this.y +=
                (dy / d) *
                this.speed *
                dt;

        }


        // -------------------------
        // ATTACK
        // -------------------------

        this.attackCooldown -= dt;

        if (
            d <
            this.radius +
            player.radius +
            8
        ) {

            if (this.attackCooldown <= 0) {

                hurtPlayer(this.damage);

                this.attackCooldown = 0.8;

            }

        }


        // Stay inside map

        this.x =
            clamp(
                this.x,
                20,
                WORLD_WIDTH - 20
            );

        this.y =
            clamp(
                this.y,
                20,
                WORLD_HEIGHT - 20
            );

    }

}


// ============================================================
// SPAWN
// ============================================================

function chooseZombieType() {

    const roll = Math.random();

    if (wave >= 50 && roll < 0.08) {
        return "tankFast";
    }

    if (roll < 0.23) {
        return "tankSlow";
    }

    if (roll < 0.48) {
        return "fastWeak";
    }

    return "weakSlow";

}


function spawnZombie() {

    const angle =
        rand(0, Math.PI * 2);

    const spawnDistance =
        rand(800, 1200);

    let x =
        player.x +
        Math.cos(angle) *
        spawnDistance;

    let y =
        player.y +
        Math.sin(angle) *
        spawnDistance;

    x = clamp(
        x,
        100,
        WORLD_WIDTH - 100
    );

    y = clamp(
        y,
        100,
        WORLD_HEIGHT - 100
    );


    let type;

    if (
        wave === 100 &&
        remainingToSpawn === 1
    ) {

        type = "tankFast";

    } else {

        type = chooseZombieType();

    }


    const zombie =
        new Zombie(
            type,
            x,
            y
        );


    // Wave 100 boss

    if (
        wave === 100 &&
        remainingToSpawn === 1
    ) {

        zombie.health *= 3;

        zombie.maxHealth =
            zombie.health;

        zombie.radius *= 1.5;

        zombie.speed *= 0.9;

    }


    zombies.push(zombie);

}


// ============================================================
// WAVES
// ============================================================

function startWave() {

    if (wave === 100) {

        remainingToSpawn = 1;

        showMessage(
            "WAVE 100<br>BOSS ZOMBIE",
            4
        );

    } else {

        remainingToSpawn =
            Math.floor(
                8 +
                wave * 3.5
            );

        showMessage(
            "WAVE " + wave,
            2
        );

    }

}


function updateWave(dt) {

    if (remainingToSpawn > 0) {

        spawnTimer -= dt;

        if (spawnTimer <= 0) {

            spawnZombie();

            remainingToSpawn--;

            spawnTimer =
                Math.max(
                    0.08,
                    0.35 -
                    wave * 0.0015
                );

        }

    } else if (zombies.length === 0) {

        nextWaveTimer -= dt;

        if (nextWaveTimer <= 0) {

            if (wave < 100) {

                wave++;

                nextWaveTimer = 2;

                startWave();

            } else {

                winGame();

            }

        }

    }

}


// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;


    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;


        const speed =
            keys["shift"]
                ? player.sprint
                : player.speed;


        player.x +=
            dx *
            speed *
            dt;

        player.y +=
            dy *
            speed *
            dt;

    }


    player.x =
        clamp(
            player.x,
            25,
            WORLD_WIDTH - 25
        );

    player.y =
        clamp(
            player.y,
            25,
            WORLD_HEIGHT - 25
        );


    if (player.invulnerable > 0) {
        player.invulnerable -= dt;
    }


    updateShooting(dt);

}


// ============================================================
// AIM
// ============================================================

function getAimAngle() {

    const target =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    return Math.atan2(
        target.y - player.y,
        target.x - player.x
    );

}


// ============================================================
// SHOOTING
// ============================================================

function updateShooting(dt) {

    player.pistolCooldown -= dt;
    player.shotgunCooldown -= dt;
    player.flameCooldown -= dt;
    player.machineCooldown -= dt;
    player.rifleCooldown -= dt;


    if (!mouse.down) return;


    if (
        player.weapon === 1 &&
        player.pistolCooldown <= 0
    ) {

        shootPistol();

        player.pistolCooldown =
            weapons.pistol.fireRate;

    }


    if (
        player.weapon === 2 &&
        player.shotgunCooldown <= 0
    ) {

        shootShotgun();

        player.shotgunCooldown =
            weapons.shotgun.fireRate;

    }


    if (
        player.weapon === 3 &&
        player.flameCooldown <= 0
    ) {

        shootFlamethrower();

        player.flameCooldown =
            weapons.flamethrower.fireRate;

    }


    if (
        player.weapon === 4 &&
        player.machineCooldown <= 0
    ) {

        shootMachineGun();

        player.machineCooldown =
            weapons.machinegun.fireRate;

    }


    if (
        player.weapon === 5 &&
        player.rifleCooldown <= 0
    ) {

        shootRifle();

        player.rifleCooldown =
            weapons.rifle.fireRate;

    }

}


// ============================================================
// PISTOL
// ============================================================

function shootPistol() {

    const angle =
        getAimAngle() +
        rand(-0.025, 0.025);

    createBullet(
        angle,
        weapons.pistol.damage *
        damageMultiplier(),
        weapons.pistol.range,
        6
    );

}


// ============================================================
// SHOTGUN
// ============================================================

function shootShotgun() {

    const baseAngle =
        getAimAngle();


    for (let i = 0; i < 9; i++) {

        const angle =
            baseAngle +
            rand(-0.24, 0.24);

        createBullet(
            angle,
            weapons.shotgun.damage *
            damageMultiplier(),
            weapons.shotgun.range,
            5
        );

    }


    createMuzzleFlash();

}


// ============================================================
// MACHINE GUN
// ============================================================

function shootMachineGun() {

    const angle =
        getAimAngle() +
        rand(-0.13, 0.13);

    createBullet(
        angle,
        weapons.machinegun.damage *
        damageMultiplier(),
        weapons.machinegun.range,
        4
    );

    createMuzzleFlash();

}


// ============================================================
// RIFLE
// ============================================================

function shootRifle() {

    const angle =
        getAimAngle() +
        rand(-0.008, 0.008);

    createBullet(
        angle,
        weapons.rifle.damage *
        damageMultiplier(),
        weapons.rifle.range,
        8
    );

    createMuzzleFlash();

}


// ============================================================
// BULLETS
// ============================================================

function createBullet(
    angle,
    damage,
    range,
    size
) {

    bullets.push({

        x: player.x,
        y: player.y,

        vx:
            Math.cos(angle) *
            1500,

        vy:
            Math.sin(angle) *
            1500,

        damage: damage,

        distance: 0,

        maxDistance: range,

        size: size

    });

}


function updateBullets(dt) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        const speed = 1500;

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.distance +=
            speed * dt;


        let hit = false;


        for (const zombie of zombies) {

            if (zombie.dead) continue;


            const d =
                Math.hypot(
                    bullet.x - zombie.x,
                    bullet.y - zombie.y
                );


            if (
                d <
                zombie.radius +
                bullet.size
            ) {

                zombie.health -=
                    bullet.damage;

                createBloodParticles(
                    zombie.x,
                    zombie.y,
                    5
                );


                if (zombie.health <= 0) {

                    killZombie(zombie);

                }


                hit = true;

                break;

            }

        }


        if (
            hit ||
            bullet.distance >
            bullet.maxDistance ||
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x >
            WORLD_WIDTH ||
            bullet.y >
            WORLD_HEIGHT
        ) {

            bullets.splice(i, 1);

        }

    }

}


// ============================================================
// FLAMETHROWER
// ============================================================

function shootFlamethrower() {

    const angle =
        getAimAngle();


    // Visual flame stream

    for (let i = 0; i < 5; i++) {

        const spread =
            rand(-0.22, 0.22);

        const flameAngle =
            angle + spread;


        flames.push({

            x: player.x,
            y: player.y,

            vx:
                Math.cos(flameAngle) *
                rand(250, 390),

            vy:
                Math.sin(flameAngle) *
                rand(250, 390),

            life:
                rand(0.35, 0.7),

            size:
                rand(8, 16)

        });

    }


    // Damage nearby zombies

    for (const zombie of zombies) {

        if (zombie.dead) continue;


        const dx =
            zombie.x -
            player.x;

        const dy =
            zombie.y -
            player.y;

        const d =
            Math.hypot(dx, dy);


        if (
            d >
            weapons.flamethrower.range
        ) continue;


        const targetAngle =
            Math.atan2(dy, dx);


        const difference =
            Math.atan2(
                Math.sin(
                    targetAngle -
                    angle
                ),
                Math.cos(
                    targetAngle -
                    angle
                )
            );


        if (
            Math.abs(difference) <
            0.34
        ) {

            zombie.health -=
                weapons.flamethrower.damage *
                damageMultiplier();

            igniteZombie(zombie);


            if (zombie.health <= 0) {
                killZombie(zombie);
            }

        }

    }

}


function igniteZombie(zombie) {

    if (zombie.dead) return;

    zombie.burning = true;

    zombie.burnTimer =
        Math.max(
            zombie.burnTimer,
            3.5
        );

    zombie.burnDamage =
        11 *
        damageMultiplier();

}


// ============================================================
// FLAMES
// ============================================================

function updateFlames(dt) {

    for (
        let i = flames.length - 1;
        i >= 0;
        i--
    ) {

        const flame = flames[i];


        flame.x +=
            flame.vx * dt;

        flame.y +=
            flame.vy * dt;

        flame.life -= dt;


        for (const zombie of zombies) {

            if (zombie.dead) continue;


            const d =
                Math.hypot(
                    flame.x - zombie.x,
                    flame.y - zombie.y
                );


            if (
                d <
                zombie.radius +
                flame.size
            ) {

                igniteZombie(zombie);

            }

        }


        if (flame.life <= 0) {

            flames.splice(i, 1);

        }

    }

}


// ============================================================
// KILLS
// ============================================================

function killZombie(zombie) {

    if (zombie.dead) return;

    zombie.dead = true;

    kills++;


    createBloodParticles(
        zombie.x,
        zombie.y,
        15
    );


    updateHUD();

}


// ============================================================
// PLAYER DAMAGE
// ============================================================

function hurtPlayer(amount) {

    if (player.invulnerable > 0)
        return;


    player.health -= amount;

    player.invulnerable = 0.25;


    if (player.health <= 0) {

        player.health = 0;

        endGame();

    }

}


// ============================================================
// PARTICLES
// ============================================================

function createBloodParticles(
    x,
    y,
    count
) {

    for (let i = 0; i < count; i++) {

        particles.push({

            x: x,
            y: y,

            vx: rand(-80, 80),
            vy: rand(-80, 80),

            life: rand(0.2, 0.7),

            size: rand(2, 5),

            type: "dust"

        });

    }

}


function createMuzzleFlash() {

    const angle =
        getAimAngle();


    for (let i = 0; i < 5; i++) {

        particles.push({

            x:
                player.x +
                Math.cos(angle) *
                25,

            y:
                player.y +
                Math.sin(angle) *
                25,

            vx:
                Math.cos(angle) *
                rand(100, 250),

            vy:
                Math.sin(angle) *
                rand(100, 250),

            life: 0.08,

            size: rand(3, 7),

            type: "flash"

        });

    }

}


function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle = particles[i];

        particle.x +=
            particle.vx * dt;

        particle.y +=
            particle.vy * dt;

        particle.life -= dt;


        if (particle.life <= 0) {

            particles.splice(i, 1);

        }

    }

}


// ============================================================
// MARKET
// ============================================================

function isNearMarket() {

    return (

        Math.abs(
            player.x -
            MARKET.x
        ) <
        MARKET.width / 2 +
        100 &&

        Math.abs(
            player.y -
            MARKET.y
        ) <
        MARKET.height / 2 +
        100

    );

}


function toggleMarket() {

    if (!running) return;

    if (!isNearMarket()) return;


    if (
        marketMenu.style.display ===
        "flex"
    ) {

        marketMenu.style.display =
            "none";

    } else {

        marketMenu.style.display =
            "flex";

        marketKills.textContent =
            kills;

    }

}


closeMarket.addEventListener(
    "click",
    function() {

        marketMenu.style.display =
            "none";

    }
);


upgradeButton.addEventListener(
    "click",
    function() {

        if (kills >= 100) {

            kills -= 100;

            damageBonus += 5;

            updateHUD();

            marketKills.textContent =
                kills;

            marketText.textContent =
                "Damage bonus: +" +
                damageBonus +
                "%";

        } else {

            marketText.textContent =
                "You need 100 kills!";

        }

    }
);


// ============================================================
// CAMERA
// ============================================================

function updateCamera(dt) {

    camera.x +=
        (player.x - camera.x) *
        Math.min(
            1,
            dt * 6
        );

    camera.y +=
        (player.y - camera.y) *
        Math.min(
            1,
            dt * 6
        );

}


// ============================================================
// DRAW BACKGROUND
// ============================================================

function drawBackground() {

    ctx.fillStyle = "#4b5149";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const gridSize = 100;


    const startX =
        Math.floor(
            (camera.x - W / 2) /
            gridSize
        ) *
        gridSize;


    const startY =
        Math.floor(
            (camera.y - H / 2) /
            gridSize
        ) *
        gridSize;


    ctx.strokeStyle =
        "rgba(0,0,0,.07)";

    ctx.lineWidth = 1;


    for (
        let x = startX;
        x <
        camera.x +
        W / 2;
        x += gridSize
    ) {

        const screenX =
            x -
            camera.x +
            W / 2;


        ctx.beginPath();

        ctx.moveTo(
            screenX,
            0
        );

        ctx.lineTo(
            screenX,
            H
        );

        ctx.stroke();

    }


    for (
        let y = startY;
        y <
        camera.y +
        H / 2;
        y += gridSize
    ) {

        const screenY =
            y -
            camera.y +
            H / 2;


        ctx.beginPath();

        ctx.moveTo(
            0,
            screenY
        );

        ctx.lineTo(
            W,
            screenY
        );

        ctx.stroke();

    }

}


// ============================================================
// ROADS
// ============================================================

function drawRoads() {

    for (const road of roads) {

        const p =
            worldToScreen(
                road.x,
                road.y
            );


        ctx.fillStyle =
            "#343638";

        ctx.fillRect(
            p.x,
            p.y,
            road.width,
            road.height
        );


        ctx.strokeStyle =
            "#242526";

        ctx.lineWidth = 5;

        ctx.strokeRect(
            p.x,
            p.y,
            road.width,
            road.height
        );


        ctx.strokeStyle =
            "rgba(220,210,150,.65)";

        ctx.lineWidth = 3;

        ctx.setLineDash([
            25,
            25
        ]);


        if (
            road.width >
            road.height
        ) {

            ctx.beginPath();

            ctx.moveTo(
                p.x,
                p.y +
                road.height / 2
            );

            ctx.lineTo(
                p.x +
                road.width,
                p.y +
                road.height / 2
            );

            ctx.stroke();

        } else {

            ctx.beginPath();

            ctx.moveTo(
                p.x +
                road.width / 2,
                p.y
            );

            ctx.lineTo(
                p.x +
                road.width / 2,
                p.y +
                road.height
            );

            ctx.stroke();

        }


        ctx.setLineDash([]);

    }

}


// ============================================================
// HOUSES
// ============================================================

function drawHouses() {

    for (const house of houses) {

        const p =
            worldToScreen(
                house.x,
                house.y
            );


        if (
            p.x < -200 ||
            p.x > W + 200 ||
            p.y < -200 ||
            p.y > H + 200
        ) {
            continue;
        }


        // Shadow

        ctx.fillStyle =
            "rgba(0,0,0,.25)";

        ctx.fillRect(
            p.x -
            house.width / 2 +
            8,

            p.y -
            house.height / 2 +
            9,

            house.width,
            house.height
        );


        // House

        ctx.fillStyle =
            "#80796b";

        ctx.fillRect(
            p.x -
            house.width / 2,

            p.y -
            house.height / 2,

            house.width,
            house.height
        );


        // Roof

        ctx.fillStyle =
            "#49443d";

        ctx.beginPath();

        ctx.moveTo(
            p.x -
            house.width / 2 -
            5,

            p.y -
            house.height / 2
        );

        ctx.lineTo(
            p.x,

            p.y -
            house.height / 2 -
            25
        );

        ctx.lineTo(
            p.x +
            house.width / 2 +
            5,

            p.y -
            house.height / 2
        );

        ctx.closePath();

        ctx.fill();


        // Windows

        ctx.fillStyle =
            "#343b3b";

        ctx.fillRect(
            p.x -
            house.width * 0.25,

            p.y - 10,

            18,
            18
        );

        ctx.fillRect(
            p.x +
            house.width * 0.08,

            p.y - 10,

            18,
            18
        );


        // Door

        ctx.fillStyle =
            "#40372e";

        ctx.fillRect(
            p.x - 10,

            p.y +
            house.height / 2 -
            38,

            20,
            38
        );

    }

}


// ============================================================
// TREES
// ============================================================

function drawTrees() {

    for (const tree of trees) {

        const p =
            worldToScreen(
                tree.x,
                tree.y
            );


        if (
            p.x < -60 ||
            p.x > W + 60 ||
            p.y < -60 ||
            p.y > H + 60
        ) {
            continue;
        }


        // Shadow

        ctx.beginPath();

        ctx.ellipse(
            p.x + 5,
            p.y + 10,
            tree.radius,
            tree.radius * 0.45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,.25)";

        ctx.fill();


        // Trunk

        ctx.fillStyle =
            "#514034";

        ctx.fillRect(
            p.x - 4,
            p.y - 4,
            8,
            tree.radius + 15
        );


        // Leaves

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - 10,
            tree.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#344b35";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            p.x -
            tree.radius * 0.35,

            p.y - 7,

            tree.radius * 0.65,

            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#405b3e";

        ctx.fill();

    }

}


// ============================================================
// MARKET
// ============================================================

function drawMarket() {

    const p =
        worldToScreen(
            MARKET.x,
            MARKET.y
        );


    // Parking lot

    ctx.fillStyle =
        "#373838";

    ctx.fillRect(
        p.x - 300,
        p.y - 240,
        600,
        480
    );


    // Building

    ctx.fillStyle =
        "#756d5c";

    ctx.fillRect(
        p.x -
        MARKET.width / 2,

        p.y -
        MARKET.height / 2,

        MARKET.width,
        MARKET.height
    );


    // Roof

    ctx.fillStyle =
        "#3f403e";

    ctx.fillRect(
        p.x -
        MARKET.width / 2 -
        10,

        p.y -
        MARKET.height / 2 -
        18,

        MARKET.width + 20,
        28
    );


    // Windows

    ctx.fillStyle =
        "#2d4548";

    ctx.fillRect(
        p.x - 150,
        p.y - 55,
        300,
        75
    );


    // Door

    ctx.fillStyle =
        "#222";

    ctx.fillRect(
        p.x - 25,
        p.y + 20,
        50,
        70
    );


    // Sign

    ctx.fillStyle =
        "#d8c45a";

    ctx.fillRect(
        p.x - 105,
        p.y - 115,
        210,
        45
    );


    ctx.fillStyle =
        "#222";

    ctx.font =
        "bold 28px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "MARKET",
        p.x,
        p.y - 84
    );


    // Interaction ring

    if (isNearMarket()) {

        ctx.strokeStyle =
            "rgba(216,196,90,.8)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y + 150,
            90,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        ctx.fillStyle =
            "white";

        ctx.font =
            "bold 14px Arial";

        ctx.fillText(
            "PRESS E TO SHOP",
            p.x,
            p.y + 195
        );

    }

}


// ============================================================
// BULLETS
// ============================================================

function drawBullets() {

    for (const bullet of bullets) {

        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            bullet.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#eee";

        ctx.fill();

    }

}


// ============================================================
// FLAMES
// ============================================================

function drawFlames() {

    for (const flame of flames) {

        const p =
            worldToScreen(
                flame.x,
                flame.y
            );


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            flame.size,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            Math.random() < 0.5
                ? "#ff8a00"
                : "#ffd84d";

        ctx.fill();

    }

}


// ============================================================
// ZOMBIES
// ============================================================

function drawZombies() {

    for (const zombie of zombies) {

        if (zombie.dead) continue;


        const p =
            worldToScreen(
                zombie.x,
                zombie.y
            );


        // Shadow

        ctx.beginPath();

        ctx.ellipse(
            p.x + 3,
            p.y + zombie.radius,
            zombie.radius,
            zombie.radius * 0.4,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,.3)";

        ctx.fill();


        // Body

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            zombie.radius,
            0,
            Math.PI * 2
        );


        let bodyColor =
            "#59604f";


        if (
            zombie.type ===
            "tankSlow"
        ) {
            bodyColor =
                "#4b5247";
        }


        if (
            zombie.type ===
            "fastWeak"
        ) {
            bodyColor =
                "#69705b";
        }


        if (
            zombie.type ===
            "tankFast"
        ) {
            bodyColor =
                "#3f473d";
        }


        ctx.fillStyle =
            bodyColor;

        ctx.fill();


        // Tank helmet

        if (
            zombie.type ===
            "tankSlow" ||
            zombie.type ===
            "tankFast"
        ) {

            ctx.fillStyle =
                "#77715e";

            ctx.fillRect(
                p.x -
                zombie.radius * 0.75,

                p.y -
                zombie.radius -
                7,

                zombie.radius * 1.5,

                9
            );

        }


        // Fire

        if (zombie.burning) {

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y -
                zombie.radius,

                9 +
                Math.random() * 5,

                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                Math.random() < 0.5
                    ? "#ff7a00"
                    : "#ffd43b";

            ctx.fill();

        }


        // Eyes

        ctx.fillStyle =
            "#d5d5b0";

        ctx.beginPath();

        ctx.arc(
            p.x - 5,
            p.y - 3,
            2.5,
            0,
            Math.PI * 2
        );

        ctx.arc(
            p.x + 5,
            p.y - 3,
            2.5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Health bar

        const barWidth =
            zombie.radius * 2.2;

        const healthPercent =
            clamp(
                zombie.health /
                zombie.maxHealth,
                0,
                1
            );


        ctx.fillStyle =
            "#222";

        ctx.fillRect(
            p.x -
            barWidth / 2,

            p.y -
            zombie.radius -
            12,

            barWidth,
            4
        );


        ctx.fillStyle =
            "#b34a42";

        ctx.fillRect(
            p.x -
            barWidth / 2,

            p.y -
            zombie.radius -
            12,

            barWidth *
            healthPercent,

            4
        );

    }

}


// ============================================================
// PLAYER
// ============================================================

function drawPlayer() {

    const p =
        worldToScreen(
            player.x,
            player.y
        );


    // Shadow

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + 15,
        20,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.fill();


    // Body

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#425866";

    ctx.fill();


    // Weapon

    const angle =
        getAimAngle();


    ctx.strokeStyle =
        "#24282a";

    ctx.lineWidth = 8;

    ctx.beginPath();

    ctx.moveTo(
        p.x,
        p.y
    );

    ctx.lineTo(
        p.x +
        Math.cos(angle) * 29,

        p.y +
        Math.sin(angle) * 29
    );

    ctx.stroke();


    // Helmet

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y - 4,
        11,
        Math.PI,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#68756c";

    ctx.fill();

}


// ============================================================
// PARTICLES
// ============================================================

function drawParticles() {

    for (const particle of particles) {

        const p =
            worldToScreen(
                particle.x,
                particle.y
            );


        ctx.globalAlpha =
            clamp(
                particle.life * 2,
                0,
                1
            );


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            particle.size,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            particle.type === "flash"
                ? "#ffd45a"
                : "#76604f";

        ctx.fill();

    }


    ctx.globalAlpha = 1;

}


// ============================================================
// DRAW
// ============================================================

function draw() {

    drawBackground();

    drawRoads();

    drawHouses();

    drawMarket();

    drawTrees();

    drawBullets();

    drawFlames();

    drawZombies();

    drawParticles();

    drawPlayer();

}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    waveText.textContent =
        String(wave);

    killsText.textContent =
        String(kills);

    healthText.textContent =
        String(
            Math.ceil(
                player.health
            )
        );

    bonusText.textContent =
        "+" +
        damageBonus +
        "%";


    let weapon;

    switch (player.weapon) {

        case 1:
            weapon =
                weapons.pistol;
            break;

        case 2:
            weapon =
                weapons.shotgun;
            break;

        case 3:
            weapon =
                weapons.flamethrower;
            break;

        case 4:
            weapon =
                weapons.machinegun;
            break;

        case 5:
            weapon =
                weapons.rifle;
            break;

        default:
            weapon =
                weapons.pistol;

    }


    weaponNameText.textContent =
        weapon.name;


    if (player.weapon === 1) {

        ammoText.textContent =
            "12 / ∞";

    } else {

        ammoText.textContent =
            "∞";

    }


    marketKills.textContent =
        String(kills);

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text,
    seconds
) {

    waveMessage.innerHTML =
        text;

    waveMessage.style.opacity =
        "1";

    messageTimer =
        seconds;

}


function updateMessage(dt) {

    if (messageTimer > 0) {

        messageTimer -= dt;

        if (messageTimer <= 0) {

            waveMessage.style.opacity =
                "0";

        }

    }

}


// ============================================================
// REMOVE DEAD ZOMBIES
// ============================================================

function cleanZombies() {

    zombies =
        zombies.filter(
            zombie =>
                !zombie.dead
        );

}


// ============================================================
// GAME OVER
// ============================================================

function endGame() {

    if (!running) return;

    running = false;

    mouse.down = false;

    gameOverScreen.style.display =
        "flex";

    gameOverTitle.textContent =
        "GAME OVER";

    gameOverText.textContent =
        "You survived to Wave " +
        wave +
        " and got " +
        kills +
        " kills.";

}


function winGame() {

    running = false;

    mouse.down = false;

    gameOverScreen.style.display =
        "flex";

    gameOverTitle.textContent =
        "YOU SURVIVED 100 WAVES!";

    gameOverText.textContent =
        "Final kills: " +
        kills +
        " · Damage bonus: +" +
        damageBonus +
        "%";

}


// ============================================================
// RESET
// ============================================================

function resetGame() {

    wave = 1;

    kills = 0;

    damageBonus = 0;


    zombies = [];
    bullets = [];
    flames = [];
    particles = [];


    player.x =
        WORLD_WIDTH / 2;

    player.y =
        WORLD_HEIGHT / 2 +
        700;

    player.health =
        player.maxHealth;

    player.weapon = 1;


    player.pistolCooldown = 0;
    player.shotgunCooldown = 0;
    player.flameCooldown = 0;
    player.machineCooldown = 0;
    player.rifleCooldown = 0;

    player.invulnerable = 0;


    camera.x =
        player.x;

    camera.y =
        player.y;


    remainingToSpawn = 0;

    spawnTimer = 0;

    nextWaveTimer = 2;


    generateMap();

    updateHUD();

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    resetGame();

    running = true;

    gameLoopRunning = false;


    startScreen.style.display =
        "none";

    gameOverScreen.style.display =
        "none";

    marketMenu.style.display =
        "none";


    startWave();


    lastTime =
        performance.now();


    // Important:
    // only one animation loop can run.

    if (!gameLoopRunning) {

        gameLoopRunning = true;

        requestAnimationFrame(loop);

    }

}


// ============================================================
// BUTTONS
// ============================================================

startButton.addEventListener(
    "click",
    function(e) {

        e.preventDefault();

        startGame();

    }
);


restartButton.addEventListener(
    "click",
    function(e) {

        e.preventDefault();

        startGame();

    }
);


// ============================================================
// MAIN GAME LOOP
// ============================================================

function loop(timestamp) {

    if (!running) {

        gameLoopRunning = false;

        return;

    }


    let dt =
        (timestamp - lastTime) /
        1000;


    // Prevent huge time jumps

    dt =
        Math.min(
            dt,
            0.035
        );


    lastTime =
        timestamp;


    // Update

    updatePlayer(dt);

    updateWave(dt);


    for (const zombie of zombies) {
        zombie.update(dt);
    }


    updateBullets(dt);

    updateFlames(dt);

    updateParticles(dt);

    updateCamera(dt);

    updateMessage(dt);


    cleanZombies();

    updateHUD();


    // Draw

    draw();


    requestAnimationFrame(loop);

}


// ============================================================
// INITIALIZE
// ============================================================

generateMap();

updateHUD();
```
