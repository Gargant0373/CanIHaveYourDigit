from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from PIL import Image
import io
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
import base64
from models.cnn_classifier import CNNModel

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

model = CNNModel()
model.load_state_dict(torch.load('cnn_mnist_model.pth', map_location='cpu'))
model.eval()

transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),
    transforms.ToTensor(),
])

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('draw_data')
def handle_draw_data(data):
    image_data = data['image'].split(',')[1]

    try:
        image = Image.open(io.BytesIO(base64.b64decode(image_data)))
        
        # This bug caused me 2 hours of headaches.
        if image.mode == 'RGBA':
            alpha = image.split()[3]

            image = Image.merge("RGB", (alpha, alpha, alpha))

        transformed_image = transform(image).unsqueeze(0)
        
        if transformed_image.sum() == 0:
            probabilities = [1.0 / 10] * 10
            emit('prediction', {'probabilities': probabilities})
            return

        with torch.no_grad():
            outputs = model(transformed_image)
            probabilities = F.softmax(outputs, dim=1).squeeze().tolist()

        emit('prediction', {'probabilities': probabilities})
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
