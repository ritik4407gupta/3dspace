import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { Camera, Minimize2 } from 'lucide-react';
import clsx from 'clsx';

const HandTracker: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  
  const { setHandPosition, setHandDetected } = useStore();

  useEffect(() => {
    const initHandLandmarker = async () => {
      try {
        console.log("Initializing HandLandmarker...");
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
        console.log("HandLandmarker initialized successfully");
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
        setError("Failed to load AI model");
      }
    };

    initHandLandmarker();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const detect = () => {
    if (
      webcamRef.current && 
      webcamRef.current.video && 
      webcamRef.current.video.readyState === 4 &&
      handLandmarkerRef.current
    ) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      // Match canvas size to video
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
        
        // Draw landmarks
        if (ctx && canvas) {
            const drawingUtils = new DrawingUtils(ctx);
            for (const landmarks of result.landmarks) {
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 3
                });
                drawingUtils.drawLandmarks(landmarks, {
                    color: "#FF0000",
                    lineWidth: 2
                });
            }
        }

        // Get the center of the palm (approximate using index finger MCP or wrist)
        const landmark = result.landmarks[0][9];
        
        // Map normalized coordinates (0-1) to 3D space (-1 to 1 range approx)
        // Invert X because webcam is mirrored
        const x = (1 - landmark.x) * 2 - 1; 
        const y = -(landmark.y * 2 - 1); // Invert Y because screen Y is down
        
        // Z is relative depth. 
        const z = landmark.z ? -landmark.z * 10 : 0; 

        // Scale to scene size (approx 20 units wide)
        setHandPosition({ x: x * 10, y: y * 8, z }); 
      } else {
        setHandDetected(false);
        setHandPosition(null);
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
      "fixed z-50 transition-all duration-300 ease-in-out bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl overflow-hidden",
      minimized 
        ? "bottom-4 right-4 w-12 h-12 rounded-full cursor-pointer hover:bg-white/10" 
        : "top-4 right-4 sm:bottom-auto sm:top-4 sm:right-4 w-40 h-32 sm:w-64 sm:h-48 rounded-xl"
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
                {!loaded && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 text-xs z-20 bg-black/90 p-4 text-center">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span>Loading AI Model...</span>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 text-xs z-20 bg-black/90 p-2 text-center">
                        <span>{error}</span>
                        <button onClick={() => window.location.reload()} className="mt-2 underline">Retry</button>
                    </div>
                )}
                
                <Webcam
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover mirror opacity-60"
                    mirrored={true}
                    screenshotFormat="image/jpeg"
                    playsInline={true} // CRITICAL for mobile
                    videoConstraints={{
                        width: 320,
                        height: 240,
                        facingMode: "user"
                    }}
                    onUserMediaError={() => setError("Camera access denied")}
                />
                
                {/* Debug Canvas for Skeleton */}
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover mirror z-10"
                />

                {/* Controls */}
                <div className="absolute top-2 right-2 z-30 flex gap-2">
                    <button 
                        onClick={() => setMinimized(true)}
                        className="p-1 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                    >
                        <Minimize2 size={14} />
                    </button>
                </div>

                <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1 text-[10px] text-white/90 font-mono bg-black/60 px-2 py-0.5 rounded-full">
                    {loaded ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            TRACKING ACTIVE
                        </>
                    ) : "INITIALIZING"}
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default HandTracker;
