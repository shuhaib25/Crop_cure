from flask import Flask, render_template, request
import numpy as np
import tensorflow as tf
from keras.preprocessing import image
import cv2
import os
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)

# Load the trained model
try:
    cnn = tf.keras.models.load_model('trained_plant_disease_model.keras')
    print("Model loaded successfully.")
except Exception as e:
    print("Error loading model:", e)
    cnn = None

# Define the class names based on your model's training classes
class_name = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Banana Bract Mosaic Virus Disease', 'Banana Insect Pest Disease', 'Banana Moko Disease', 'Banana Panama Disease',
    'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_', 'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
    'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Healthy_Leaf_of_Jackfruit', 'Jackfruit_Algal_Leaf_Spot_of_', 'Jackfruit_Black_Spot_of_',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy',
    'banana_cordana', 'banana_healthy', 'banana_pestalotiopsis', 'banana_sigatoka',
    'mango_Anthracnose-v', 'mango_Bacterial Canker', 'mango_Cutting Weevil', 'mango_Die Back', 'mango_Gall Midge', 'mango_Healthy', 'mango_Powdery Mildew', 'mango_Sooty Mould',
    'sugarcane_Healthy', 'sugarcane_Mosaic', 'sugarcane_RedRot', 'sugarcane_Rust', 'sugarcane_YellowRot'
]

# Ensure the static folder exists
if not os.path.exists('static'):
    os.makedirs('static')

@app.route('/', methods=['GET', 'POST'])
def index():
    try:
        if request.method == 'POST':
            # Get the uploaded image
            file = request.files['image']

            # Validate the file type
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                image_path = os.path.join('static', filename)
                file.save(image_path)

                # Process the image and get the prediction
                img = cv2.imread(image_path)
                if img is None:
                    raise ValueError("Error reading the image.")
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                image_resized = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
                input_arr = tf.keras.preprocessing.image.img_to_array(image_resized)
                input_arr = np.array([input_arr])  # Create a batch
                predictions = cnn.predict(input_arr)
                result_index = np.argmax(predictions[0])
                model_prediction = class_name[result_index]

                # Render the template with the predicted disease in the same page
                return render_template('index.html', image_path=image_path, model_prediction=model_prediction,scroll="about")
            else:
                return render_template('index.html', error="Invalid file type. Please upload an image.", scroll="about")
        
        return render_template('index.html')
    
    except Exception as e:
        print("An error occurred:", e)
        print(traceback.format_exc())
        return "An internal error occurred. Please check the server logs for details."


def allowed_file(filename):
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# for whether
@app.route('/weather')
def weather():
    return render_template('weather_index.html')


if __name__ == '__main__':
    app.run(debug=True)
