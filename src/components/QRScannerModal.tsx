import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // List available cameras
  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          // Prefer environment / back camera on mobile
          const backCam = videoDevices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('sau') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      } catch (err: any) {
        console.error('Camera enumeration error:', err);
      }
    };

    getDevices();
  }, [isOpen]);

  // Start video stream when camera selected or modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(selectedCameraId);

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedCameraId]);

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setErrorMsg('');

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setIsScanning(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Ứng dụng chưa được cấp quyền truy cập Camera. Vui lòng cho phép quyền Camera trên trình duyệt.'
          : 'Không thể khởi động Camera. Vui lòng kiểm tra thiết bị ghi hình hoặc chọn tải ảnh.'
      );
    }
  };

  const startScanningLoop = () => {
    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code && code.data && code.data.trim()) {
            // Successfully detected QR code!
            stopCamera();
            onScanSuccess(code.data.trim());
            onClose();
            return;
          }
        }
      }

      animFrameId.current = requestAnimationFrame(scanFrame);
    };

    animFrameId.current = requestAnimationFrame(scanFrame);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#005993] text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#7ED3F7]" />
            <h3 className="font-bold text-lg">Quét mã QR Giấy chứng nhận</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                <p className="mt-1 text-xs text-red-600">
                  Bạn có thể chọn chụp ảnh mã QR rồi sử dụng tính năng "Tải ảnh lên" ở màn hình chính.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera selection dropdown if multiple cameras */}
              {cameras.length > 1 && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600 font-medium">Chọn Camera:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-[#005993] focus:outline-none max-w-[240px] truncate"
                  >
                    {cameras.map((cam, idx) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Viewfinder with scan region */}
              <div className="relative aspect-square max-h-[340px] mx-auto rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-slate-300 shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/4 h-3/4 border-2 border-dashed border-[#7ED3F7] rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#005993] rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#005993] rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#005993] rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#005993] rounded-br" />

                    {/* Laser scanning line */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D71249] to-transparent animate-pulse shadow-[0_0_8px_#D71249] top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>

                {/* Loading indicator */}
                {!isScanning && !errorMsg && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-2 text-sm">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#7ED3F7]" />
                    <span>Đang khởi động máy ảnh...</span>
                  </div>
                )}
              </div>

              {/* Instruction */}
              <div className="text-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Hướng dẫn:</span> Hướng camera về phía mã QR ở góc phải phôi Giấy chứng nhận quyền sử dụng đất. Hệ thống sẽ tự động quét và truy xuất hồ sơ.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
