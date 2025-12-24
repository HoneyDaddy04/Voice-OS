
import React, { useState, useRef, useEffect } from 'react';

interface MicButtonProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setTimer(0);
      timerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied or error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 flex flex-col items-center justify-center z-50 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center pointer-events-auto">
        {isRecording && (
          <div className="text-red-500 font-bold mb-2 animate-pulse">
            {formatTime(timer)}
          </div>
        )}
        
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
            ${isRecording ? 'bg-red-500 scale-110' : isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
            text-white shadow-xl relative
          `}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
          ) : isRecording ? (
            <i className="fas fa-stop text-2xl"></i>
          ) : (
            <i className="fas fa-microphone text-3xl"></i>
          )}
          
          {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping"></div>}
        </button>
        
        <p className="mt-3 text-sm text-gray-500 font-medium">
          {isProcessing ? 'Processing Audio...' : isRecording ? 'Tap to Stop' : 'Tap to Speak'}
        </p>
      </div>
    </div>
  );
};
