import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Square, Loader2, X } from 'lucide-react';
import { interviewAPI } from '../api/axios';
import { cn } from '../lib/utils';

const MetricBar = ({ label, value, inverse = false }) => {
  const percentage = Math.min(100, Math.max(0, value || 0));
  const bgColor = !inverse
    ? percentage > 70 ? 'bg-red-500' : percentage > 40 ? 'bg-amber-500' : 'bg-emerald-500'
    : percentage > 70 ? 'bg-emerald-500' : percentage > 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</span>
        <span className="text-[10px] font-bold text-slate-500">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div className={`h-full ${bgColor} rounded-full`} animate={{ width: `${percentage}%` }} transition={{ duration: 0.3 }} />
      </div>
    </div>
  );
};

const VideoRecordingModal = ({ sessionId, questionText, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const frameTimerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Initializing camera...');
  const [localTranscript, setLocalTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [videoStats, setVideoStats] = useState({
    emotion: 'neutral',
    stress_score: 0,
    blink_total: 0,
    blink_bpm: 0,
    emotion_stress: 0,
    gaze_score: 0,
    posture_score: 0,
    emotion_probs: {},
    face_detected: false,
  });

  useEffect(() => {
    const openCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280 }, audio: true });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          try { await videoRef.current.play(); } catch (e) { }
        }
        setStatus('Ready to record');
      } catch (err) {
        console.error('Camera open failed', err);
        setStatus('Camera access denied');
      }
    };
    openCamera();

    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  const startRecording = async () => {
    if (!streamRef.current) return;
    setStatus('Recording...');
    
    try {
      // Initialize video session on backend to enable frame streaming
      await interviewAPI.startVideoSession(sessionId);
    } catch (err) {
      console.error('Failed to start video session:', err);
      setStatus('Failed to start session');
      return;
    }
    
    setIsRecording(true);
    chunksRef.current = [];

    // Local speech recognition for transcript backup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      let finalTranscript = '';
      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
          else interim += event.results[i][0].transcript;
        }
        setLocalTranscript((finalTranscript + interim).trim());
      };
      rec.onend = () => { if (isRecording) try { rec.start(); } catch (e) {} };
      try { rec.start(); recognitionRef.current = rec; } catch (e) { }
    }

    // Setup MediaRecorder for video + audio
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      setIsRecording(false);
      setStatus('Uploading...');
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      
      // Submit complete video blob
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'answer.webm');
      if (localTranscript) formData.append('answer', localTranscript);

      setSubmitting(true);
      try {
        const res = await interviewAPI.submitVideoAnswer(sessionId, formData);
        onClose(res.data);
      } catch (err) {
        console.error('Video submit failed', err);
        onClose({ error: 'Upload failed' });
      } finally {
        setSubmitting(false);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      }
    };

    // Start frame-by-frame analysis for real-time metrics
    const captureAndAnalyzeFrame = async () => {
      if (!videoRef.current) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append('frame', blob, 'frame.jpg');
          try {
            const res = await interviewAPI.sendVideoFrame(sessionId, formData);
            if (res.data.stats) {
              setVideoStats(res.data.stats);
            }
          } catch (err) {
            console.error('Frame analysis error:', err);
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error('Frame capture error:', err);
      }
    };

    // Send frames every 500ms for real-time analysis
    frameTimerRef.current = setInterval(captureAndAnalyzeFrame, 500);

    try { mr.start(200); } catch (e) { console.error(e); }
  };

  const stopRecording = () => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-5xl h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shadow-sm">
              <Video className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Record Video Answer</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{questionText}</p>
            </div>
          </div>
          <button 
            onClick={() => { if (!isRecording) { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); onClose({ cancelled: true }); } }} 
            disabled={isRecording}
            className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video + Transcript Section */}
          <div className="flex-1 flex flex-col bg-slate-900 relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            
            {!isRecording && (
              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <p className="text-base font-black text-white uppercase tracking-widest">{status}</p>
              </div>
            )}

            {isRecording && (
              <div className="absolute left-4 right-4 bottom-4">
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Live Transcript</span>
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", isRecording ? "bg-red-500" : "bg-slate-400")} />
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed min-h-12">
                    {localTranscript || 'Listening...'}
                  </p>
                </div>
              </div>
            )}

            {/* Emotion Badge */}
            {isRecording && (
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  {videoStats?.emotion || 'Neutral'}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  Stress: {Math.round(videoStats?.stress_score ?? 0)}%
                </span>
              </div>
            )}
          </div>

          {/* Metrics Panel */}
          {isRecording && (
            <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto custom-scrollbar p-5 space-y-5">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Blinks</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{videoStats?.blink_total ?? 0}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">{videoStats?.blink_bpm ?? 0}/min</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Stress</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{Math.round(videoStats?.stress_score ?? 0)}%</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Overall</p>
                </div>
              </div>

              {/* Metric Bars */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <MetricBar label="Emotion Stress" value={videoStats?.emotion_stress ?? 0} inverse />
                <MetricBar label="Gaze Focus" value={videoStats?.gaze_score ?? 0} />
                <MetricBar label="Posture" value={videoStats?.posture_score ?? 0} />
                <MetricBar label="Overall Stress" value={videoStats?.stress_score ?? 0} inverse />
              </div>

              {/* Emotion Distribution */}
              {Object.keys(videoStats?.emotion_probs || {}).length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 mb-3">Emotion Meter</h4>
                  <div className="space-y-2">
                    {Object.entries(videoStats.emotion_probs || {}).map(([emotion, prob]) => (
                      <div key={emotion} className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-500 capitalize w-12">{emotion}</span>
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary-500 rounded-full" 
                            animate={{ width: `${(prob || 0) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 w-8 text-right">{Math.round((prob || 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="pt-3 border-t border-slate-200 rounded-lg bg-slate-50 p-3">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 mb-2">Status</h4>
                <div className="space-y-1 text-[9px] font-bold text-slate-600">
                  <p>Face: {videoStats?.face_detected ? '✓ Detected' : '⚠ Searching'}</p>
                  {videoStats?.head_pose && (
                    <p>Head Pose: P{videoStats.head_pose[0]} Y{videoStats.head_pose[1]} R{videoStats.head_pose[2]}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Controls */}
        <div className="p-4 bg-gradient-to-t from-slate-50 to-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex-1">
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">Recording in progress...</span>
              </div>
            )}
          </div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={submitting}
            className={cn(
              "px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg",
              isRecording 
                ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30" 
                : "bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/30"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : isRecording ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                Stop Recording
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Start Recording
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoRecordingModal;
