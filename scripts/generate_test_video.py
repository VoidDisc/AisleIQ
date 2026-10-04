import cv2
import numpy as np

def generate_test_video(output_path="test_video.mp4", num_frames=300, fps=30):
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    if not out.isOpened():
        print(f"Failed to open video writer for {output_path}")
        return

    # Moving square parameters
    x, y = 100, 240
    dx, dy = 5, 2
    size = 50

    for i in range(num_frames):
        # Create a blank white image
        frame = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Add some text
        cv2.putText(frame, f"Frame: {i}/{num_frames}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Draw moving "person"
        cv2.rectangle(frame, (x, y), (x + size, y + size), (0, 0, 255), -1)
        
        # Move the shape
        x += dx
        y += dy
        
        # Bounce off walls
        if x < 0 or x + size > width: dx *= -1
        if y < 0 or y + size > height: dy *= -1
            
        out.write(frame)

    out.release()
    print(f"Generated {output_path} with {num_frames} frames.")

if __name__ == "__main__":
    generate_test_video()
