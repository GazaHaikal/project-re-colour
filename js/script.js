document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('image-input');
  const resultArea = document.getElementById('result-area');
  const previewImage = document.getElementById('preview-image');
  const downloadBtn = document.getElementById('download-btn');
  const resultTitle = document.getElementById('result-title');
  const spinner = document.getElementById('spinner');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  imageInput.addEventListener('change', handleImageUpload);

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    resultArea.classList.add('visible');
    resultTitle.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span> Processing...</span>';
    spinner.style.display = 'block';
    previewImage.style.display = 'none';
    previewImage.classList.remove('loaded');
    downloadBtn.style.display = 'none';

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        setTimeout(() => {
          processImage(img);
        }, 50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processImage(img) {
    let width = img.width;
    let height = img.height;
    const max_size = 1000;

    if (width > height) {
      if (width > max_size) {
        height *= max_size / width;
        width = max_size;
      }
    } else {
      if (height > max_size) {
        width *= max_size / height;
        height = max_size;
      }
    }
    canvas.width = width;
    canvas.height = height;

    // Terapkan filter default untuk sedikit menajamkan & menambah detail
    ctx.filter = "contrast(1.1) brightness(1.05)";
    ctx.drawImage(img, 0, 0, width, height);
    ctx.filter = "none";

    let imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Shadow = hijau tua (#06552E)
    const shadowColor = { r: 6, g: 85, b: 46 };
    // Highlight = pink (#D76EA3)
    const highlightColor = { r: 215, g: 110, b: 163 };

    const brightness = 1.25;
    const contrast = 1.15;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      let grayValue = avg / 255;

      grayValue = (grayValue - 0.5) * contrast + 0.5; 
      grayValue = Math.min(1, Math.max(0, grayValue));

      grayValue *= brightness; 
      grayValue = Math.min(1, Math.max(0, grayValue));

      data[i]     = shadowColor.r + grayValue * (highlightColor.r - shadowColor.r);
      data[i + 1] = shadowColor.g + grayValue * (highlightColor.g - shadowColor.g);
      data[i + 2] = shadowColor.b + grayValue * (highlightColor.b - shadowColor.b);
    }
    ctx.putImageData(imageData, 0, 0);

    // ---- Tambahkan sharpening convolution ----
    sharpen();

    const finalImageUrl = canvas.toDataURL('image/png');
    resultTitle.innerHTML = '<i class="fas fa-image"></i><span> Result Preview</span>';
    previewImage.src = finalImageUrl;

    downloadBtn.href = finalImageUrl;
    downloadBtn.setAttribute('download', 'recolored-image.png');

    spinner.style.display = 'none';
    previewImage.style.display = 'block';
    void previewImage.offsetWidth;
    previewImage.classList.add('loaded');
    downloadBtn.style.display = 'inline-block';
    downloadBtn.classList.add('pulse');
    setTimeout(() => downloadBtn.classList.remove('pulse'), 2000);
  }

  function sharpen() {
    let weights = [
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0
    ];
    let side = Math.round(Math.sqrt(weights.length));
    let halfSide = Math.floor(side / 2);

    let src = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sw = src.width;
    let sh = src.height;
    let srcData = src.data;

    let output = ctx.createImageData(sw, sh);
    let dstData = output.data;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        let sy = y;
        let sx = x;
        let dstOff = (y * sw + x) * 4;
        let r=0, g=0, b=0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            let scy = sy + cy - halfSide;
            let scx = sx + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              let srcOff = (scy * sw + scx) * 4;
              let wt = weights[cy * side + cx];
              r += srcData[srcOff] * wt;
              g += srcData[srcOff + 1] * wt;
              b += srcData[srcOff + 2] * wt;
            }
          }
        }
        dstData[dstOff]     = Math.min(255, Math.max(0, r));
        dstData[dstOff + 1] = Math.min(255, Math.max(0, g));
        dstData[dstOff + 2] = Math.min(255, Math.max(0, b));
        dstData[dstOff + 3] = 255;
      }
    }
    ctx.putImageData(output, 0, 0);
  }
});