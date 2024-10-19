import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Canvas from './components/Canvas';
import styled from 'styled-components';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Prediction {
    digit: number;
    probability: string;
}

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #74ebd5, #ACB6E5);
    flex-direction: column;
`;

const CanvasContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const TitleStyled = styled.h1`
    color: white;
    text-align: center;
    margin-bottom: 20px;
`;

const Button = styled.button`
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    margin-top: 20px;
    cursor: pointer;
    &:hover {
        background-color: #0056b3;
    }
`;

const App: React.FC = () => {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const socketRef = useRef<any>(null);
    const lastSentRef = useRef<number>(0);

    useEffect(() => {
        socketRef.current = io('http://localhost:5000');

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

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const handleDrawData = (imageData: string) => {
        const now = Date.now();
        if (now - lastSentRef.current > 1000) {
            socketRef.current.emit('draw_data', { image: imageData });
            lastSentRef.current = now;
        }
    };

    const clearPredictions = () => {
        const equalPredictions = Array.from({ length: 10 }, (_, index) => ({
            digit: index,
            probability: '10.00', 
        }));
        setPredictions(equalPredictions);
    };

    const chartData = {
        labels: predictions.map((prediction) => `Digit ${prediction.digit}`),
        datasets: [
            {
                label: 'Prediction Probability (%)',
                data: predictions.map((prediction) => parseFloat(prediction.probability)),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container>
            <TitleStyled>Draw a Digit</TitleStyled>
            <CanvasContainer>
                <Canvas onDraw={handleDrawData} onClear={clearPredictions} />

                {predictions.length > 0 && (
                    <div style={{ width: '500px', marginTop: '20px' }}>
                        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                )}
            </CanvasContainer>
            <Button onClick={() => window.location.reload()}>Clear All</Button>
        </Container>
    );
};

export default App;
