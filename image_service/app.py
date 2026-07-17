import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)
CORS(app)

PORT = 5001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

# Ensure directories exist
os.makedirs(TEMPLATES_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generate fallback templates only if missing (we already downloaded real ones)
def create_fallback_templates():
    templates_config = {
        'drake.png': (600, 600, (255, 255, 255)),
        'expanding-brain.png': (600, 800, (0, 0, 0)),
        'distracted-boyfriend.png': (800, 450, (30, 41, 59))
    }
    for filename, (w, h, color) in templates_config.items():
        filepath = os.path.join(TEMPLATES_DIR, filename)
        if not os.path.exists(filepath):
            img = Image.new('RGB', (w, h), color=color)
            img.save(filepath)

create_fallback_templates()

# Helper function to auto-wrap text
def wrap_text(text, font, max_width):
    words = text.split(' ')
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        test_line = ' '.join(current_line)
        try:
            bbox = font.getbbox(test_line)
            width = bbox[2] - bbox[0]
        except AttributeError:
            width = font.getsize(test_line)[0]
            
        if width > max_width:
            current_line.pop()
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
            
    if current_line:
        lines.append(' '.join(current_line))
    return lines

# Helper function to dynamically scale font size to fit panel bounds
def get_best_font_and_lines(text, font_paths, max_w, max_h):
    for size in range(28, 9, -2):
        font = None
        for font_name in font_paths:
            try:
                font = ImageFont.truetype(font_name, size)
                break
            except OSError:
                continue
        if font is None:
            font = ImageFont.load_default()
            
        lines = wrap_text(text, font, max_w)
        
        total_height = 0
        for line in lines:
            try:
                line_h = font.getbbox(line)[3] - font.getbbox(line)[1]
            except AttributeError:
                line_h = font.getsize(line)[1]
            total_height += line_h + 4
            
        if total_height <= max_h or size <= 10:
            return font, lines

    default_font = ImageFont.load_default()
    return default_font, wrap_text(text, default_font, max_w)

# Helper function to draw text with black outline (Impact style)
def draw_outlined_text(draw, text, position, font, text_color=(255, 255, 255), outline_color=(0, 0, 0), outline_width=2):
    x, y = position
    if outline_width > 0:
        # Draw outline
        for adj_x in range(-outline_width, outline_width + 1):
            for adj_y in range(-outline_width, outline_width + 1):
                if adj_x != 0 or adj_y != 0:
                    draw.text((x + adj_x, y + adj_y), text, font=font, fill=outline_color)
    draw.text((x, y), text, font=font, fill=text_color)

@app.route('/overlay-text', methods=['POST'])
def overlay_text():
    data = request.get_json() or {}
    template_name = data.get('templateName', 'expanding-brain')
    
    template_filename = f"{os.path.basename(template_name)}.png"
    template_path = os.path.join(TEMPLATES_DIR, template_filename)
    
    if not os.path.exists(template_path):
        template_path = os.path.join(TEMPLATES_DIR, 'expanding-brain.png')

    try:
        img = Image.open(template_path).convert('RGB')
    except Exception as e:
        return jsonify({"error": f"Failed to load template: {str(e)}"}), 500

    # Resize template image on-load to standard resolution to guarantee coordinate accuracy
    if template_filename == 'drake.png':
        img = img.resize((600, 600))
    elif template_filename == 'distracted-boyfriend.png':
        img = img.resize((800, 450))
    else: # expanding-brain
        img = img.resize((600, 800))

    draw = ImageDraw.Draw(img)
    font_options = ["Impact.ttf", "Impact", "LiberationSans-Bold.ttf", "Arial-Bold.ttf", "Arial Bold", "Helvetica-Bold"]

    panels = [
        data.get('panel1', ''),
        data.get('panel2', ''),
        data.get('panel3', ''),
        data.get('panel4', '')
    ]
    
    # Predefined coordinates, max widths, max heights, and text/outline colors
    if template_filename == 'drake.png':
        # Drake: text goes on the right column (which is white/light-gray background).
        # Draw in black text with no outline.
        coordinates = [
            (220, 30, 360, 220, (0, 0, 0), (0, 0, 0), 0),
            (220, 330, 360, 220, (0, 0, 0), (0, 0, 0), 0)
        ]
    elif template_filename == 'distracted-boyfriend.png':
        # Distracted boyfriend: text overlays character bodies.
        # Draw in white text with thick black outline.
        coordinates = [
            (360, 200, 200, 120, (255, 255, 255), (0, 0, 0), 3), # Boyfriend (panel1)
            (600, 230, 180, 120, (255, 255, 255), (0, 0, 0), 3), # Girl in red (panel2)
            (80, 220, 180, 120, (255, 255, 255), (0, 0, 0), 3)   # Jealous girlfriend (panel3)
        ]
    else: # expanding-brain
        # Expanding brain: text goes on the left column (which has black background).
        # Draw in white text with black outline.
        coordinates = [
            (20, 20, 260, 160, (255, 255, 255), (0, 0, 0), 1),
            (20, 220, 260, 160, (255, 255, 255), (0, 0, 0), 1),
            (20, 420, 260, 160, (255, 255, 255), (0, 0, 0), 1),
            (20, 620, 260, 160, (255, 255, 255), (0, 0, 0), 1)
        ]

    # Draw panels
    for i, text in enumerate(panels):
        if i >= len(coordinates) or not text:
            continue
            
        x, y, max_w, max_h, text_color, outline_color, outline_w = coordinates[i]
        
        # Calculate best font size and wrapped lines dynamically
        font, wrapped_lines = get_best_font_and_lines(text.upper(), font_options, max_w, max_h)
        
        # Center vertically within the height boundary
        total_height = 0
        line_heights = []
        for line in wrapped_lines:
            try:
                h = font.getbbox(line)[3] - font.getbbox(line)[1]
            except AttributeError:
                h = font.getsize(line)[1]
            line_heights.append(h)
            total_height += h + 4
            
        vertical_offset = (max_h - total_height) // 2
        current_y = y + max(0, vertical_offset)
        
        for idx, line in enumerate(wrapped_lines):
            # Center horizontally within the width boundary
            try:
                line_w = font.getbbox(line)[2] - font.getbbox(line)[0]
            except AttributeError:
                line_w = font.getsize(line)[0]
            horizontal_offset = (max_w - line_w) // 2
            current_x = x + max(0, horizontal_offset)

            draw_outlined_text(
                draw, 
                line, 
                (current_x, current_y), 
                font, 
                text_color=text_color, 
                outline_color=outline_color, 
                outline_width=outline_w
            )
            current_y += line_heights[idx] + 4

    output_filename = f"meme_{uuid.uuid4().hex}.png"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    img.save(output_path)

    image_url = f"http://localhost:{PORT}/output/{output_filename}"
    return jsonify({
        "status": "success",
        "url": image_url,
        "filename": output_filename
    })

@app.route('/output/<filename>')
def serve_output(filename):
    return send_from_directory(OUTPUT_DIR, filename)

if __name__ == '__main__':
    print(f"Flask meme service starting on http://localhost:{PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)
