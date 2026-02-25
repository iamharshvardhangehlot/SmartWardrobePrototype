import os

import cv2
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
from transformers import pipeline

# --- 1. SETUP THE AI MODELS ---
# We use a "Zero-Shot Image Classification" model. 
# It lets us define any categories we want on the fly.
classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")

def get_dominant_color_hex(image_path):
    """
    Standard K-Means to find the main color hex code.
    """
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Crop center to avoid background
    h, w, _ = image.shape
    center_img = image[int(h*0.3):int(h*0.7), int(w*0.3):int(w*0.7)]
    pixels = center_img.reshape((-1, 3))
    
    kmeans = KMeans(n_clusters=1, n_init='auto')
    kmeans.fit(pixels)
    color = kmeans.cluster_centers_[0].astype(int)
    return "#{:02x}{:02x}{:02x}".format(*color)

def analyze_garment(image_path):
    """
    Uses OpenAI CLIP to detect Category and Pattern with high accuracy.
    """
    # 1. Load Image for AI
    image = Image.open(image_path)
    
# ... inside analyze_garment function ...

    # 2. DEFINE LABELS (Updated for better accuracy)
    candidate_categories = [
        "T-Shirt", "Shirt", "Jeans", "Trousers", 
        "Blazer", "Jacket", "Shorts", "Pajama", "Skirt"
    ]
    
    # NEW: We added "Pattern" and "Print" to force it to ignore folds/wrinkles
    candidate_patterns = [
        "Plain Solid Color Fabric", 
        "Vertical Striped Pattern", 
        "Horizontal Striped Pattern", 
        "Plaid Checkered Pattern", 
        "Graphic Print Logo", 
        "Floral Pattern"
    ]
    
    # ... (rest of the code stays the same) ...
    
    # 3. RUN AI SCANS
    # Scan for Category
    cat_results = classifier(image, candidate_labels=candidate_categories)
    top_category = cat_results[0]['label'] # The #1 match
    
    # Scan for Pattern
    pat_results = classifier(image, candidate_labels=candidate_patterns)
    top_pattern = pat_results[0]['label']
    
    # 4. Get Color
    hex_code = get_dominant_color_hex(image_path)
    
    # 5. Clean up the Output
    # If the pattern is "Solid Color", we just say "Solid T-Shirt"
    # If it's "Vertical Stripes", we say "Vertical Striped Shirt"
    if "Solid" in top_pattern:
        display_pattern = "Solid"
    elif "Logo" in top_pattern or "Graphic" in top_pattern:
        display_pattern = "Graphic/Logo"
    else:
        display_pattern = top_pattern
        
    final_name = f"{display_pattern} {top_category}"

    return {
        'category': top_category,     # e.g., "Jeans"
        'color_hex': hex_code,        # e.g., "#3b4a50"
        'detected_material': top_pattern, # e.g., "Vertical Stripes"
        'name': final_name            # e.g., "Vertical Stripes Shirt"
    }





def analyze_user_selfie(image_path):
    """
    Advanced Scan: Measures Skin Value (Lightness) & Saturation.
    """
    img = cv2.imread(image_path)
    
    # 1. Convert to HSV (Hue, Saturation, Value)
    # This lets us separate 'Color' (S) from 'Brightness' (V)
    hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Detect Face
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray_img, 1.1, 4)
    
    if len(faces) == 0:
        # Fallback values
        return {'skin_val': 150, 'skin_sat': 50, 'hair_val': 50, 'contrast': 100}

    x, y, w, h = faces[0]

    # 3. SAMPLE SKIN (Center of Face)
    # We use HSV here to get Value (Brightness) and Saturation
    skin_region_hsv = hsv_img[y+int(h*0.3):y+int(h*0.6), x+int(w*0.3):x+int(w*0.7)]
    
    # Average Saturation (0 = Grey, 255 = Vivid Color)
    skin_sat = np.mean(skin_region_hsv[:, :, 1]) 
    # Average Value (0 = Black, 255 = White)
    skin_val = np.mean(skin_region_hsv[:, :, 2])

    # 4. SAMPLE HAIR (Above Forehead) - Used for Contrast
    hair_start_y = max(0, y - int(h * 0.4))
    hair_region_gray = gray_img[hair_start_y:y, x:x+w]
    
    if hair_region_gray.size == 0:
        hair_val = skin_val
    else:
        hair_val = np.mean(hair_region_gray)

    # 5. CALCULATE CONTRAST
    contrast = abs(skin_val - hair_val)

    return {
        'skin_val': skin_val,      # How Dark/Light is the skin?
        'skin_sat': skin_sat,      # How Muted/Vibrant is the skin?
        'hair_val': hair_val,
        'contrast': contrast
    }

def analyze_user_season(image_path, undertone):
    """
    THE "SKIN-FIRST" ALGORITHM
    Prioritizes Skin Depth & Saturation over simple contrast.
    """
    data = analyze_user_selfie(image_path)
    
    skin_v = data['skin_val']  # Brightness (0-255)
    skin_s = data['skin_sat']  # Saturation (0-255)
    contrast = data['contrast']
    
    season = "Unknown"

    # --- LOGIC TIER 1: SKIN DEPTH (VALUE) ---
    
    # A. DEEP SKIN (Dark Skin Types)
    if skin_v < 100: 
        # Deep skin usually glows in Deep Autumn or Deep Winter
        if undertone == 'Cool':
            season = 'Winter'
        elif undertone == 'Warm':
            season = 'Autumn'
        else: # Neutral
            # Neutral Dark skin often leans Autumn (Rich/Earthy)
            season = 'Autumn' 

    # --- LOGIC TIER 2: UNDERTONE & SATURATION (Medium/Light Skin) ---
    else:
        if undertone == 'Cool':
            # Cool + High Contrast or High Saturation = Winter
            if contrast > 60 or skin_s > 100:
                season = 'Winter'
            # Cool + Low Contrast or Muted Skin = Summer
            else:
                season = 'Summer'
                
        elif undertone == 'Warm':
            # Warm + High Contrast/Saturation = Spring
            if contrast > 50 or skin_s > 90:
                season = 'Spring'
            # Warm + Low Contrast/Muted = Autumn
            else:
                season = 'Autumn'

        else: # NEUTRAL UNDERTONE
            # Neutrals are the hardest. We use Contrast & Saturation to decide.
            
            # High Contrast Neutral -> usually leans Winter/Spring
            if contrast > 60:
                if skin_s > 100:
                    season = 'Spring' # Bright Neutral
                else:
                    season = 'Winter' # Deep Neutral
            
            # Low Contrast Neutral -> usually leans Summer/Autumn
            else:
                if skin_v > 160: # Very Pale Neutral
                    season = 'Summer'
                else: # Medium Neutral
                    season = 'Autumn'

    return {
        'season_type': season,
        'contrast_level': f"{int(contrast)} (Diff)",
        'debug_info': data
    }





def is_season_match(garment_hex, user_season):
    """
    Checks if a cloth's color fits the User's Season.
    Returns: Boolean (True/False) and a Reason.
    """
    # 1. Convert Hex to RGB
    h = garment_hex.lstrip('#')
    try:
        r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    except:
        return False, "Invalid Color"

    # 2. Define Simple Palettes (Rules of Thumb for Prototype)
    # Winter: High Contrast (Black, White) or Bold Colors
    # Summer: Soft, Muted, Cool (Greys, Blues, Pastels)
    # Autumn: Warm, Earthy (Browns, Olive, Mustard)
    # Spring: Bright, Warm (Yellow, Coral, Bright Green)
    
    match = False
    reason = "Not your best color"

    if user_season == 'Winter':
        # Winter loves Extremes: Very Dark (Black) or Very Light (White)
        if (r < 40 and g < 40 and b < 40) or (r > 200 and g > 200 and b > 200):
            match = True
            reason = "Great High Contrast"
        # Winter loves Cool/Blue dominance
        elif b > r + 30 and b > g + 30:
            match = True
            reason = "Cool Winter Tone"

    elif user_season == 'Summer':
        # Summer loves Muted/Greyish colors (Values between 100-180)
        # They hate pure Black (0) or pure White (255)
        avg_brightness = (r + g + b) / 3
        if 80 < avg_brightness < 200:
            # Summer loves Blue/Grey
            if b > r: 
                match = True
                reason = "Soft Summer Tone"
            # Summer loves Grey itself (Low saturation)
            if max(r,g,b) - min(r,g,b) < 30:
                match = True
                reason = "Perfect Neutral"

    elif user_season == 'Autumn':
        # Autumn loves Red/Green dominance (Warm)
        if r > b + 40 or g > b + 20:
            match = True
            reason = "Warm Earth Tone"
    
    elif user_season == 'Spring':
        # Spring loves Bright + Warm
        if max(r,g,b) - min(r,g,b) > 50 and r > b:
            match = True
            reason = "Bright Spring Color"

    return match, reason




    # ... (keep existing imports and functions) ...

def get_season_details(season):
    """
    Returns the 'human-readable' explanation for a specific season.
    """
    details = {
        'Winter': {
            'formula': 'Cool Undertone + High Contrast',
            'desc': 'You have a sharp, intense look. You shine in high-contrast colors.',
            'best_colors': ['Pure Black', 'Stark White', 'Royal Blue', 'Neon Pink'],
            'avoid_colors': ['Earth Tones', 'Beige', 'Mustard', 'Orange'],
            'icon': 'snow'
        },
        'Summer': {
            'formula': 'Cool Undertone + Low/Medium Contrast',
            'desc': 'You have a soft, delicate look. Muted and dusty colors make you glow.',
            'best_colors': ['Pastel Blue', 'Soft Grey', 'Lavender', 'Mauve'],
            'avoid_colors': ['Pure Black', 'Bright Orange', 'Neon Yellow'],
            'icon': 'sun'
        },
        'Autumn': {
            'formula': 'Warm Undertone + Low/Medium Contrast',
            'desc': 'You have a rich, earthy look. Warm, golden tones suit you best.',
            'best_colors': ['Olive Green', 'Mustard', 'Rust', 'Warm Brown'],
            'avoid_colors': ['Neon Pink', 'Cyan', 'Stark White'],
            'icon': 'leaf'
        },
        'Spring': {
            'formula': 'Warm Undertone + High Contrast',
            'desc': 'You have a fresh, bright look. You can pull off vibrant, warm colors.',
            'best_colors': ['Coral', 'Bright Yellow', 'Kelly Green', 'Turquoise'],
            'avoid_colors': ['Black', 'Grey', 'Dusty Pink'],
            'icon': 'sprout'
        }
    }
    
    return details.get(season, {
        'formula': 'Unknown',
        'desc': 'We need more data to analyze your style.',
        'best_colors': [],
        'avoid_colors': [],
        'icon': '?'
    })
