import React, { useRef, useCallback } from 'react';
import styled from 'styled-components';

const CanvasWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const CanvasStyled = styled.canvas`
    border: 2px solid #000;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const ClearButton = styled.button`
    padding: 10px 20px;
    background-color: #ff6b6b;
    color: white;
    border: none;
    border-radius: 5px;
    margin-top: 20px;
    cursor: pointer;
    &:hover {
        background-color: #ff3b3b;
    }
`;

const Canvas: React.FC<{ onDraw: (imageData: string) => void; onClear: () => void }> = ({ onDraw, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      context.lineWidth = 15;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      isDrawing.current = true;
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context && isDrawing.current) {
      context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      context.stroke();
    }
  };

  const endDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      context.closePath();
      isDrawing.current = false;
      sendCanvasData();
    }
  };

  const sendCanvasData = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 28;
        offscreenCanvas.height = 28;
        const offscreenContext = offscreenCanvas.getContext('2d');
        if (offscreenContext) {
          offscreenContext.drawImage(canvas, 0, 0, 28, 28);
          const resizedImageData = offscreenCanvas.toDataURL('image/png');
          onDraw(resizedImageData);
        }
      }
    }
  }, [onDraw]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas?.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear();
  };

  return (
    <CanvasWrapper>
      <CanvasStyled
        ref={canvasRef}
        width="280"
        height="280"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
      <ClearButton onClick={handleClear}>Clear</ClearButton>
    </CanvasWrapper>
  );
};

export default Canvas;
