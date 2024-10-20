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

const OverlayCanvasStyled = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 10px;
  pointer-events: none; /* Allows mouse events to pass through */
`;

interface CanvasProps {
  onDraw: (imageData: string) => void;
  onClear: () => void;
  brushSize: number;
}

const Canvas: React.FC<CanvasProps> = ({ onDraw, brushSize }) => {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      isDrawing.current = true;

      // Clear when new drawing
      clearOverlay();
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (context && isDrawing.current) {
      context.lineWidth = brushSize;
      context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      context.stroke();
    }
  };

  const endDrawing = () => {
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (context && canvas) {
      context.closePath();
      isDrawing.current = false;

      // Check if the canvas is not empty
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const isNotEmpty = imageData.data.some(channel => channel !== 0);

      if (isNotEmpty) {
        const { boundingBox } = calculateBoundingBox(imageData, 10);
        drawBoundingBox(boundingBox);
        sendCanvasData(boundingBox);
      } else {
        clearOverlay();
      }
    }
  };

  const calculateBoundingBox = (imageData: ImageData, padding: number) => {
    const { width, height, data } = imageData;
    let top = height, left = width, right = 0, bottom = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 0) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }

    left = Math.max(left - padding, 0);
    right = Math.min(right + padding, width);
    top = Math.max(top - padding, 0);
    bottom = Math.min(bottom + padding, height);

    const boxWidth = right - left;
    const boxHeight = bottom - top;
    const size = Math.max(boxWidth, boxHeight);

    let newLeft = left;
    let newTop = top;

    if (boxWidth < size) {
      const extra = size - boxWidth;
      newLeft = Math.max(left - extra / 2, 0);
      if (newLeft + size > width) {
        newLeft = width - size;
      }
    }

    if (boxHeight < size) {
      const extra = size - boxHeight;
      newTop = Math.max(top - extra / 2, 0);
      if (newTop + size > height) {
        newTop = height - size;
      }
    }

    // Final bounding box coordinates
    const finalLeft = Math.floor(newLeft);
    const finalTop = Math.floor(newTop);
    const finalRight = Math.floor(Math.min(finalLeft + size, width));
    const finalBottom = Math.floor(Math.min(finalTop + size, height));

    const boundingBox = { left: finalLeft, top: finalTop, right: finalRight, bottom: finalBottom };

    return { boundingBox };
  };

  const drawBoundingBox = (box: { left: number; top: number; right: number; bottom: number }) => {
    const overlayCanvas = overlayCanvasRef.current;
    const context = overlayCanvas?.getContext('2d');
    if (context && overlayCanvas) {
      context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.beginPath();
      context.rect(box.left, box.top, box.right - box.left, box.bottom - box.top);
      context.stroke();
    }
  };

  const clearOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    const context = overlayCanvas?.getContext('2d');
    if (context && overlayCanvas) {
      context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
  };

  const sendCanvasData = useCallback(
    (box: { left: number; top: number; right: number; bottom: number }) => {
      const drawingCanvas = drawingCanvasRef.current;
      if (drawingCanvas) {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenContext = offscreenCanvas.getContext('2d');

        if (offscreenContext) {
          const boxWidth = box.right - box.left;
          const boxHeight = box.bottom - box.top;

          offscreenCanvas.width = 28;
          offscreenCanvas.height = 28;

          offscreenContext.drawImage(
            drawingCanvas,
            box.left,
            box.top,
            boxWidth,
            boxHeight,
            0,
            0,
            28,
            28
          );

          const resizedImageData = offscreenCanvas.toDataURL('image/png');
          onDraw(resizedImageData);
        }
      }
    },
    [onDraw]
  );

  return (
    <CanvasWrapper>
      <CanvasStyled
        ref={drawingCanvasRef}
        width={280}
        height={280}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
      <OverlayCanvasStyled
        ref={overlayCanvasRef}
        width={280}
        height={280}
      />
    </CanvasWrapper>
  );
};

export default Canvas;
