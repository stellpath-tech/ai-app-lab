// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// Licensed under the 【火山方舟】原型应用软件自用许可协议
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at 
//     https://www.volcengine.com/docs/82379/1433703
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

import { ScreenHeight, ScreenWidth } from '@/const';
import { canvasHelper } from '@/utils/canvasDrawHelper';
import { RefObject, useRef } from 'react';

export const useFrameCapture = (
  videoRef: RefObject<HTMLVideoElement>,
  onFrameCap: (base64data: string) => void,
  mode: 'free' | 'quick' = 'free',
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intervalIdRef = useRef<number | null>(null);
  
  // 快速应答模式相关状态
  const isQuickModeRef = useRef(mode === 'quick');
  const isSpeakingRef = useRef(false);
  const frameCountRef = useRef(0);
  const maxFramesRef = useRef(3);
  const hasStartedSpeakingRef = useRef(false); // 标记是否已经开始说话
  
  // 更新模式状态
  isQuickModeRef.current = mode === 'quick';

  const capture = () => {
    let dataURL = '';
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      //
      canvas.width = ScreenWidth;
      canvas.height = ScreenHeight;

      const ctx = canvas.getContext('2d');

      if (ctx) {
        const [sx, sy, sw, sh] = canvasHelper.aspectFill(
          video.videoWidth,
          video.videoHeight,
          ScreenWidth,
          ScreenHeight,
        );
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, ScreenWidth, ScreenHeight); // 相当于 object-fit: cover
        dataURL = canvas.toDataURL('image/png');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    return dataURL;
  };
  const captureFrame = () => {
    // 快速应答模式：只有在说话时才捕获，且累计不超过3张
    if (isQuickModeRef.current) {
      if (!isSpeakingRef.current || frameCountRef.current >= maxFramesRef.current) {
        return;
      }
      frameCountRef.current++;
    }
    
    const dataURL = capture();
    if (dataURL) {
      onFrameCap(dataURL);
    }
  };

  const startCapture = () => {
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    intervalIdRef.current = window.setInterval(captureFrame, 1000);
  };

  const stopCapture = () => {
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
    }
  };

  // 快速应答模式控制函数
  const startSpeaking = () => {
    if (isQuickModeRef.current && !hasStartedSpeakingRef.current) {
      frameCountRef.current = 0; // 重置计数
      isSpeakingRef.current = true;
      hasStartedSpeakingRef.current = true; // 标记已经开始说话
      // 立即捕获第一张图片
      captureFrame();
    }
  };

  const stopSpeaking = () => {
    if (isQuickModeRef.current) {
      isSpeakingRef.current = false;
      hasStartedSpeakingRef.current = false; // 重置开始说话标记
    }
  };

  const setMode = (newMode: 'free' | 'quick') => {
    isQuickModeRef.current = newMode === 'quick';
    if (newMode === 'quick') {
      frameCountRef.current = 0;
      isSpeakingRef.current = false;
      hasStartedSpeakingRef.current = false; // 重置开始说话标记
    }
  };

  return { 
    canvasRef, 
    startCapture, 
    stopCapture, 
    capture,
    startSpeaking,
    stopSpeaking,
    setMode
  };
};
