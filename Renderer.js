const videoPlayer = document.getElementById('videoPlayer');
const playPauseBtn = document.getElementById('playPause');
const progressBar = document.getElementById('progressBar');
const volumeControl = document.getElementById('volumeControl');
const videoContainer = document.querySelector('.video-container');
const customControls = document.getElementById('customControls');
const videoList = document.getElementById('videoList');
const changeFolderBtn = document.getElementById('changeFolderBtn');
const searchBar = document.getElementById('searchBar');
const timeCode = document.getElementById('timeCode');
const placeholderText = document.getElementById('placeholderText');
const supportedFormats = ['.mp4', '.mkv', '.avi', '.mov'];
let selectedVideoItem = null;
let controlTimer;

const MAX_CONCURRENT_PREVIEWS = 999;

const savedVolume = localStorage.getItem('videoVolume');
if (savedVolume !== null) {
    videoPlayer.volume = savedVolume;
    volumeControl.value = savedVolume;
}

changeFolderBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.selectFolder();
    if (result && result.files.length > 0) {
        localStorage.setItem('lastOpenedFolder', result.folderPath);

        loadVideosFromFolder(result.folderPath, result.files);
    }
});

function loadVideosFromFolder(folderPath, files) {
    videoList.innerHTML = '';

    files.forEach((file, index) => {
        const fileExtension = file.slice(file.lastIndexOf('.')).toLowerCase();
        if(!supportedFormats.includes(fileExtension)){
            return;
        }

        const listItem = document.createElement('li');
        listItem.classList.add('video-item');
        
        const thumbnail = document.createElement('img');
        thumbnail.classList.add('thumbnail');
        listItem.appendChild(thumbnail);

        const videoTitle = document.createElement('span');
        videoTitle.textContent = file;
        listItem.appendChild(videoTitle);
        
        listItem.addEventListener('click', () => {
            if (selectedVideoItem) {
                videoPlayer.classList.add('video-fade-out'); // Commence la transition de sortie
                setTimeout(() => {
                    const videoPath = `${folderPath}/${file}`;
                    loadVideo(videoPath);
                    videoPlayer.classList.remove('video-fade-out');
                    videoPlayer.classList.add('video-fade-in'); // Commence la transition d'apparition
                }, 500); // Délai de la transition
            } else {
                const videoPath = `${folderPath}/${file}`;
                loadVideo(videoPath);
            }
            
            if (selectedVideoItem) {
                selectedVideoItem.classList.remove('selected');
            }
            listItem.classList.add('selected');
            selectedVideoItem = listItem;
        });
        videoList.appendChild(listItem);

        if (index < MAX_CONCURRENT_PREVIEWS) {
            generateThumbnailAsync(`${folderPath}/${file}`, thumbnail, index);
        }
    });
}

searchBar.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const videos = videoList.getElementsByTagName('li');

    Array.from(videos).forEach(video => {
        const videoTitle = video.textContent.toLowerCase();
        video.style.display = videoTitle.includes(searchTerm) ? '' : 'none';
    });
});

async function generateThumbnailAsync(videoPath, imgElement, delay) {
    await new Promise(resolve => setTimeout(resolve, delay * 100));
    generateThumbnail(videoPath, imgElement);
}

function loadVideo(videoPath) {
    placeholderText.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    videoPlayer.classList.add('fade-in');
    customControls.classList.add('show-controls');
    videoPlayer.src = videoPath;
    videoPlayer.play();
    updatePlayPauseIcon();
    showControls(); // S'assurer que la barre de contrôle s'affiche lors de la lecture
}

playPauseBtn.addEventListener('click', togglePlayPause);
videoPlayer.addEventListener('click', togglePlayPause);

function togglePlayPause() {
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
    updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
    playPauseBtn.textContent = videoPlayer.paused ? '▶' : '❚❚';
}

volumeControl.addEventListener('input', () => {
    videoPlayer.volume = volumeControl.value;
    localStorage.setItem('videoVolume', volumeControl.value);
});

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case ' ':
            event.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowRight':
            videoPlayer.currentTime += 5;
            break;
        case 'ArrowLeft':
            videoPlayer.currentTime -= 5;
            break;
        case 'ArrowUp':
            videoPlayer.volume = Math.min(videoPlayer.volume + 0.1, 1);
            volumeControl.value = videoPlayer.volume;
            break;
        case 'ArrowDown':
            videoPlayer.volume = Math.max(videoPlayer.volume - 0.1, 0);
            volumeControl.value = videoPlayer.volume;
            break;
    }
});
window.addEventListener('DOMContentLoaded', async () => {
    const lastOpenedFolder = localStorage.getItem('lastOpenedFolder');
    if (lastOpenedFolder) {
        const result = await window.electronAPI.loadFolder(lastOpenedFolder); // Attendre la promesse
        if (result && result.files.length > 0) {
            loadVideosFromFolder(lastOpenedFolder, result.files);
        }
    }
});

const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

videoPlayer.addEventListener('timeupdate', () => {
    progressBar.max = videoPlayer.duration;
    progressBar.value = videoPlayer.currentTime;
    const currentTime = formatTime(videoPlayer.currentTime);
    const duration = formatTime(videoPlayer.duration);
    timeCode.textContent = `${currentTime} / ${duration}`;
});

progressBar.addEventListener('input', () => {
    videoPlayer.currentTime = progressBar.value;
});

function generateThumbnail(videoPath, imgElement) {
    const tempVideo = document.createElement('video');
    tempVideo.src = videoPath;
    tempVideo.addEventListener('loadeddata', () => {
        tempVideo.currentTime = 2;
    });
    tempVideo.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth / 4;
        canvas.height = tempVideo.videoHeight / 4;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        imgElement.src = canvas.toDataURL();
    });
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function showControls() {
    customControls.classList.remove('fade-out');
    clearTimeout(controlTimer); // S'assurer que l'ancien timer est annulé
    controlTimer = setTimeout(hideControls, 1500); // Ajuster la durée
}

function hideControls() {
    customControls.classList.add('fade-out');
}

document.getElementById('githubBtn').addEventListener('click', () => {
    window.open('https://github.com/Pralexio', '_blank');
});

document.addEventListener('mousemove', () => {
    showControls();
});
