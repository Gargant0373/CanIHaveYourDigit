import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Canvas from './components/Canvas';
import styled from 'styled-components';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Footer from './components/Footer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Prediction {
    digit: number;
    probability: string;
}

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #000000, #0b0302);
    flex-direction: column;
    min-height: 100vh;
`;

const CanvasContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const TitleStyled = styled.h1`
    color: #c49300;
    text-align: center;
    margin-bottom: 20px;
    text-shadow: #4f3b00 1px 1px;
    font-family: "IBM Plex Mono", monospace;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #d9d9d9;
  color: #000;
  border: 2px solid #fff;
  border-right-color: #666;
  border-bottom-color: #666;
  border-radius: 0;
  margin-top: 20px;
  font-family: 'MS Sans Serif', sans-serif;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 2px 2px 0px #666, inset -1px -1px 0px #fff;
  transition: all 0.1s ease;

  &:hover {
    background-color: #a8a8a8; /* Darker gray for hover */
  }

  &:active {
    border: 2px solid #666;
    border-right-color: #fff;
    border-bottom-color: #fff;
    box-shadow: none;
    background-color: #c0c0c0;
  }
`;

const ModelSelection = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const ModelButton = styled.button<{ isActive: boolean }>`
  padding: 10px 20px;
  background-color: ${(props) => (props.isActive ? '#c49300' : '#d9d9d9')};
  color: ${(props) => (props.isActive ? '#fff' : '#000')};
  border: 2px solid #fff;
  cursor: pointer;
  font-family: 'MS Sans Serif', sans-serif;
  font-size: 14px;
`;

const BrushSizeIndicator = styled.div<{ size: number; x: number; y: number }>`
  position: absolute;
  z-index: 5;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  border-radius: 50%;
  background-color: #FFF;
  pointer-events: none;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  transform: translate(-50%, -50%);
`;

const App: React.FC = () => {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const socketRef = useRef<any>(null);
    const lastSentRef = useRef<number>(0);
    const [brushSize, setBrushSize] = useState(10);
    const [mousePositionX, setMousePositionX] = useState(0);
    const [mousePositionY, setMousePositionY] = useState(0);
    const [scrolling, setScrolling] = useState(false);
    const [timeoutId, setTimeoutId] = useState<number | null>(null);
    const [model, setModel] = useState<string>('cnn');
    const [canvasData, setCanvasData] = useState<string | null>(null);

    useEffect(() => {
        socketRef.current = io('/');

        socketRef.current.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socketRef.current.on('prediction', (data: { probabilities: number[] }) => {
            const updatedPredictions = data.probabilities
                .map((probability, index) => ({
                    digit: index,
                    probability: (probability * 100).toFixed(2),
                }))
                .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability));

            setPredictions(updatedPredictions);
        });

        clearPredictions();

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const handleDrawData = (imageData: string) => {
        const now = Date.now();
        setCanvasData(imageData);
        lastSentRef.current = now;
        sendCanvasData();
    };

    const sendCanvasData = () => {
        if (canvasData) {
            socketRef.current.emit('draw_data', { image: canvasData, model });
        }
    };

    useEffect(() => {
        if (canvasData) {
            sendCanvasData();
        }
    }, [model]);

    const clearPredictions = () => {
        const equalPredictions = Array.from({ length: 10 }, (_, index) => ({
            digit: index,
            probability: '10.00',
        }));
        setPredictions(equalPredictions);
    };

    const handleMouseWheel = (event: any) => {
        const newSize = Math.max(Math.min(40, brushSize - event.deltaY * 0.05), 10);
        setBrushSize(newSize);
        setScrolling(true);

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        setTimeoutId(setTimeout(() => {
            setScrolling(false);
        }, 1000));
    };

    const chartOptions = {
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: 'IBM Plex Mono',
                        size: 14,
                    }
                }
            },
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        family: 'IBM Plex Mono',
                        size: 12,
                    },
                    autoSkip: false,
                    maxRotation: 90,
                    minRotation: 20,
                    padding: 10,
                }
            },
            y: {
                ticks: {
                    font: {
                        family: 'IBM Plex Mono',
                        size: 10,
                    }
                }
            }
        },
        responsive: true,
    };

    const chartData = {
        labels: predictions.map((prediction) => `Digit ${prediction.digit}`),
        datasets: [
            {
                label: 'Prediction Probability (%)',
                data: predictions.map((prediction) => parseFloat(prediction.probability)),
                backgroundColor: "#c49300",
                borderColor: '#4f3b00',
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container onWheel={(e: any) => handleMouseWheel(e)} onMouseMove={(e: any) => {
            setMousePositionX(e.clientX);
            setMousePositionY(e.clientY);
        }}>
            {scrolling && <BrushSizeIndicator size={brushSize} x={mousePositionX} y={mousePositionY} />}
            <TitleStyled>DRAW A DIGIT</TitleStyled>
            <CanvasContainer>
                <Canvas onDraw={handleDrawData} onClear={clearPredictions} brushSize={brushSize} />
                {predictions.length > 0 && (
                    <div style={{ width: '500px', marginTop: '20px', overflow: 'visible' }}>
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                )}
            </CanvasContainer>

            <ModelSelection>
                <ModelButton isActive={model === 'cnn'} onClick={() => setModel("cnn")}>CNN</ModelButton>
                <ModelButton isActive={model === 'svm'} onClick={() => setModel("svm")}>SVM</ModelButton>
            </ModelSelection>

            <Button onClick={() => window.location.reload()}>Clear All</Button>
            <Footer />
        </Container>
    );
};

export default App;
