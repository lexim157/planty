// DOM Elements
const video = document.getElementById('camera-feed');
const canvas = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('capture-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const resultsDiv = document.getElementById('results');
const plantInfoDiv = document.getElementById('plant-info');
const loadingDiv = document.getElementById('loading');

// Current captured photo
let currentPhoto = null;

// Initialize camera
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } // Use rear camera
    });
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access camera. Please upload a photo instead.");
    fileInput.style.display = 'block';
  }
}

// Capture photo from camera
captureBtn.addEventListener('click', () => {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  currentPhoto = canvas.toDataURL('image/jpeg');
  uploadBtn.disabled = false;
  alert("Photo captured! Click Identify to analyze.");
});

// Upload photo for identification
uploadBtn.addEventListener('click', () => {
  if (!currentPhoto) return;
  identifyPlant(currentPhoto);
});

// Alternative file upload
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      currentPhoto = event.target.result;
      uploadBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

// Send image to YOUR BACKEND (not Plant.id directly)
async function identifyPlant(imageData) {
  showLoading(true);
  clearResults();

  try {
    // 1. Convert image to blob
    const blob = dataURItoBlob(imageData);
    const formData = new FormData();
    formData.append('plantImage', blob, 'plant.jpg');

    // 2. Call your secure backend
    const response = await fetch('https://your-backend-url.herokuapp.com/api/identify', {
      method: 'POST',
      body: formData
    });

    // 3. Handle response
    if (!response.ok) throw new Error('Identification failed');
    
    const { results } = await response.json();
    if (!results || results.length === 0) {
      throw new Error('No plants identified');
    }

    displayResults(results[0]); // Show top result

  } catch (error) {
    console.error("Error:", error);
    displayError("Failed to identify plant. Please try again.");
  } finally {
    showLoading(false);
  }
}

// Display results from YOUR BACKEND
function displayResults(result) {
  const html = `
    <div class="plant-card ${result.isInvasive ? 'invasive' : ''}">
      <h3>${result.name}</h3>
      <p>Probability: ${Math.round(result.probability * 100)}%</p>
      
      ${result.isInvasive ? 
        '<div class="warning"><i class="fas fa-exclamation-triangle"></i> INVASIVE SPECIES</div>' : 
        '<div class="safe"><i class="fas fa-check-circle"></i> Not Invasive</div>'
      }
      
      <img src="${currentPhoto}" alt="Identified plant" class="plant-image">
      
      ${result.details.description ? 
        `<p>${result.details.description.substring(0, 200)}...</p>` : ''
      }
      
      ${result.details.url ? 
        `<a href="${result.details.url}" target="_blank" class="more-info">More info</a>` : ''
      }
    </div>
  `;

  plantInfoDiv.innerHTML = html;
  resultsDiv.classList.remove('hidden');
}

// Helper: Convert data URL to blob
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

// UI Helpers
function showLoading(show) {
  loadingDiv.classList.toggle('hidden', !show);
  uploadBtn.disabled = show;
}

function clearResults() {
  plantInfoDiv.innerHTML = '';
  resultsDiv.classList.add('hidden');
}

function displayError(message) {
  plantInfoDiv.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-circle"></i> ${message}
    </div>
  `;
  resultsDiv.classList.remove('hidden');
}

// Initialize app
initCamera();