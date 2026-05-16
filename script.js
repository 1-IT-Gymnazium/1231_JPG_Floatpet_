const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const drawCanvas = document.getElementById("drawCanvas");
const dctx = drawCanvas.getContext("2d");

const hudToggleButton = document.getElementById("hudToggle");
const uploadInput = document.getElementById("upload");
const addImageButton = document.getElementById("addImage");
const drawModeButton = document.getElementById("drawMode");
const clearDrawingButton = document.getElementById("clearDrawing");
const addDrawingButton = document.getElementById("addDrawing");
const clearFloatersButton = document.getElementById("clearFloaters");
const brushColorInput = document.getElementById("brushColor");
const backgroundColorInput = document.getElementById("backgroundColor");
const brushSizeInput = document.getElementById("brushSize");
const speedInput = document.getElementById("speed");
const bounceInput = document.getElementById("bounce");
const gravityInput = document.getElementById("gravity");
const frictionInput = document.getElementById("friction");
const statusText = document.getElementById("status");

let drawing = false;
let drawMode = false;
let uploadedImage = null;
let uploadedFileName = "";
let floaters = [];
let draggedFloater = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastPointer = null;

function setHudHidden(hidden) {
  document.body.classList.toggle("hud-hidden", hidden);
  hudToggleButton.textContent = hidden ? "Show HUD" : "Hide HUD";
  hudToggleButton.setAttribute("aria-expanded", String(!hidden));
}

function resizeCanvases() {
  const previousDrawing = document.createElement("canvas");
  previousDrawing.width = drawCanvas.width;
  previousDrawing.height = drawCanvas.height;

  if (drawCanvas.width && drawCanvas.height) {
    previousDrawing.getContext("2d").drawImage(drawCanvas, 0, 0);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;

  if (previousDrawing.width && previousDrawing.height) {
    dctx.drawImage(previousDrawing, 0, 0);
  }

  floaters = floaters.map(floater => ({
    ...floater,
    x: clamp(floater.x, 0, Math.max(canvas.width - floater.width, 0)),
    y: clamp(floater.y, 0, Math.max(canvas.height - floater.height, 0))
  }));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setStatus(message) {
  statusText.textContent = message;
}

function setBackgroundColor(color) {
  document.documentElement.style.setProperty("--stage", color);
  document.body.style.background = color;
}

function setDrawMode(active) {
  drawMode = active;
  drawCanvas.style.pointerEvents = active ? "auto" : "none";
  drawModeButton.setAttribute("aria-pressed", String(active));
  document.body.classList.toggle("drawing-active", active);
  setStatus(active ? "Drawing mode active" : "Ready");
}

function getPointerPosition(event) {
  const rect = drawCanvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function getCanvasPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function drawingHasPixels() {
  const pixels = dctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 0) return true;
  }

  return false;
}

function getDrawingBounds() {
  const imageData = dctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
  const pixels = imageData.data;
  let minX = drawCanvas.width;
  let minY = drawCanvas.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < drawCanvas.height; y += 1) {
    for (let x = 0; x < drawCanvas.width; x += 1) {
      const alpha = pixels[(y * drawCanvas.width + x) * 4 + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

function createFloater(img, preferredSize = 150) {
  const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
  const width = aspect >= 1 ? preferredSize : preferredSize * aspect;
  const height = aspect >= 1 ? preferredSize / aspect : preferredSize;
  const speed = Number(speedInput.value);
  const angle = Math.random() * Math.PI * 2;

  return {
    img,
    x: Math.random() * Math.max(canvas.width - width, 1),
    y: Math.random() * Math.max(canvas.height - height, 1),
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    width,
    height,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.015,
    grabbed: false
  };
}

function addImageFloater(img, preferredSize = 150) {
  floaters.push(createFloater(img, preferredSize));
  setStatus(`${floaters.length} floater${floaters.length === 1 ? "" : "s"}`);
}

function getPhysicsSettings() {
  return {
    bounce: Number(bounceInput.value) / 100,
    gravity: Number(gravityInput.value) / 100,
    friction: 1 - Number(frictionInput.value) / 1000
  };
}

function findFloaterAt(x, y) {
  for (let i = floaters.length - 1; i >= 0; i -= 1) {
    const floater = floaters[i];

    if (
      x >= floater.x &&
      x <= floater.x + floater.width &&
      y >= floater.y &&
      y <= floater.y + floater.height
    ) {
      return floater;
    }
  }

  return null;
}

function clearDrawing() {
  dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function startDrawing(event) {
  if (!drawMode) return;

  event.preventDefault();
  drawing = true;

  const pos = getPointerPosition(event);
  dctx.beginPath();
  dctx.moveTo(pos.x, pos.y);
  dctx.lineTo(pos.x, pos.y);
  dctx.strokeStyle = brushColorInput.value;
  dctx.lineWidth = Number(brushSizeInput.value);
  dctx.lineCap = "round";
  dctx.lineJoin = "round";
  dctx.stroke();
  drawCanvas.setPointerCapture(event.pointerId);
  setStatus("Drawing...");
}

function draw(event) {
  if (!drawing) return;
  event.preventDefault();

  const pos = getPointerPosition(event);
  dctx.lineTo(pos.x, pos.y);
  dctx.strokeStyle = brushColorInput.value;
  dctx.lineWidth = Number(brushSizeInput.value);
  dctx.lineCap = "round";
  dctx.lineJoin = "round";
  dctx.stroke();
}

function stopDrawing() {
  drawing = false;
}

function finishDrawing(event) {
  if (!drawing) return;

  drawing = false;

  if (drawCanvas.hasPointerCapture(event.pointerId)) {
    drawCanvas.releasePointerCapture(event.pointerId);
  }

  setStatus("Sketch ready");
}

drawModeButton.addEventListener("click", () => {
  const nextDrawMode = !drawMode;

  setDrawMode(nextDrawMode);

  if (nextDrawMode) {
    setHudHidden(true);
  }
});

hudToggleButton.addEventListener("click", () => {
  setHudHidden(!document.body.classList.contains("hud-hidden"));
});

window.addEventListener("keydown", event => {
  const typingInInput = event.target instanceof Element && event.target.matches("input");

  if (event.key.toLowerCase() === "h" && !typingInInput) {
    setHudHidden(!document.body.classList.contains("hud-hidden"));
  }
});

clearDrawingButton.addEventListener("click", () => {
  clearDrawing();
  setStatus("Sketch cleared");
});

addDrawingButton.addEventListener("click", () => {
  if (!drawingHasPixels()) {
    setStatus("Draw something first");
    return;
  }

  const bounds = getDrawingBounds();
  const padding = 18;
  const cropX = Math.max(bounds.minX - padding, 0);
  const cropY = Math.max(bounds.minY - padding, 0);
  const cropWidth = Math.min(bounds.maxX - bounds.minX + padding * 2, drawCanvas.width - cropX);
  const cropHeight = Math.min(bounds.maxY - bounds.minY + padding * 2, drawCanvas.height - cropY);
  const croppedCanvas = document.createElement("canvas");

  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  croppedCanvas
    .getContext("2d")
    .drawImage(drawCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  const img = new Image();
  img.onload = () => {
    floaters.push(createFloater(img, Math.min(220, Math.max(cropWidth, cropHeight))));
    setStatus(`${floaters.length} floater${floaters.length === 1 ? "" : "s"}`);
  };
  img.src = croppedCanvas.toDataURL("image/png");

  clearDrawing();
  setDrawMode(false);
});

uploadInput.addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file) return;

  setStatus(`Loading ${file.name}`);

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      uploadedImage = img;
      uploadedFileName = file.name;
      addImageButton.disabled = false;
      addImageButton.textContent = "Add Again";
      addImageFloater(uploadedImage, 150);
    };

    img.onerror = () => {
      uploadedImage = null;
      uploadedFileName = "";
      addImageButton.disabled = true;
      addImageButton.textContent = "Add Image";
      setStatus("That image could not load");
    };

    img.src = reader.result;
  };

  reader.onerror = () => {
    setStatus("Could not read that file");
  };

  reader.readAsDataURL(file);
});

addImageButton.addEventListener("click", () => {
  if (!uploadedImage) {
    setStatus("Upload an image first");
    return;
  }

  addImageFloater(uploadedImage, 150);
});

clearFloatersButton.addEventListener("click", () => {
  floaters = [];
  setStatus("Floaters cleared");
});

function handleBackgroundInput(event) {
  setBackgroundColor(event.target.value);
  setStatus("Background changed");
}

backgroundColorInput.addEventListener("input", handleBackgroundInput);
backgroundColorInput.addEventListener("change", handleBackgroundInput);

canvas.addEventListener("pointerdown", event => {
  if (drawMode) return;

  const pos = getCanvasPointerPosition(event);
  const floater = findFloaterAt(pos.x, pos.y);

  if (!floater) return;

  event.preventDefault();
  draggedFloater = floater;
  draggedFloater.grabbed = true;
  dragOffsetX = pos.x - floater.x;
  dragOffsetY = pos.y - floater.y;
  lastPointer = { x: pos.x, y: pos.y, time: performance.now() };
  canvas.setPointerCapture(event.pointerId);
  document.body.classList.add("dragging-floater");
  setStatus("Throw it");
});

canvas.addEventListener("pointermove", event => {
  if (!draggedFloater) return;

  event.preventDefault();
  const pos = getCanvasPointerPosition(event);
  const now = performance.now();
  const elapsed = Math.max(now - lastPointer.time, 16);

  draggedFloater.x = clamp(pos.x - dragOffsetX, 0, canvas.width - draggedFloater.width);
  draggedFloater.y = clamp(pos.y - dragOffsetY, 0, canvas.height - draggedFloater.height);
  draggedFloater.dx = ((pos.x - lastPointer.x) / elapsed) * 16;
  draggedFloater.dy = ((pos.y - lastPointer.y) / elapsed) * 16;
  draggedFloater.spin = clamp(draggedFloater.dx * 0.003, -0.08, 0.08);
  lastPointer = { x: pos.x, y: pos.y, time: now };
});

canvas.addEventListener("pointerup", event => {
  if (!draggedFloater) return;

  event.preventDefault();
  draggedFloater.grabbed = false;
  draggedFloater = null;
  canvas.releasePointerCapture(event.pointerId);
  document.body.classList.remove("dragging-floater");
  setStatus("Floater flung");
});

canvas.addEventListener("pointercancel", () => {
  if (draggedFloater) draggedFloater.grabbed = false;
  draggedFloater = null;
  document.body.classList.remove("dragging-floater");
});

drawCanvas.addEventListener("pointerdown", startDrawing);
drawCanvas.addEventListener("pointermove", draw);
drawCanvas.addEventListener("pointerup", finishDrawing);
drawCanvas.addEventListener("pointercancel", finishDrawing);
window.addEventListener("resize", resizeCanvases);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const physics = getPhysicsSettings();

  floaters.forEach(floater => {
    if (floater.grabbed) {
      drawFloater(floater);
      return;
    }

    floater.dy += physics.gravity;
    floater.dx *= physics.friction;
    floater.dy *= physics.friction;
    floater.x += floater.dx;
    floater.y += floater.dy;
    floater.rotation += floater.spin;

    if (floater.x <= 0 || floater.x + floater.width >= canvas.width) {
      floater.dx *= -physics.bounce;
      floater.x = clamp(floater.x, 0, canvas.width - floater.width);
    }

    if (floater.y <= 0 || floater.y + floater.height >= canvas.height) {
      floater.dy *= -physics.bounce;
      floater.y = clamp(floater.y, 0, canvas.height - floater.height);
    }

    drawFloater(floater);
  });

  requestAnimationFrame(animate);
}

function drawFloater(floater) {
  ctx.save();
  ctx.translate(floater.x + floater.width / 2, floater.y + floater.height / 2);
  ctx.rotate(floater.rotation);
  ctx.drawImage(
    floater.img,
    -floater.width / 2,
    -floater.height / 2,
    floater.width,
    floater.height
  );
  ctx.restore();
}

setBackgroundColor(backgroundColorInput.value);
resizeCanvases();
animate();
