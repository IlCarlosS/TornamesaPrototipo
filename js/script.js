  // Config: lista de canciones locales (poner archivos en /audio/)
  const playlist = [
    { src: 'audio/Claim To Fame - The Grey Room _ Clark Sims.mp3', title: 'Claim To Fame', artist: 'The Grey Room & Clark Sims', cover: 'covers/2.webp' },
    { src: 'audio/Im Giving Up - Everet Almond.mp3', title: 'Im Giving Up', artist: 'Everet Almond', cover: 'covers/2.webp' },
    { src: 'audio/Time - The Grey Room _ Clark Sims.mp3', title: 'Time', artist: 'The Grey Room & Clark Sims', cover: 'covers/3.webp' }
  ];

  // Elementos
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const bar = document.getElementById('bar');
  const progress = document.getElementById('progress');
  const timeLabel = document.getElementById('time');
  const titleEl = document.getElementById('title');
  const artistEl = document.getElementById('artist');
  const coverImgEl = document.getElementById('imagenCancion');
  const vol = document.getElementById('vol');
  const platter = document.getElementById('platter');
  const arm = document.getElementById('arm');
  const playlistEl = document.getElementById('playlist');
  const randomBtn = document.getElementById("random");
  const vizBtn = document.getElementById("vizToggle");

  let idx = 0;
  let isPlaying = false;
  let rafId = null;
  let isRandom = false; 
  let vizMode = "bars"; // "bars" o "wave"

  // Construir UI de playlist
function buildPlaylist(){
    playlistEl.innerHTML = '';
    playlist.forEach((t, i) => {
      const tr = document.createElement('div');
      tr.className = 'track' + (i===idx ? ' active' : '');
      tr.innerHTML = `<div>${i+1}. ${t.title}</div><div style="font-size:.85rem;color:var(--muted)">${t.artist}</div>`;

      //botón de eliminar en canciones de usuario
    if(i > 2){ 
      const delBtn = document.createElement("button");
        delBtn.textContent = "🗑";
        delBtn.style.marginLeft = "8px";
        delBtn.style.cursor = "pointer";
        delBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // evita que dispare el play()
          deleteTrack(i);
        });
        tr.appendChild(delBtn);
      }

      tr.addEventListener('click', () => {
        loadTrack(i);
        play();
      });
      playlistEl.appendChild(tr);
    });
}

function highlightPlaylist(){
    Array.from(playlistEl.children).forEach((el, i) => {
      el.classList.toggle('active', i===idx);
    });
}

function loadTrack(i){
    if(!playlist[i]) return;

    idx = i;
    const currentTrack = playlist[idx]; // Una referencia a la canción actual

    audio.src = currentTrack.src;
    titleEl.textContent = currentTrack.title;
    artistEl.textContent = currentTrack.artist;
    coverImgEl.src = currentTrack.cover;

    audio.load();
    highlightPlaylist();
    updateTimeLabel(); // reset label
}

function play(){
  if (!audio.src) loadTrack(idx);

  audio.play().then(() => {
    isPlaying = true;
    playBtn.textContent = '⏸';
    platter.classList.add('playing');
    arm.classList.add('on');
    startSync();
    // --- Visualizador ---
    if(audioCtx && audioCtx.state === "suspended"){
      audioCtx.resume();
    } else if(!audioCtx){
      setupVisualizer();
    }
  }).catch(e => {
    console.error('Play error', e);
    alert('No se pudo reproducir.');
  });
}

function pause(){
    audio.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
    platter.classList.remove('playing');
    arm.classList.remove('on');
    stopSync();
}

function togglePlay(){
    if(isPlaying) pause(); else play();
}

function toggleRandom(){
  isRandom = !isRandom;
  randomBtn.classList.toggle("active-random", isRandom);
}

function next(){
  if(isRandom){
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * playlist.length);
    } while(newIndex === idx && playlist.length > 1);
    idx = newIndex;
  } else {
    idx = (idx + 1) % playlist.length;
  }
  loadTrack(idx);
  play();
}

// También opcional en prev:
function prev(){
  if(isRandom){
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * playlist.length);
    } while(newIndex === idx && playlist.length > 1);
    idx = newIndex;
  } else {
    idx = (idx - 1 + playlist.length) % playlist.length;
  }
  loadTrack(idx);
  play();
}

// Progress bar click to seek
progress.addEventListener('click', (e) => {
    const rect = progress.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if(audio.duration) audio.currentTime = p * audio.duration;
    updateProgress();
});

// Volume
vol.addEventListener('input', () => { audio.volume = vol.value; });

function deleteTrack(i){
  if(i <= 2) return; // no borrar las canciones por defecto

  const track = playlist[i];

  // Borrar de IndexedDB (si existe en la DB)
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  // Buscamos por título (mejor sería por id, pero usamos title como proxy)
  const req = store.getAll();
  req.onsuccess = () => {
    const all = req.result;
    const found = all.find(t => t.title === track.title);
    if(found){
      store.delete(found.id);
    }
  };

  // Borrar de memoria
  playlist.splice(i, 1);

  // Reconstruir lista
  buildPlaylist();

  // Si borraste la canción que estaba sonando → parar
  if(idx === i){
    audio.pause();
    audio.src = "";
    idx = 0;
    highlightPlaylist();
  }
}

// Buttons
playBtn.addEventListener('click', togglePlay);
randomBtn.addEventListener("click", toggleRandom);
prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);
vizBtn.addEventListener("click", () => {
  vizMode = vizMode === "bars" ? "wave" : "bars";
  vizBtn.textContent = vizMode === "bars" ? "🌊" : "📶";
});

// Sync progress with RAF for smooth UI
function startSync(){
    function step(){
      updateProgress();
      rafId = requestAnimationFrame(step);
    }
    if(!rafId) rafId = requestAnimationFrame(step);
}
function stopSync(){ if(rafId){ cancelAnimationFrame(rafId); rafId = null; } }

function updateProgress(){
    if(!audio.duration || isNaN(audio.duration)){
      bar.style.width = '0%';
      updateTimeLabel();
      return;
    }
    const pct = (audio.currentTime / audio.duration) * 100;
    bar.style.width = pct + '%';
    updateTimeLabel();
}

function updateTimeLabel(){
    const cur = formatTime(audio.currentTime || 0);
    const dur = formatTime(audio.duration || 0);
    timeLabel.textContent = `${cur} / ${dur}`;
}

function formatTime(s){
    if(!s || isNaN(s)) return '0:00';
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
}

// Auto next when ended
audio.addEventListener('ended', () => {
    next();
});

// Metadata loaded (duration known)
audio.addEventListener('loadedmetadata', updateProgress);
audio.addEventListener('timeupdate', updateProgress);

// Init
buildPlaylist();
loadTrack(idx);
audio.volume = vol.value;

// Accessibility keyboard shortcuts (esp. útil)
document.addEventListener('keydown', (e) => {
    if(e.key === ' '){ e.preventDefault(); togglePlay(); }
    if(e.key === 'ArrowRight') next();
    if(e.key === 'ArrowLeft') prev();
});

// Quick check: archivos disponibles
(async function checkFiles(){
    // intentamos cargar el primer archivo para dar feedback si falta
    try {
      const resp = await fetch(playlist[0].src, {method:'HEAD'});
      if(!resp.ok) console.warn('Verifica que los archivos de audio existan en /audio/');
    } catch(err){
      console.warn('Error comprobando archivos.', err);
    }
})();

// --- Visualizador ---
const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");
let audioCtx, analyser, source, bufferLength, dataArray;

// Ajustar tamaño dinámico del canvas
function resizeCanvas(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function setupVisualizer(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;

    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }
  draw();
}

// ---------- Helper: convertir color CSS a rgba(...) con alpha ----------
function cssColorToRgba(cssColor, alpha = 1) {
  if (!cssColor) return `rgba(255,255,255,${alpha})`;
  cssColor = cssColor.trim();

  // rgb(...) o rgba(...)
  if (cssColor.startsWith('rgb')) {
    const nums = cssColor.match(/[\d.]+/g).map(Number);
    return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
  }

  // hex #rgb or #rrggbb
  if (cssColor.startsWith('#')) {
    let hex = cssColor.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const int = parseInt(hex, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  try {
    // crear un elemento temporal para obtener RGB computado
    const temp = document.createElement('div');
    temp.style.color = cssColor;
    document.body.appendChild(temp);
    const cs = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    if (cs.startsWith('rgb')) {
      const nums = cs.match(/[\d.]+/g).map(Number);
      return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
    }
  } catch (e) {
  }
  // fallback seguro
  return `rgba(255,255,255,${alpha})`;
}

// ---------- draw() actualizado para usar --accent ----------
function draw(){
  requestAnimationFrame(draw);

  // obtener color accent actual desde CSS y convertir
  const accentCss = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#ffc107';
  const accentRGBA = cssColorToRgba(accentCss, 0.9);

  // actualizar datos
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (vizMode === "bars") {
    // --- Barras verticales ---
    let barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    ctx.fillStyle = accentRGBA; // usa el color del tema
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  } else {
    // --- Línea continua / onda ---
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeData);

    ctx.lineWidth = 2;
    ctx.strokeStyle = accentRGBA; // usa el color del tema
    ctx.beginPath();

    let sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = timeData[i] / 128.0;
      let y = v * canvas.height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
}

// ===== DROPZONE LOGIC =====
const dropzone = document.getElementById("dropzone");

const allowedExtensions = ["mp3", "mpg-1", "wav", "flac", "ogg", "opus", "midi"];
const maxSize = 30 * 1024 * 1024; // 30MB

// Manejo de arrastrar sobre dropzone
["dragenter", "dragover"].forEach(event => {
  dropzone.addEventListener(event, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});

// Salida del área
["dragleave", "drop"].forEach(event => {
  dropzone.addEventListener(event, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

// Soltar archivos
dropzone.addEventListener("drop", e => {
  const files = e.dataTransfer.files;
  handleFiles(files);
});

// Click en móviles o desktop
dropzone.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*";
  input.multiple = true;
  input.onchange = e => handleFiles(e.target.files);
  input.click();
});

// Procesar archivos
function handleFiles(files) {
  [...files].forEach(file => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      alert(`Formato no soportado: ${file.name}`);
      return;
    }
    if (file.size > maxSize) {
      alert(`El archivo ${file.name} excede los 30MB`);
      return;
    }

    const url = URL.createObjectURL(file);
    playlist.push({
      title: file.name,
      artist: "Local File",
      src: url,
      cover: "covers/default.webp"
    });

    // Crear item en playlist
    const li = document.createElement("div");
    li.classList.add("track");
    li.textContent = file.name;
    li.addEventListener("click", () => {
      idx = playlist.length - 1; // posición del último agregado
      loadTrack(idx);
      play();
    });
    playlistEl.appendChild(li);

    const reader = new FileReader();
    reader.onload = function(e) {
      const blob = new Blob([e.target.result], { type: file.type });
      saveTrack({
        title: file.name,
        artist: "Local File",
        blob: blob,
        cover: "covers/default.webp"
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

// ===== INDEXEDDB LOGIC =====
let db;
const DB_NAME = "tornamesaDB";
const DB_VERSION = 1;
const STORE_NAME = "tracks";
const MAX_TRACKS = 10; // límite de canciones a guardar

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => {
      console.error("Error abriendo IndexedDB", e);
      reject(e);
    };
  });
}

function saveTrack(track) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const addReq = store.add(track);

    addReq.onsuccess = () => {
      resolve();
      enforceLimit(); //límite de canciones
    };
    addReq.onerror = (e) => reject(e);
  });
}

// Elimina las más viejas si excede MAX_TRACKS
function enforceLimit() {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const req = store.getAllKeys();
  req.onsuccess = () => {
    const keys = req.result;
    if (keys.length > MAX_TRACKS) {
      const extras = keys.length - MAX_TRACKS;
      for (let i = 0; i < extras; i++) {
        store.delete(keys[i]); // borra los más viejos
      }
    }
  };
}

//leer canciones guardadas
function loadSavedTracks() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

// ==== INICIALIZAR INDEXEDDB Y RESTAURAR TRACKS ====
openDB().then(() => {
  return loadSavedTracks();
}).then(savedTracks => {
  savedTracks.forEach(t => {
    const url = URL.createObjectURL(t.blob);
    playlist.push({
      title: t.title,
      artist: t.artist || "Local File",
      src: url,
      cover: t.cover || "covers/default.webp"
    });
  });

  // reconstruir lista visual después de cargar guardados
  buildPlaylist();
}).catch(err => console.error("IndexedDB error", err));