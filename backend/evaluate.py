import torch
from models.cnn_classifier import CNNModel 
from utils.data_loader import load_mnist_data

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

_, test_loader = load_mnist_data(batch_size=32)

model = CNNModel().to(device)
model.load_state_dict(torch.load('cnn_mnist_model.pth'))
model.eval()

correct = 0
total = 0

with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.to(device)

        # Forward pass
        outputs = model(images)
        _, predicted = torch.max(outputs, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

accuracy = correct / total * 100
print(f'Accuracy on the test set: {accuracy:.2f}%')
