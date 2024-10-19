import torch
import torch.nn as nn

class CNNModel(nn.Module):
    def __init__(self):
        super(CNNModel, self).__init__()

        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)  # Input: 1x28x28 -> Output: 32x28x28
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)  # Input: 32x28x28 -> Output: 64x28x28
        self.pool = nn.MaxPool2d(2, 2)  # Reduce size by half: 28x28 -> 14x14
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)  # Input: 64x14x14 -> Output: 128x14x14

        # Fully connected layers
        self.fc1 = nn.Linear(128 * 14 * 14, 256)  # Input: 128x14x14 -> Output: 256
        self.fc2 = nn.Linear(256, 10)  # Output: 10 (for digits 0-9)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = torch.relu(self.conv2(x))
        x = self.pool(x)  # Pooling: Reduce size to 14x14
        x = torch.relu(self.conv3(x))

        # Flatten the tensor for the fully connected layers
        x = x.view(-1, 128 * 14 * 14)  # Flatten
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)

        return x
