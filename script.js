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
        if (!file) {
            return;
        }
        
        // Validasi ukuran file (maksimal 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB. Please choose a smaller image.');
            return;
        }

        // Tampilkan animasi loading
        resultArea.classList.add('visible');
        resultTitle.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
        spinner.style.display = 'block';
        previewImage.style.display = 'none';
        previewImage.classList.remove('loaded');
        downloadBtn.style.display = 'none';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Jeda singkat untuk memastikan UI sempat ter-update sebelum proses berat dimulai
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

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const shadowColor = { r: 0, g: 100, b: 0 };
        const highlightColor = { r: 255, g: 105, b: 180 };

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const grayValue = avg / 255;
            
            data[i]     = shadowColor.r + grayValue * (highlightColor.r - shadowColor.r); // red
            data[i + 1] = shadowColor.g + grayValue * (highlightColor.g - shadowColor.g); // green
            data[i + 2] = shadowColor.b + grayValue * (highlightColor.b - shadowColor.b); // blue
        }

        ctx.putImageData(imageData, 0, 0);

        const finalImageUrl = canvas.toDataURL('image/png');
        
        // Update UI dengan animasi
        resultTitle.innerHTML = '<i class="fas fa-image"></i><span>Result Preview</span>';
        previewImage.src = finalImageUrl;
        
        // Perbaikan: Set href dan download attribute untuk tombol download
        downloadBtn.href = finalImageUrl;
        downloadBtn.setAttribute('download', 'recolored-image.png');

        // Sembunyikan spinner dan tampilkan gambar dengan animasi
        spinner.style.display = 'none';
        previewImage.style.display = 'block';
        
        // Trigger reflow untuk memastikan animasi berjalan
        void previewImage.offsetWidth;
        
        previewImage.classList.add('loaded');
        downloadBtn.style.display = 'flex';
        
        // Tambahkan efek pulse pada tombol download
        downloadBtn.classList.add('pulse');
        setTimeout(() => {
            downloadBtn.classList.remove('pulse');
        }, 2000);
    }
});