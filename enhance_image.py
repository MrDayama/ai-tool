import os
import cv2
import numpy as np

input_path = r"C:\Users\0pn32\.gemini\antigravity\brain\649d0f15-a66e-49f9-8df4-9ad533a4bd9a\user_uploaded_airship.png"
output_artifact = r"C:\Users\0pn32\.gemini\antigravity\brain\649d0f15-a66e-49f9-8df4-9ad533a4bd9a\user_uploaded_airship_hd.png"
output_app = r"c:\work\ai\ai-tool\amongus-helper\assets\maps\airship.png"

if os.path.exists(input_path):
    img = cv2.imread(input_path)
    
    # 1. 3倍に超解像アップスケーリング (Inter-Cubic)
    h, w = img.shape[:2]
    img_scaled = cv2.resize(img, (w * 3, h * 3), interpolation=cv2.INTER_CUBIC)
    
    # 2. デノイズ・エッジ保存平滑化 (Bilateral Filter)
    denoised = cv2.bilateralFilter(img_scaled, d=9, sigmaColor=75, sigmaSpace=75)
    
    # 3. エッジ強調シャープニングカーネル (Unsharp Mask)
    gaussian_blur = cv2.GaussianBlur(denoised, (0, 0), 3.0)
    sharpened = cv2.addWeighted(denoised, 1.8, gaussian_blur, -0.8, 0)
    
    # 4. コントラスト＆彩度強調 (CLAHE)
    lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    final_hd = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    
    # 保存
    cv2.imwrite(output_artifact, final_hd, [cv2.IMWRITE_PNG_COMPRESSION, 0])
    cv2.imwrite(output_app, final_hd, [cv2.IMWRITE_PNG_COMPRESSION, 0])
    print("OPENCV_ENHANCED_SUCCESS")
else:
    print("FILE_NOT_FOUND")
