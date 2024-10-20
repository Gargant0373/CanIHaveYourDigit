import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';

const CanvasWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const CanvasStyled = styled.canvas`
  border: 2px solid #000;
  border-radius: 10px;
  box-shadow: 0px 7px 10px rgba(0, 0, 1, 0.1);
  filter: invert(1);
`;

const Canvas: React.FC<{ onDraw: (imageData: string) => void; onClear: () => void, brushSize: number }> = ({ onDraw, brushSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      context.lineWidth = brushSize;
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
      context.lineWidth = brushSize;
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
      const canvas = canvasRef.current;
      // Ensure that the canvas is not empty
      if (canvas && context.getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0))
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
    </CanvasWrapper>
  );
};

export default Canvas;
