  // Config: lista de canciones locales (poner archivos en /audio/)
  const playlist = [
    { src: 'audio/Claim To Fame - The Grey Room _ Clark Sims.mp3', title: 'Claim To Fame', artist: 'The Grey Room & Clark Sims', cover: 'covers/4.webp' },
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
    alert('No se pudo reproducir. Asegúrate de servir el proyecto desde un servidor y que los archivos existan.');
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

function draw(){
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(vizMode === "bars"){
    // --- Barras verticales ---
    let barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for(let i=0; i<bufferLength; i++){
      barHeight = dataArray[i] / 2;
      ctx.fillStyle = "rgba(255, 193, 7, 0.8)";
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  } else {
    // --- Línea continua / onda ---
    analyser.getByteTimeDomainData(dataArray);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 193, 7, 0.9)";
    ctx.beginPath();

    let sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for(let i=0; i<bufferLength; i++){
      let v = dataArray[i] / 128.0;
      let y = v * canvas.height/2;

      if(i === 0){
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height/2);
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

// Click en móviles o desktop → abre selector
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
  });
}