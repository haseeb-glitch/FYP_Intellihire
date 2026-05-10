import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Square, Loader2, X } from 'lucide-react';
import { interviewAPI } from '../api/axios';

const VideoRecordingModal = ({ sessionId, questionText, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Initializing camera...');
  const [localTranscript, setLocalTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  const startRecording = async () => {
    if (!streamRef.current) return;
    setStatus('Recording...');
    setIsRecording(true);
    chunksRef.current = [];

    // Local speech recognition (optional)
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

    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      setIsRecording(false);
      setStatus('Uploading...');
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

    try { mr.start(200); } catch (e) { console.error(e); }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Video className="w-5 h-5 text-primary-600" /></div>
            <div>
              <h3 className="text-sm font-black">Record Video Answer</h3>
              <p className="text-xs text-slate-500">{questionText}</p>
            </div>
          </div>
          <button onClick={() => { if (!isRecording) { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); onClose({ cancelled: true }); } }} className="p-2"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4">
          <div className="bg-slate-900 rounded-lg overflow-hidden h-[360px] flex items-center justify-center">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!isRecording && <div className="absolute text-white text-sm">{status}</div>}
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex-1 text-sm text-slate-600">{localTranscript || 'Live transcript will appear here while recording.'}</div>
            <div>
              <button onClick={isRecording ? stopRecording : startRecording} disabled={submitting} className={`px-5 py-2 rounded-xl font-bold ${isRecording ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'}`}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRecording ? <><Square className="w-4 h-4 inline-block" /> Stop Recording</> : <>Start Recording</>)}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoRecordingModal;
