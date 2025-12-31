import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { Camera, Minimize2, AlertCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import * as THREE from 'three';

const HandTracker: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing AI...");
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  
  // Smoothing refs
  const smoothScale = useRef(1);
  const smoothRot = useRef(0);
  
  const { setHandPosition, setHandDetected, setGestureState } = useStore();

  const initHandLandmarker = async () => {
    try {
      setStatus("Loading Model...");
      setError(null);
      
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      setLoaded(true);
      setStatus("Waiting for Camera...");
    } catch (error) {
      console.error("Error initializing hand landmarker:", error);
      setError("Failed to load AI model.");
    }
  };

  useEffect(() => {
    initHandLandmarker();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const detect = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    if (
      webcamRef.current && 
      webcamRef.current.video && 
      webcamRef.current.video.readyState >= 2 && 
      handLandmarkerRef.current
    ) {
      if (status !== "TRACKING ACTIVE") setStatus("TRACKING ACTIVE");

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      if (canvas) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
      }

      const startTimeMs = performance.now();
      const result = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (result.landmarks && result.landmarks.length > 0) {
        setHandDetected(true);
        const landmarks = result.landmarks[0];
        
        // Draw Skeleton
        if (ctx && canvas) {
            const drawingUtils = new DrawingUtils(ctx);
            for (const lm of result.landmarks) {
                drawingUtils.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 4
                });
                drawingUtils.drawLandmarks(lm, {
                    color: "#FF0000",
                    lineWidth: 2,
                    radius: 3
                });
            }
        }

        // --- POSITION TRACKING ---
        const indexTip = landmarks[8];
        const x = (1 - indexTip.x) * 20 - 10; 
        const y = -(indexTip.y * 14 - 7); 
        const z = 0; 
        setHandPosition({ x, y, z }); 

        // --- ADVANCED GESTURE TRACKING ---
        
        // 1. NORMALIZED PINCH (Scale)
        // We normalize the pinch distance by the hand size (Wrist to Middle Finger MCP)
        // This ensures gestures work at any distance from the camera.
        const wrist = landmarks[0];
        const middleMCP = landmarks[9];
        const handSize = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y) || 0.1; // Avoid div by zero

        const thumbTip = landmarks[4];
        const rawPinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const normalizedPinch = rawPinch / handSize;

        // Thresholds based on normalized values
        // < 0.3 is typically a pinch
        // > 0.8 is typically open
        let targetScale = 1;
        if (normalizedPinch < 0.3) targetScale = 0.5; // Shrink
        else if (normalizedPinch > 0.8) targetScale = 1.3; // Expand
        else {
            // Map 0.3 -> 0.8 to 0.5 -> 1.3
            const t = (normalizedPinch - 0.3) / 0.5;
            targetScale = 0.5 + t * 0.8;
        }

        // 2. ROTATION (Roll)
        // Angle between Index MCP (5) and Pinky MCP (17)
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];
        const rawRotation = Math.atan2(
            (indexMCP.y - pinkyMCP.y), 
            (indexMCP.x - pinkyMCP.x)
        );
        
        // Offset by PI to align "flat hand" with 0 rotation if needed, 
        // but raw atan2 is usually fine for relative rotation.
        // Inverting because webcam is mirrored.
        const targetRot = -rawRotation;

        // 3. SMOOTHING (LERP)
        // This is critical for "clear" gestures. It removes jitter.
        smoothScale.current = THREE.MathUtils.lerp(smoothScale.current, targetScale, 0.1);
        smoothRot.current = THREE.MathUtils.lerp(smoothRot.current, targetRot, 0.1);

        setGestureState(smoothScale.current, smoothRot.current);

      } else {
        setHandDetected(false);
        setHandPosition(null);
        // Slowly reset gestures
        smoothScale.current = THREE.MathUtils.lerp(smoothScale.current, 1, 0.05);
        smoothRot.current = THREE.MathUtils.lerp(smoothRot.current, 0, 0.05);
        setGestureState(smoothScale.current, smoothRot.current);
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    if (loaded) {
      detect();
    }
  }, [loaded]);

  return (
    <div className={clsx(
      "fixed z-[100] transition-all duration-300 ease-in-out bg-black/90 border border-white/20 backdrop-blur-md shadow-2xl overflow-hidden",
      minimized 
        ? "top-4 right-4 w-12 h-12 rounded-full cursor-pointer hover:bg-white/10" 
        : "top-4 right-4 w-48 h-36 sm:w-72 sm:h-56 rounded-xl"
    )}>
      {minimized ? (
        <button 
            onClick={() => setMinimized(false)} 
            className="w-full h-full flex items-center justify-center text-cyan-400"
        >
            <Camera size={20} />
        </button>
      ) : (
        <>
            <div className="relative w-full h-full">
                {/* Status Overlay */}
                {!loaded || error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 text-xs z-20 bg-black/90 p-4 text-center">
                        {error ? (
                            <>
                                <AlertCircle className="text-red-500 mb-2" size={24} />
                                <span className="text-red-400 mb-2">{error}</span>
                                <button 
                                  onClick={() => initHandLandmarker()}
                                  className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full hover:bg-white/20"
                                >
                                  <RefreshCw size={12} /> Retry
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span>{status}</span>
                            </>
                        )}
                    </div>
                ) : null}
                
                <Webcam
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover mirror opacity-60"
                    mirrored={true}
                    screenshotFormat="image/jpeg"
                    playsInline={true}
                    videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                    }}
                    onUserMediaError={() => setError("Camera access denied")}
                />
                
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover mirror z-10"
                />

                <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 to-transparent">
                    <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider flex items-center gap-1">
                        <div className={clsx("w-2 h-2 rounded-full", status === "TRACKING ACTIVE" ? "bg-green-500 animate-pulse" : "bg-yellow-500")} />
                        {status === "TRACKING ACTIVE" ? "Active" : "Init..."}
                    </span>
                    <button 
                        onClick={() => setMinimized(true)}
                        className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <Minimize2 size={12} />
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default HandTracker;
