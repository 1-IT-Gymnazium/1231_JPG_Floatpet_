//drawing?
const drawCanvas = document.getElementById("drawCanvas");
const dctx = drawCanvas.getContext("2d");

drawCanvas.width = canvas.width;
drawCanvas.height = canvas.height;

let drawing = false;
let drawMode = false;

document.getElementById("drawMode").addEventListener("click", () => {
  drawMode = !drawMode;
  drawCanvas.style.pointerEvents = drawMode ? "auto" : "none";
});

drawCanvas.addEventListener("mousedown", e => {
  if (!drawMode) return;
  drawing = true;
  dctx.beginPath();
  dctx.moveTo(e.clientX, e.clientY);
});

drawCanvas.addEventListener("mousemove", e => {
  if (!drawing) return;
  dctx.lineTo(e.clientX, e.clientY);
  dctx.strokeStyle = "white";
  dctx.lineWidth = 4;
  dctx.lineCap = "round";
  dctx.stroke();
});

drawCanvas.addEventListener("mouseup", () => {
  drawing = false;
});


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let uploadedImage = null;
let floaters = [];

// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Upload image
document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    uploadedImage = new Image();
    uploadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});
//shit, ts is canva animation.
document.getElementById("addDrawing").addEventListener("click", () => {
  const img = new Image();
  img.src = drawCanvas.toDataURL();

  floaters.push({
    img: img,
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    dx: (Math.random() - 0.5) * 4,
    dy: (Math.random() - 0.5) * 4,
    size: 150
  });

  dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});

// Add floater
document.getElementById("add").addEventListener("click", () => {
  if (!uploadedImage) return alert("Upload an image first!");

  floaters.push({
    img: uploadedImage,
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    dx: (Math.random() - 0.5) * 4,
    dy: (Math.random() - 0.5) * 4,
    size: 120
  });
});

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  floaters.forEach(f => {
    f.x += f.dx;
    f.y += f.dy;

    // Bounce off edges
    if (f.x < 0 || f.x + f.size > canvas.width) f.dx *= -1;
    if (f.y < 0 || f.y + f.size > canvas.height) f.dy *= -1;

    ctx.drawImage(f.img, f.x, f.y, f.size, f.size);
  });

  requestAnimationFrame(animate);
}

animate();
