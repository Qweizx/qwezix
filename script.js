const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const flash = document.getElementById("flash");
const hint = document.getElementById("hint");
const name = document.getElementById("name");
const message = document.getElementById("message");
const replay = document.getElementById("replay");
const music = document.getElementById("music");

let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
}

resize();

window.addEventListener("resize", resize);


// =====================================================
// НАСТРОЙКИ
// =====================================================

const PARTICLES = 2200;

let particles = [];
let stars = [];

let state = "heart";
let time = 0;
let rotation = 0;


// =====================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function lerp(a, b, amount) {
    return a + (b - a) * amount;
}


// =====================================================
// СОЗДАНИЕ ТОЧКИ ВНУТРИ СЕРДЦА
// =====================================================

function createHeartPoint() {

    // Случайный угол
    const t =
        Math.random() *
        Math.PI *
        2;

    // Случайный радиус.
    // sqrt делает распределение частиц более равномерным.
    const r =
        Math.sqrt(
            Math.random()
        );

    // Классическая форма сердца
    const x =
        16 *
        Math.pow(
            Math.sin(t),
            3
        );

    const y =
        13 *
            Math.cos(t)
        - 5 *
            Math.cos(2 * t)
        - 2 *
            Math.cos(3 * t)
        - Math.cos(4 * t);

    return {

        x:
            (x * r) / 16,

        y:
            (y * r) / 16,

        z:
            random(
                -0.5,
                0.5
            )

    };
}


// =====================================================
// СОЗДАЁМ СЕРДЦЕ
// =====================================================

for (let i = 0; i < PARTICLES; i++) {

    const point = createHeartPoint();

    particles.push({

        x: point.x,
        y: point.y,
        z: point.z,

        heartX: point.x,
        heartY: point.y,
        heartZ: point.z,

        targetX: point.x,
        targetY: point.y,
        targetZ: point.z,

        vx: 0,
        vy: 0,
        vz: 0,

        size: random(1, 3),

        alpha: random(0.5, 1),

        phase: random(0, Math.PI * 2)

    });
}


// =====================================================
// ЗВЁЗДЫ
// =====================================================

for (let i = 0; i < 250; i++) {

    stars.push({

        x: Math.random(),
        y: Math.random(),

        size: random(0.5, 2),

        alpha: random(0.2, 0.8),

        phase: random(0, Math.PI * 2)

    });
}


// =====================================================
// ТЕКСТ АНЯ
// =====================================================

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

textCanvas.width = 900;
textCanvas.height = 400;

textCtx.fillStyle = "white";
textCtx.font = "bold 250px Arial";
textCtx.textAlign = "center";
textCtx.textBaseline = "middle";

textCtx.fillText(
    "АНЯ",
    450,
    200
);

const textImage = textCtx.getImageData(
    0,
    0,
    900,
    400
);

let textPoints = [];

for (let y = 0; y < 400; y += 5) {

    for (let x = 0; x < 900; x += 5) {

        const index =
            (y * 900 + x) * 4;

        if (textImage.data[index + 3] > 100) {

            textPoints.push({

                x: (x - 450) / 8,

                y: -(y - 200) / 8,

                z: random(-2, 2)

            });
        }
    }
}


// =====================================================
// ПРИВЯЗЫВАЕМ ЧАСТИЦЫ К ТЕКСТУ
// =====================================================

for (let i = 0; i < particles.length; i++) {

    const point =
        textPoints[i % textPoints.length];

    particles[i].textX = point.x;
    particles[i].textY = point.y;
    particles[i].textZ = point.z;
}


// =====================================================
// 3D ПОВОРОТ
// =====================================================

function rotate3D(x, y, z) {

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return {

        x: x * cos - z * sin,

        y: y,

        z: x * sin + z * cos

    };
}


// =====================================================
// ПРОЕКЦИЯ НА ЭКРАН
// =====================================================

function project(point) {

    const distance = 5;

    const perspective =
        distance /
        (distance - point.z);

    // Размер сердца зависит от экрана
    const scale =
        Math.min(W, H) * 0.22;

    return {

        x:
            W / 2 +
            point.x *
            perspective *
            scale,

        y:
            H / 2 -
            point.y *
            perspective *
            scale,

        scale:
            perspective

    };
}


// =====================================================
// ФОН
// =====================================================

function drawBackground() {

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            0,
            W / 2,
            H / 2,
            Math.max(W, H) * 0.8
        );

    gradient.addColorStop(
        0,
        "#32000d"
    );

    gradient.addColorStop(
        0.35,
        "#120005"
    );

    gradient.addColorStop(
        0.75,
        "#030001"
    );

    gradient.addColorStop(
        1,
        "#000000"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}


// =====================================================
// ЗВЁЗДЫ
// =====================================================

function drawStars() {

    for (const star of stars) {

        const twinkle =
            0.5 +
            Math.sin(
                time * 0.002 +
                star.phase
            ) * 0.5;

        ctx.beginPath();

        ctx.arc(
            star.x * W,
            star.y * H,
            star.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(
                255,
                100,
                130,
                ${star.alpha * twinkle}
            )`;

        ctx.fill();
    }
}


// =====================================================
// СВЕЧЕНИЕ
// =====================================================

function drawGlow(
    x,
    y,
    radius,
    alpha
) {

    const gradient =
        ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            radius
        );

    gradient.addColorStop(
        0,
        `rgba(255, 20, 60, ${alpha})`
    );

    gradient.addColorStop(
        0.4,
        `rgba(255, 0, 50, ${alpha * 0.4})`
    );

    gradient.addColorStop(
        1,
        "rgba(255, 0, 50, 0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// =====================================================
// РИСУЕМ ЧАСТИЦУ
// =====================================================

function drawParticle(p) {

    const rotated =
        rotate3D(
            p.x,
            p.y,
            p.z
        );

    const projected =
        project(rotated);

    const pulse =
        1 +
        Math.sin(
            time * 0.01 +
            p.phase
        ) * 0.25;

    const size =
        p.size *
        projected.scale *
        pulse;

    drawGlow(
        projected.x,
        projected.y,
        size * 7,
        0.12
    );

    ctx.beginPath();

    ctx.arc(
        projected.x,
        projected.y,
        Math.max(1, size),
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        `rgba(
            255,
            35,
            70,
            ${p.alpha}
        )`;

    ctx.fill();
}


// =====================================================
// МУЗЫКА
// =====================================================

function startMusic() {

    music.volume = 0.5;

    music.play().catch(() => {});
}


// =====================================================
// ВСПЫШКА
// =====================================================

function flashScreen() {

    flash.animate(

        [
            { opacity: 0 },
            { opacity: 0.9 },
            { opacity: 0 }

        ],

        {
            duration: 650,
            easing: "ease-out"
        }
    );
}


// =====================================================
// ВЗРЫВ СЕРДЦА
// =====================================================

function explode() {

    state = "exploding";

    hint.classList.add("hidden");

    startMusic();

    flashScreen();

    for (const p of particles) {

        const length =
            Math.sqrt(
                p.x * p.x +
                p.y * p.y +
                p.z * p.z
            ) || 1;

        const force =
            random(2, 6);

        p.vx =
            (p.x / length) *
            force;

        p.vy =
            (p.y / length) *
            force;

        p.vz =
            random(-3, 3);
    }

    setTimeout(
        assembleName,
        900
    );
}


// =====================================================
// СОБИРАЕМ АНЮ
// =====================================================

function assembleName() {

    state = "assembling";

    for (const p of particles) {

        p.targetX = p.textX;
        p.targetY = p.textY;
        p.targetZ = p.textZ;
    }

    setTimeout(
        showMessage,
        2200
    );
}


// =====================================================
// ПОКАЗЫВАЕМ ТЕКСТ
// =====================================================

function showMessage() {

    state = "done";

    name.classList.add("visible");

    setTimeout(() => {

        message.classList.add("visible");

        replay.classList.add("visible");

    }, 700);
}


// =====================================================
// СБРОС
// =====================================================

function reset() {

    state = "heart";

    name.classList.remove("visible");

    message.classList.remove("visible");

    replay.classList.remove("visible");

    hint.classList.remove("hidden");

    rotation = 0;

    for (const p of particles) {

        p.x = p.heartX;
        p.y = p.heartY;
        p.z = p.heartZ;

        p.targetX = p.heartX;
        p.targetY = p.heartY;
        p.targetZ = p.heartZ;

        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
    }
}


// =====================================================
// КЛИК ПО СЕРДЦУ
// =====================================================

canvas.addEventListener(
    "click",
    () => {

        if (state === "heart") {

            explode();

        }
    }
);


// =====================================================
// КНОПКА ЕЩЁ РАЗ
// =====================================================

replay.addEventListener(
    "click",
    () => {

        reset();

    }
);


// =====================================================
// ГЛАВНАЯ АНИМАЦИЯ
// =====================================================

function animate() {

    requestAnimationFrame(animate);

    time++;

    drawBackground();

    drawStars();


    // -------------------------------------------------
    // СЕРДЦЕ
    // -------------------------------------------------

    if (state === "heart") {

        // Вращение
        rotation += 0.008;


        // НОРМАЛЬНЫЙ ПУЛЬС
        const beat =
            1 +
            Math.sin(time * 0.045) *
            0.10;


        for (const p of particles) {

            p.x =
                lerp(
                    p.x,
                    p.heartX * beat,
                    0.1
                );

            p.y =
                lerp(
                    p.y,
                    p.heartY * beat,
                    0.1
                );

            p.z =
                lerp(
                    p.z,
                    p.heartZ,
                    0.1
                );
        }
    }


    // -------------------------------------------------
    // ВЗРЫВ
    // -------------------------------------------------

    if (state === "exploding") {

        rotation += 0.025;

        for (const p of particles) {

            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            p.vx *= 0.96;
            p.vy *= 0.96;
            p.vz *= 0.96;
        }
    }


    // -------------------------------------------------
    // АНЯ
    // -------------------------------------------------

    if (
        state === "assembling" ||
        state === "done"
    ) {

        rotation += 0.002;

        for (const p of particles) {

            p.x =
                lerp(
                    p.x,
                    p.targetX,
                    0.035
                );

            p.y =
                lerp(
                    p.y,
                    p.targetY,
                    0.035
                );

            p.z =
                lerp(
                    p.z,
                    p.targetZ,
                    0.035
                );
        }
    }


    // -------------------------------------------------
    // СОРТИРОВКА
    // -------------------------------------------------

    particles.sort(
        (a, b) =>
            a.z - b.z
    );


    // -------------------------------------------------
    // РИСУЕМ
    // -------------------------------------------------

    for (const p of particles) {

        drawParticle(p);

    }
}


// =====================================================
// ЗАПУСК
// =====================================================

animate();