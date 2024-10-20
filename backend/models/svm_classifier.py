import os
import joblib
from sklearn import svm
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
import torch
from utils.data_loader import load_mnist_data

class SVMClassifier:
    def __init__(self, model_path='svm_mnist_model.pkl'):
        self.model_path = model_path
        self.scaler = StandardScaler()
        self.model = svm.SVC(kernel='linear')

        # Load model if it exists
        if os.path.exists(self.model_path):
            print("Loading pre-trained SVM model...")
            self.load_model()
        else:
            print("Training SVM model...")
            self.train()

    def flatten_data(self, loader):
        data, labels = [], []
        for images, targets in loader:
            flattened_images = images.view(images.size(0), -1).numpy()
            data.append(flattened_images)
            labels.append(targets.numpy())

        data = torch.cat([torch.Tensor(batch) for batch in data], dim=0).numpy()
        labels = torch.cat([torch.Tensor(batch) for batch in labels], dim=0).numpy()

        return data, labels

    def train(self):
        train_loader, test_loader = load_mnist_data()

        train_data, train_labels = self.flatten_data(train_loader)
        test_data, test_labels = self.flatten_data(test_loader)

        train_data = self.scaler.fit_transform(train_data)
        test_data = self.scaler.transform(test_data)

        self.model.fit(train_data, train_labels)

        predictions = self.model.predict(test_data)
        accuracy = accuracy_score(test_labels, predictions)
        report = classification_report(test_labels, predictions)
        
        print(f"Accuracy: {accuracy}")
        print(report)

        self.save_model()

        return accuracy, report

    def predict(self, flattened_image):
        transformed_image = self.scaler.transform(flattened_image)
        prediction = self.model.predict(transformed_image)
        return prediction

    def save_model(self):
        with open(self.model_path, 'wb') as model_file:
            joblib.dump({'model': self.model, 'scaler': self.scaler}, model_file)
        print(f"Model saved to {self.model_path}")

    def load_model(self):
        with open(self.model_path, 'rb') as model_file:
            saved_data = joblib.load(model_file)
            self.model = saved_data['model']
            self.scaler = saved_data['scaler']
        print(f"Model loaded from {self.model_path}")
