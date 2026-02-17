import { NextResponse } from 'next/server';

const pillHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debrief</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      background: transparent;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .container {
      display: flex;
      justify-content: center;
      padding: 8px;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 8px 6px 14px;
      background: linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 100px;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.08),
        0 4px 24px rgba(0, 0, 0, 0.4),
        0 1px 2px rgba(0, 0, 0, 0.2);
      cursor: grab;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pill:hover {
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.12),
        0 8px 32px rgba(0, 0, 0, 0.5),
        0 2px 4px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
    }

    .pill:active {
      cursor: grabbing;
      transform: scale(0.98);
    }

    .pill.recording {
      background: linear-gradient(135deg, rgba(30, 10, 10, 0.98) 0%, rgba(40, 15, 15, 0.98) 100%);
      box-shadow:
        0 0 0 1px rgba(239, 68, 68, 0.3),
        0 4px 24px rgba(239, 68, 68, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo svg {
      width: 12px;
      height: 12px;
      fill: white;
    }

    .title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: -0.01em;
    }

    .divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
    }

    .timer {
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      font-variant-numeric: tabular-nums;
      min-width: 42px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .timer.active {
      color: #ef4444;
    }

    .timer.hidden {
      display: none;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .record-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      position: relative;
      z-index: 10;
    }

    .record-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .record-btn:active {
      transform: scale(0.95);
    }

    .record-btn.recording {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      animation: pulse-recording 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .record-btn.recording:hover {
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
    }

    .record-btn svg {
      width: 14px;
      height: 14px;
      fill: white;
      transition: all 0.2s ease;
      pointer-events: none;
    }

    .record-btn.recording svg {
      width: 12px;
      height: 12px;
    }

    @keyframes pulse-recording {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      }
      50% {
        box-shadow: 0 2px 16px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0.1);
      }
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .status-dot.recording {
      background: #ef4444;
      animation: blink 1s ease-in-out infinite;
    }

    .status-dot.uploading {
      background: #f59e0b;
      animation: blink 0.4s ease-in-out infinite;
    }

    .status-dot.complete {
      background: #10b981;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .close-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.2s ease;
      margin-left: -4px;
      position: relative;
      z-index: 10;
    }

    .pill:hover .close-btn {
      opacity: 0.5;
    }

    .close-btn:hover {
      opacity: 1 !important;
      background: rgba(255, 255, 255, 0.1);
    }

    .close-btn svg {
      width: 12px;
      height: 12px;
      stroke: rgba(255, 255, 255, 0.8);
      stroke-width: 2;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="pill" id="pill">
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          </svg>
        </div>
        <span class="title">Debrief</span>
      </div>

      <div class="divider"></div>

      <span class="timer hidden" id="timer">00:00</span>
      <div class="status-dot" id="status"></div>

      <div class="controls">
        <button class="record-btn" id="recordBtn" title="Start Recording" type="button">
          <svg id="micIcon" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          <svg id="stopIcon" viewBox="0 0 24 24" style="display: none;">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        </button>

        <button class="close-btn" id="closeBtn" title="Close" type="button">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <script>
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Pill loaded');

      const pill = document.getElementById('pill');
      const recordBtn = document.getElementById('recordBtn');
      const micIcon = document.getElementById('micIcon');
      const stopIcon = document.getElementById('stopIcon');
      const timer = document.getElementById('timer');
      const status = document.getElementById('status');
      const closeBtn = document.getElementById('closeBtn');

      let isRecording = false;
      let startTime = null;
      let timerInterval = null;
      let mediaRecorder = null;
      let audioChunks = [];

      // Check if Tauri API is available
      const isTauri = typeof window.__TAURI__ !== 'undefined';
      console.log('Is Tauri:', isTauri);

      // Listen for toggle-recording event from global shortcut (Cmd+Shift+R)
      if (isTauri && window.__TAURI__.event) {
        window.__TAURI__.event.listen('toggle-recording', function() {
          console.log('Toggle recording triggered via shortcut');
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        });
        console.log('Listening for toggle-recording event');
      }

      // Make pill draggable
      pill.addEventListener('mousedown', async function(e) {
        // Don't drag if clicking a button
        if (e.target.closest('button')) {
          return;
        }
        if (isTauri && window.__TAURI__.window) {
          try {
            const win = window.__TAURI__.window.getCurrentWindow();
            await win.startDragging();
          } catch (err) {
            console.error('Drag error:', err);
          }
        }
      });

      // Close button
      closeBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close clicked');
        if (isTauri && window.__TAURI__.window) {
          try {
            const win = window.__TAURI__.window.getCurrentWindow();
            await win.hide();
          } catch (err) {
            console.error('Hide error:', err);
          }
        }
      });

      function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      }

      function updateTimer() {
        if (startTime) {
          const elapsed = Date.now() - startTime;
          timer.textContent = formatTime(elapsed);
        }
      }

      async function startRecording() {
        console.log('Starting recording...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Got audio stream');

          const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
          ];

          let mimeType = '';
          for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
              mimeType = type;
              break;
            }
          }
          console.log('Using mime type:', mimeType);

          mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType: mimeType } : {});
          audioChunks = [];

          mediaRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) {
              audioChunks.push(e.data);
              console.log('Audio chunk:', e.data.size);
            }
          };

          mediaRecorder.onstop = async function() {
            console.log('=== ONSTOP FIRED ===');
            console.log('Recording stopped, chunks:', audioChunks.length);

            try {
              stream.getTracks().forEach(function(track) { track.stop(); });

              if (audioChunks.length > 0) {
                console.log('Creating blob from chunks...');
                const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                console.log('Blob created, size:', blob.size, 'type:', blob.type);
                console.log('Calling uploadRecording...');
                await uploadRecording(blob, mediaRecorder.mimeType);
              } else {
                console.error('No audio chunks recorded!');
                alert('No audio was recorded. Please try again.');
              }
            } catch (err) {
              console.error('=== ONSTOP ERROR ===');
              console.error('Error in onstop:', err);
              alert('Recording error: ' + err.message);
            }
          };

          mediaRecorder.start(1000);
          isRecording = true;
          startTime = Date.now();

          // Update UI
          pill.classList.add('recording');
          recordBtn.classList.add('recording');
          micIcon.style.display = 'none';
          stopIcon.style.display = 'block';
          timer.classList.remove('hidden');
          timer.classList.add('active');
          status.classList.add('recording');

          timerInterval = setInterval(updateTimer, 100);
          updateTimer();

          console.log('Recording started');
        } catch (err) {
          console.error('Failed to start recording:', err);
          alert('Could not access microphone: ' + err.message);
        }
      }

      async function stopRecording() {
        console.log('=== STOP RECORDING CALLED ===');
        console.log('mediaRecorder state:', mediaRecorder ? mediaRecorder.state : 'null');
        console.log('audioChunks length:', audioChunks.length);

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          console.log('Calling mediaRecorder.stop()...');
          mediaRecorder.stop();
          console.log('mediaRecorder.stop() called');
        } else {
          console.log('MediaRecorder not active, state:', mediaRecorder ? mediaRecorder.state : 'null');
        }

        isRecording = false;
        clearInterval(timerInterval);

        pill.classList.remove('recording');
        recordBtn.classList.remove('recording');
        micIcon.style.display = 'block';
        stopIcon.style.display = 'none';
        timer.classList.remove('active');
        timer.textContent = 'Processing...';
        status.classList.remove('recording');
        status.classList.add('uploading');

        console.log('UI updated, waiting for onstop callback...');
      }

      async function uploadRecording(blob, mimeType) {
        console.log('=== UPLOAD START ===');
        console.log('Blob size:', blob.size, 'bytes');
        console.log('Blob type:', blob.type);
        console.log('MimeType param:', mimeType);

        // Show upload status on pill
        timer.textContent = 'Upload...';
        timer.classList.remove('hidden');

        try {
          const baseMime = mimeType.split(';')[0];
          console.log('Base mime:', baseMime);

          const ext = baseMime === 'audio/webm' ? 'webm' : baseMime === 'audio/mp4' ? 'm4a' : 'webm';
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
          const filename = 'recording-' + timestamp + '.' + ext;
          const title = 'Recording ' + new Date().toLocaleString();

          const userId = '91b4d85d-1b51-4a7b-8470-818b75979913';
          const apiBase = 'http://localhost:3001';

          console.log('Step 1: Creating recording entry...');
          timer.textContent = 'Create...';

          const createRes = await fetch(apiBase + '/api/recordings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
            body: JSON.stringify({ title: title, mode: 'general', mimeType: baseMime }),
          });

          console.log('Create response status:', createRes.status);
          if (!createRes.ok) {
            const errText = await createRes.text();
            console.error('Create failed:', errText);
            throw new Error('Failed to create recording: ' + createRes.status + ' - ' + errText);
          }

          const data = await createRes.json();
          const recordingId = data.data.recordingId;
          console.log('Recording created:', recordingId);

          console.log('Step 2: Uploading audio blob...');
          timer.textContent = 'Sending...';

          console.log('Upload URL:', apiBase + '/api/recordings/' + recordingId + '/upload');
          console.log('Content-Type:', baseMime);
          console.log('Blob size for upload:', blob.size);

          // Convert blob to ArrayBuffer for more reliable transfer
          const arrayBuffer = await blob.arrayBuffer();
          console.log('ArrayBuffer size:', arrayBuffer.byteLength);

          const uploadRes = await fetch(apiBase + '/api/recordings/' + recordingId + '/upload', {
            method: 'POST',
            body: arrayBuffer,
            headers: {
              'Content-Type': baseMime,
              'x-user-id': userId
            },
          });

          console.log('Upload response status:', uploadRes.status);

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error('Upload response error:', errText);
            throw new Error('Upload failed: ' + uploadRes.status + ' - ' + errText);
          }

          const uploadData = await uploadRes.json();
          console.log('Upload response:', uploadData);
          console.log('=== UPLOAD SUCCESS ===');

          status.classList.remove('uploading');
          status.classList.add('complete');
          timer.textContent = 'Done!';

          setTimeout(function() {
            timer.classList.add('hidden');
            timer.textContent = '00:00';
            status.classList.remove('complete');
          }, 2000);

        } catch (err) {
          console.error('=== UPLOAD ERROR ===');
          console.error('Error name:', err.name);
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);

          status.classList.remove('uploading');
          timer.textContent = 'ERROR';
          timer.style.color = '#ef4444';

          // Keep error visible longer
          setTimeout(function() {
            timer.classList.add('hidden');
            timer.textContent = '00:00';
            timer.style.color = '';
          }, 5000);

          // Also show alert
          alert('Upload failed: ' + err.message);
        }
      }

      // Record button click handler
      recordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Record button clicked, isRecording:', isRecording);
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      });

      console.log('Pill initialized');
    });
  </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(pillHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
