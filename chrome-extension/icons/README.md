# 아이콘 생성 방법

## SVG to PNG 변환

`icon.svg` 파일을 다음 크기로 변환하세요:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

### 온라인 변환 도구
1. https://cloudconvert.com/svg-to-png
2. https://svgtopng.com/

### 명령어 (ImageMagick 설치 필요)
```bash
# ImageMagick 설치
brew install imagemagick

# 변환
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### 또는 Sharp (Node.js)
```bash
npm install sharp
```

```javascript
const sharp = require('sharp');

const sizes = [16, 48, 128];

sizes.forEach(size => {
  sharp('icon.svg')
    .resize(size, size)
    .png()
    .toFile(`icon${size}.png`);
});
```
