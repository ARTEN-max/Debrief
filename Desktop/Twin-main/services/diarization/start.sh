#!/bin/bash
# Start the diarization service

cd "$(dirname "$0")"

echo "🚀 Starting Speaker Diarization Service..."
echo "📍 Location: $(pwd)"
echo ""

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found. Run setup first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check if dependencies are installed
python -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Dependencies not installed. Installing..."
    pip install -r requirements.txt
fi

echo ""
echo "🎤 Starting FastAPI server on port 8001..."
echo "📡 Health check: http://localhost:8001/health"
echo "📚 API docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python main.py
