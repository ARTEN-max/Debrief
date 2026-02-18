FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including build tools
# gcc/build-essential: needed to compile TTS C extensions (monotonic_align)
# cargo/rustc: needed to compile sudachipy (TTS transitive dep for Japanese)
# libsndfile1/ffmpeg: audio processing
RUN apt-get update && apt-get install -y \
    build-essential \
    cargo \
    rustc \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to ensure prebuilt wheels are used where available
RUN pip install --upgrade pip

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
# This step takes a long time on first build (TTS downloads models, compiles extensions)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Expose port
EXPOSE 8001

# Run the application
CMD ["python", "main.py"]
