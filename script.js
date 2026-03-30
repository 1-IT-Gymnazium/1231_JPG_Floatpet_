// MAIN CANVAS
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// DRAWING CANVAS
const drawCanvas = document.getElementById("drawCanvas");
const dctx = drawCanvas.getContext("2d");
drawCanvas.width = window.innerWidth;
drawCanvas.height = window.innerHeight;

let drawing = false;
let drawMode = false;

// Toggle draw mode
document.getElementById("drawMode").addEventListener("click", () => {
  drawMode = !drawMode;
  drawCanvas.style.pointerEvents = drawMode ? "auto" : "none";
});

// Get mouse position relative to canvas
function getPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Drawing events
drawCanvas.addEventListener("mousedown", e => {
  if (!drawMode) return;
  drawing = true;
  const pos = getPos(e);
  dctx.beginPath();
  dctx.moveTo(pos.x, pos.y);
});

drawCanvas.addEventListener("mousemove", e => {
  if (!drawing) return;
  const pos = getPos(e);
  dctx.lineTo(pos.x, pos.y);
  dctx.strokeStyle = "white";
  dctx.lineWidth = 4;
  dctx.lineCap = "round";
  dctx.stroke();
});

drawCanvas.addEventListener("mouseup", () => {
  drawing = false;
});

// Clear drawing
document.getElementById("clearDrawing").addEventListener("click", () => {
  dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});

// Floater storage
let uploadedImage = null;
let floaters = [];

// Add drawing as floater
document.getElementById("addDrawing").addEventListener("click", () => {
  const img = new Image();
  img.src = drawCanvas.toDataURL();

  floaters.push({
    img: img,
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    dx: (Math.random() - 0.5) * 4,
    dy: (Math.random() - 0.5) * 4,
    size:200
  });

  dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

  drawMode = false;
  drawCanvas.style.pointerEvents = "none";
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

// Add uploaded image as floater
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

    if (f.x < 0 || f.x + f.size > canvas.width) f.dx *= -1;
    if (f.y < 0 || f.y + f.size > canvas.height) f.dy *= -1;

    ctx.drawImage(f.img, f.x, f.y, f.size, f.size);
  });

  requestAnimationFrame(animate);
}

animate();
