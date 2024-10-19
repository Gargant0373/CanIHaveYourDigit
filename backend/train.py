import torch
import torch.optim as optim
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from models.cnn_classifier import CNNModel

batch_size = 64
learning_rate = 0.001
num_epochs = 10
loss_threshold = 0.01

model = CNNModel()

criterion = nn.CrossEntropyLoss() 
optimizer = optim.Adam(model.parameters(), lr=learning_rate)

train_loader = DataLoader(
    datasets.MNIST(
        root='./data', train=True, download=True, transform=transforms.Compose([
            transforms.Resize((28, 28)),
            transforms.Grayscale(num_output_channels=1),
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])
    ),
    batch_size=batch_size, shuffle=True
)

for epoch in range(num_epochs):
    running_loss = 0.0
    for i, (inputs, labels) in enumerate(train_loader):
        optimizer.zero_grad()

        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        if i % 100 == 99:
            avg_loss = running_loss / 100
            print(f'Epoch [{epoch+1}/{num_epochs}], Step [{i+1}/{len(train_loader)}], Loss: {avg_loss:.4f}')
            running_loss = 0.0

            if avg_loss < loss_threshold:
                print(f"Stopping early at epoch {epoch+1}, step {i+1} due to low loss ({avg_loss:.4f})")
                torch.save(model.state_dict(), 'cnn_mnist_model.pth')
                exit()

torch.save(model.state_dict(), 'cnn_mnist_model.pth')
