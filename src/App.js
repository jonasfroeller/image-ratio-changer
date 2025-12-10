import { useState, useRef, useEffect, useCallback } from 'react';
import { GifReader } from 'omggif';
import './App.css';

const PRESET_RATIOS = [
  { name: 'Instagram Post', ratio: '1:1', width: 1080, height: 1080, category: 'Instagram' },
  { name: 'Instagram Story', ratio: '9:16', width: 1080, height: 1920, category: 'Instagram' },
  { name: 'Instagram Reel', ratio: '9:16', width: 1080, height: 1920, category: 'Instagram' },
  { name: 'YouTube Thumbnail', ratio: '16:9', width: 1280, height: 720, category: 'YouTube' },
  { name: 'YouTube Community Post', ratio: '1:1', width: 1080, height: 1080, category: 'YouTube' },
  { name: 'YouTube Short', ratio: '9:16', width: 1080, height: 1920, category: 'YouTube' },
  { name: 'TikTok Video', ratio: '9:16', width: 1080, height: 1920, category: 'TikTok' },
  { name: 'Twitter Post', ratio: '16:9', width: 1200, height: 675, category: 'Twitter' },
  { name: 'Twitter Header', ratio: '3:1', width: 1500, height: 500, category: 'Twitter' },
  { name: 'Facebook Post', ratio: '1.91:1', width: 1200, height: 630, category: 'Facebook' },
  { name: 'Facebook Cover', ratio: '2.7:1', width: 851, height: 315, category: 'Facebook' },
  { name: 'LinkedIn Post', ratio: '1.91:1', width: 1200, height: 627, category: 'LinkedIn' },
  { name: 'Pinterest Pin', ratio: '2:3', width: 1000, height: 1500, category: 'Pinterest' },
  { name: 'Pinterest Story', ratio: '9:16', width: 1080, height: 1920, category: 'Pinterest' },
  { name: 'Snapchat Story', ratio: '9:16', width: 1080, height: 1920, category: 'Snapchat' },
  { name: 'WhatsApp Status', ratio: '9:16', width: 1080, height: 1920, category: 'WhatsApp' },
  { name: 'Custom Portrait', ratio: '2:5', width: 800, height: 2000, category: 'Custom' },
  { name: 'Custom Landscape', ratio: '5:2', width: 2000, height: 800, category: 'Custom' },
  { name: 'Chrome Web Store Icon', ratio: '1:1', width: 128, height: 128, category: 'Chrome Web Store' },
  { name: 'Chrome Web Store Screenshot (Large)', ratio: '16:10', width: 1280, height: 800, category: 'Chrome Web Store' },
  { name: 'Chrome Web Store Screenshot (Small)', ratio: '16:10', width: 640, height: 400, category: 'Chrome Web Store' },
  { name: 'Chrome Web Store Small Promo Tile', ratio: '11:7', width: 440, height: 280, category: 'Chrome Web Store' },
  { name: 'Chrome Web Store Marquee Promo Tile', ratio: '5:2', width: 1400, height: 560, category: 'Chrome Web Store' },
];

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [originalImageData, setOriginalImageData] = useState(null);
  const [selectedRatio, setSelectedRatio] = useState(PRESET_RATIOS[0]);
  const [insideBackgroundColor, setInsideBackgroundColor] = useState('#ffffff');
  const [isTransparent, setIsTransparent] = useState(false);
  const [lastInsideBackgroundColor, setLastInsideBackgroundColor] = useState('#ffffff');
  const [outsideBackgroundColor, setOutsideBackgroundColor] = useState('#ffffff');
  const [isTransparentOutside, setIsTransparentOutside] = useState(false);
  const [lastOutsideBackgroundColor, setLastOutsideBackgroundColor] = useState('#ffffff');
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderRadius, setBorderRadius] = useState(0);
  const [fitMode, setFitMode] = useState('contain');
  const [imageScale, setImageScale] = useState(100);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManuallyTransformed, setIsManuallyTransformed] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState({ isDragging: false, handle: null, startPos: null, startSize: null, startPosition: null });
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0 });
  const [baseImageSize, setBaseImageSize] = useState({ width: 0, height: 0 });
  const [showCenterPoint, setShowCenterPoint] = useState(false);
  const [isGif, setIsGif] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [gifFrameCount, setGifFrameCount] = useState(0);
  const [margin, setMargin] = useState(0);
  const [customWidth, setCustomWidth] = useState(String(PRESET_RATIOS[0].width));
  const [customHeight, setCustomHeight] = useState(String(PRESET_RATIOS[0].height));
  const isScalingFromSlider = useRef(false);

  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const gifReaderRef = useRef(null);
  const gifBytesRef = useRef(null);
  const checkerTileRef = useRef(null);
  const imageObjectUrlRef = useRef(null);

  const toPositiveInteger = (value, fallback = 1) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.max(1, Math.round(parsed));
  };

  const getRatioLabel = (width, height) => {
    const safeWidth = Math.max(1, Math.round(width));
    const safeHeight = Math.max(1, Math.round(height));
    let a = safeWidth;
    let b = safeHeight;
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    const divisor = a || 1;
    return `${safeWidth / divisor}:${safeHeight / divisor}`;
  };

  const drawResizeHandles = useCallback((ctx, x, y, width, height) => {
    const handleSize = 8;
    const handleColor = '#3b82f6';
    const handleBorderColor = '#ffffff';

    const handles = [
      // Corners
      { x: x - handleSize / 2, y: y - handleSize / 2, cursor: 'nw-resize', type: 'corner', direction: 'nw' },
      { x: x + width - handleSize / 2, y: y - handleSize / 2, cursor: 'ne-resize', type: 'corner', direction: 'ne' },
      { x: x - handleSize / 2, y: y + height - handleSize / 2, cursor: 'sw-resize', type: 'corner', direction: 'sw' },
      { x: x + width - handleSize / 2, y: y + height - handleSize / 2, cursor: 'se-resize', type: 'corner', direction: 'se' },
      // Sides
      { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2, cursor: 'n-resize', type: 'side', direction: 'n' },
      { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2, cursor: 'e-resize', type: 'side', direction: 'e' },
      { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2, cursor: 's-resize', type: 'side', direction: 's' },
      { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2, cursor: 'w-resize', type: 'side', direction: 'w' },
    ];

    handles.forEach(handle => {
      ctx.fillStyle = handleBorderColor;
      ctx.fillRect(handle.x - 1, handle.y - 1, handleSize + 2, handleSize + 2);

      ctx.fillStyle = handleColor;
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    });

    ctx.strokeStyle = handleColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }, []);

  const drawCenterPoint = useCallback((ctx) => {
    const handleSize = 10;
    const handleColor = '#3b82f6';
    const handleBorderColor = '#ffffff';

    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = imagePosition.x + centerPoint.x;
    const centerY = imagePosition.y + centerPoint.y;

    ctx.fillStyle = handleBorderColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, handleSize / 2 + 1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = handleColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, handleSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = handleColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - handleSize, centerY);
    ctx.lineTo(centerX + handleSize, centerY);
    ctx.moveTo(centerX, centerY - handleSize);
    ctx.lineTo(centerX, centerY + handleSize);
    ctx.stroke();
  }, [centerPoint.x, centerPoint.y, imagePosition.x, imagePosition.y]);

  const drawCheckerboard = (ctx, width, height) => {
    const tileSize = 20;
    if (!checkerTileRef.current) {
      const tile = document.createElement('canvas');
      tile.width = tileSize * 2;
      tile.height = tileSize * 2;
      const tctx = tile.getContext('2d');
      tctx.fillStyle = '#ffffff';
      tctx.fillRect(0, 0, tile.width, tile.height);
      tctx.fillStyle = '#e0e0e0';
      tctx.fillRect(0, 0, tileSize, tileSize);
      tctx.fillRect(tileSize, tileSize, tileSize, tileSize);
      checkerTileRef.current = tile;
    }
    const pattern = ctx.createPattern(checkerTileRef.current, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  };

  const drawImageOnCanvas = useCallback(() => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (canvas.width !== selectedRatio.width) {
      canvas.width = selectedRatio.width;
    }
    if (canvas.height !== selectedRatio.height) {
      canvas.height = selectedRatio.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const outerWidth = canvas.width - margin * 2;
    const outerHeight = canvas.height - margin * 2;

    // Draw outer background
    if (isTransparentOutside) {
      drawCheckerboard(ctx, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = outsideBackgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, margin, outerWidth, outerHeight, borderRadius);
    ctx.clip();

    if (borderWidth > 0) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(margin, margin, outerWidth, outerHeight);
    }

    const innerX = margin + borderWidth;
    const innerY = margin + borderWidth;
    const innerWidth = outerWidth - borderWidth * 2;
    const innerHeight = outerHeight - borderWidth * 2;
    const innerBorderRadius = Math.max(0, borderRadius - borderWidth);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerWidth, innerHeight, innerBorderRadius);
    ctx.clip();

    if (isTransparent) {
      drawCheckerboard(ctx, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = insideBackgroundColor;
      ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
    }

    // Calculate image dimensions based on fit mode and scale
    const scaleMultiplier = imageScale / 100;
    let drawWidth, drawHeight, x, y;

    if (isManuallyTransformed && imageSize.width > 0) {
      drawWidth = imageSize.width;
      drawHeight = imageSize.height;
      x = imagePosition.x;
      y = imagePosition.y;
    } else {
      if (fitMode === 'contain') {
        const imageRatio = originalImageData.width / originalImageData.height;
        const canvasRatio = innerWidth / innerHeight;

        if (imageRatio > canvasRatio) {
          drawWidth = innerWidth * scaleMultiplier;
          drawHeight = drawWidth / imageRatio;
        } else {
          drawHeight = innerHeight * scaleMultiplier;
          drawWidth = drawHeight * imageRatio;
        }
      } else if (fitMode === 'cover') {
        const imageRatio = originalImageData.width / originalImageData.height;
        const canvasRatio = innerWidth / innerHeight;

        if (imageRatio > canvasRatio) {
          drawHeight = innerHeight * scaleMultiplier;
          drawWidth = drawHeight * imageRatio;
        } else {
          drawWidth = innerWidth * scaleMultiplier;
          drawHeight = drawWidth * imageRatio;
        }
      } else {
        drawWidth = innerWidth * scaleMultiplier;
        drawHeight = innerHeight * scaleMultiplier;
      }

      // Center the image in the inner area
      x = innerX + (innerWidth - drawWidth) / 2;
      y = innerY + (innerHeight - drawHeight) / 2;

      if (!isManuallyTransformed) {
        setImagePosition(prev => (prev.x === x && prev.y === y ? prev : { x, y }));
        setImageSize(prev => (prev.width === drawWidth && prev.height === drawHeight ? prev : { width: drawWidth, height: drawHeight }));
      }
    }

    // Draw image (will be clipped by the inner rounded rectangle)
    ctx.drawImage(uploadedImage, x, y, drawWidth, drawHeight);

    // Restore from inner clip, then outer clip
    ctx.restore();
    ctx.restore();

    // Draw resize handles in edit mode
    if (isEditMode) {
      drawResizeHandles(ctx, x, y, drawWidth, drawHeight);
      if (showCenterPoint) {
        drawCenterPoint(ctx);
      }
    }

  }, [uploadedImage, selectedRatio, insideBackgroundColor, borderWidth, borderColor,
    borderRadius, fitMode, imageScale, originalImageData, isEditMode, imagePosition,
    imageSize, showCenterPoint, isTransparent, isManuallyTransformed, margin,
    isTransparentOutside, outsideBackgroundColor, drawResizeHandles, drawCenterPoint]);

  useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);

  useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      gifReaderRef.current = null;
      gifBytesRef.current = null;
    };
  }, []);

  useEffect(() => {
    setCustomWidth(String(selectedRatio.width));
    setCustomHeight(String(selectedRatio.height));
  }, [selectedRatio.width, selectedRatio.height]);

  const handleFrameChange = (frameIndex) => {
    if (!gifReaderRef.current) return;
    const newFrameIndex = Number(frameIndex);
    setCurrentFrame(newFrameIndex);

    const reader = gifReaderRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = reader.width;
    canvas.height = reader.height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(reader.width, reader.height);
    const rgba = new Uint8ClampedArray(reader.width * reader.height * 4);
    reader.decodeAndBlitFrameRGBA(newFrameIndex, rgba);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    const img = new Image();
    img.onload = () => {
      setUploadedImage(img);
    };
    img.src = canvas.toDataURL();
  }

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = objectUrl;

    const img = new Image();
    img.onload = async () => {
      setOriginalImageData({
        width: img.width,
        height: img.height,
        previewUrl: objectUrl,
      });
      setIsManuallyTransformed(false);

      if (file.type === 'image/gif') {
        setIsGif(true);
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const gifReader = new GifReader(bytes);
        gifReaderRef.current = gifReader;
        gifBytesRef.current = bytes;
        setGifFrameCount(gifReader.numFrames());
        setCurrentFrame(0);

        const rgba = new Uint8ClampedArray(gifReader.width * gifReader.height * 4);
        gifReader.decodeAndBlitFrameRGBA(0, rgba);
        const canvas = document.createElement('canvas');
        canvas.width = gifReader.width;
        canvas.height = gifReader.height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(gifReader.width, gifReader.height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
        const firstFrameImg = new Image();
        firstFrameImg.onload = () => {
          setUploadedImage(firstFrameImg);
        };
        firstFrameImg.src = canvas.toDataURL();
      } else {
        setIsGif(false);
        setUploadedImage(img);
      }
    };
    img.src = objectUrl;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const getMousePos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getResizeHandle = (mousePos, imageX, imageY, imageWidth, imageHeight) => {
    const handleSize = 8;
    const tolerance = 4;

    const handles = [
      { x: imageX - handleSize / 2, y: imageY - handleSize / 2, direction: 'nw', cursor: 'nw-resize' },
      { x: imageX + imageWidth - handleSize / 2, y: imageY - handleSize / 2, direction: 'ne', cursor: 'ne-resize' },
      { x: imageX - handleSize / 2, y: imageY + imageHeight - handleSize / 2, direction: 'sw', cursor: 'sw-resize' },
      { x: imageX + imageWidth - handleSize / 2, y: imageY + imageHeight - handleSize / 2, direction: 'se', cursor: 'se-resize' },
      { x: imageX + imageWidth / 2 - handleSize / 2, y: imageY - handleSize / 2, direction: 'n', cursor: 'n-resize' },
      { x: imageX + imageWidth - handleSize / 2, y: imageY + imageHeight / 2 - handleSize / 2, direction: 'e', cursor: 'e-resize' },
      { x: imageX + imageWidth / 2 - handleSize / 2, y: imageY + imageHeight - handleSize / 2, direction: 's', cursor: 's-resize' },
      { x: imageX - handleSize / 2, y: imageY + imageHeight / 2 - handleSize / 2, direction: 'w', cursor: 'w-resize' },
    ];

    for (let handle of handles) {
      if (Math.abs(mousePos.x - (handle.x + handleSize / 2)) <= handleSize / 2 + tolerance &&
        Math.abs(mousePos.y - (handle.y + handleSize / 2)) <= handleSize / 2 + tolerance) {
        return handle;
      }
    }

    return null;
  };

  const isPointInImage = (mousePos, imageX, imageY, imageWidth, imageHeight) => {
    return mousePos.x >= imageX && mousePos.x <= imageX + imageWidth &&
      mousePos.y >= imageY && mousePos.y <= imageY + imageHeight;
  };

  const handleCanvasDoubleClick = (e) => {
    if (!uploadedImage) return;

    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);

    if (isPointInImage(mousePos, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height)) {
      if (!isEditMode && !isManuallyTransformed) {
        // Entering edit mode for the first time after a reset
        setCenterPoint({
          x: imageSize.width / 2,
          y: imageSize.height / 2,
        });
      }
      setIsEditMode(!isEditMode);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!isEditMode || !uploadedImage) return;

    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);

    // Check for center point drag
    if (showCenterPoint) {
      const centerX = imagePosition.x + centerPoint.x;
      const centerY = imagePosition.y + centerPoint.y;
      const dist = Math.sqrt(Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2));
      if (dist < 10) { // 10px tolerance for grabbing center point
        setDragState({
          isDragging: true,
          handle: 'center',
          startPos: mousePos,
          startPosition: { ...imagePosition },
          startCenterPoint: { ...centerPoint }
        });
        canvas.style.cursor = 'move';
        return;
      }
    }

    const handle = getResizeHandle(mousePos, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);

    if (handle) {
      setDragState({
        isDragging: true,
        handle: handle.direction,
        startPos: mousePos,
        startSize: { ...imageSize },
        startPosition: { ...imagePosition },
        startCenterPoint: { ...centerPoint }
      });
      canvas.style.cursor = handle.cursor;
    } else if (isPointInImage(mousePos, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height)) {
      setDragState({
        isDragging: true,
        handle: 'move',
        startPos: mousePos,
        startSize: { ...imageSize },
        startPosition: { ...imagePosition }
      });
      canvas.style.cursor = 'move';
    }
  };

  const lastMousePosRef = useRef(null);
  const rafIdRef = useRef(null);
  const handleCanvasMouseMove = (e) => {
    if (!isEditMode || !uploadedImage) return;
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);
    lastMousePosRef.current = mousePos;
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const mp = lastMousePosRef.current;
      if (!mp) return;
      if (dragState.isDragging) {
        setIsManuallyTransformed(true);
        const deltaX = mp.x - dragState.startPos.x;
        const deltaY = mp.y - dragState.startPos.y;
        if (dragState.handle === 'move') {
          setImagePosition({
            x: dragState.startPosition.x + deltaX,
            y: dragState.startPosition.y + deltaY
          });
        } else if (dragState.handle === 'center') {
          setCenterPoint({
            x: dragState.startCenterPoint.x + deltaX,
            y: dragState.startCenterPoint.y + deltaY,
          });
        } else {
          let newWidth = dragState.startSize.width;
          let newHeight = dragState.startSize.height;
          let newX = dragState.startPosition.x;
          let newY = dragState.startPosition.y;
          const aspectRatio = originalImageData.width / originalImageData.height;
          switch (dragState.handle) {
            case 'se':
              newWidth = Math.max(20, dragState.startSize.width + deltaX);
              if (maintainRatio) {
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(20, dragState.startSize.height + deltaY);
              }
              break;
            case 'sw':
              newWidth = Math.max(20, dragState.startSize.width - deltaX);
              newX = dragState.startPosition.x + deltaX;
              if (maintainRatio) {
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(20, dragState.startSize.height + deltaY);
              }
              break;
            case 'ne':
              newWidth = Math.max(20, dragState.startSize.width + deltaX);
              newY = dragState.startPosition.y + deltaY;
              if (maintainRatio) {
                newHeight = newWidth / aspectRatio;
                newY = dragState.startPosition.y + (dragState.startSize.height - newHeight);
              } else {
                newHeight = Math.max(20, dragState.startSize.height - deltaY);
              }
              break;
            case 'nw':
              newWidth = Math.max(20, dragState.startSize.width - deltaX);
              newX = dragState.startPosition.x + deltaX;
              newY = dragState.startPosition.y + deltaY;
              if (maintainRatio) {
                newHeight = newWidth / aspectRatio;
                newY = dragState.startPosition.y + (dragState.startSize.height - newHeight);
              } else {
                newHeight = Math.max(20, dragState.startSize.height - deltaY);
              }
              break;
            case 'e':
              newWidth = Math.max(20, dragState.startSize.width + deltaX);
              if (maintainRatio) {
                newHeight = newWidth / aspectRatio;
                newY = dragState.startPosition.y + (dragState.startSize.height - newHeight) / 2;
              }
              break;
            case 'w':
              newWidth = Math.max(20, dragState.startSize.width - deltaX);
              newX = dragState.startPosition.x + deltaX;
              if (maintainRatio) {
                newHeight = newWidth / aspectRatio;
                newY = dragState.startPosition.y + (dragState.startSize.height - newHeight) / 2;
              }
              break;
            case 'n':
              if (maintainRatio) {
                newHeight = Math.max(20, dragState.startSize.height - deltaY);
                newWidth = newHeight * aspectRatio;
                newX = dragState.startPosition.x + (dragState.startSize.width - newWidth) / 2;
              } else {
                newHeight = Math.max(20, dragState.startSize.height - deltaY);
              }
              newY = dragState.startPosition.y + deltaY;
              break;
            case 's':
              if (maintainRatio) {
                newHeight = Math.max(20, dragState.startSize.height + deltaY);
                newWidth = newHeight * aspectRatio;
                newX = dragState.startPosition.x + (dragState.startSize.width - newWidth) / 2;
              } else {
                newHeight = Math.max(20, dragState.startSize.height + deltaY);
              }
              break;
            default:
              break;
          }
          const originX = dragState.startPosition.x + dragState.startCenterPoint.x;
          const originY = dragState.startPosition.y + dragState.startCenterPoint.y;
          newX = originX - (dragState.startCenterPoint.x) * (newWidth / dragState.startSize.width);
          newY = originY - (dragState.startCenterPoint.y) * (newHeight / dragState.startSize.height);
          const newCenterPoint = {
            x: dragState.startCenterPoint.x * (newWidth / dragState.startSize.width),
            y: dragState.startCenterPoint.y * (newHeight / dragState.startSize.height),
          };
          setImageSize({ width: newWidth, height: newHeight });
          setImagePosition({ x: newX, y: newY });
          setCenterPoint(newCenterPoint);
        }
      } else {
        const handle = getResizeHandle(mp, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);
        if (handle) {
          canvas.style.cursor = handle.cursor;
        } else if (showCenterPoint) {
          const centerX = imagePosition.x + centerPoint.x;
          const centerY = imagePosition.y + centerPoint.y;
          const dist = Math.sqrt(Math.pow(mp.x - centerX, 2) + Math.pow(mp.y - centerY, 2));
          if (dist < 10) {
            canvas.style.cursor = 'move';
          } else {
            canvas.style.cursor = isPointInImage(mp, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height) ? 'move' : 'default';
          }
        } else if (isPointInImage(mp, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height)) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    });
  };

  const handleCanvasMouseUp = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (dragState.isDragging) {
      setDragState({ isDragging: false, handle: null, startPos: null, startSize: null, startPosition: null });
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleInsideBackgroundColorChange = (color) => {
    setInsideBackgroundColor(color);
    if (color.toLowerCase() === 'transparent') {
      if (!isTransparent) setIsTransparent(true);
    } else {
      setLastInsideBackgroundColor(color);
      if (isTransparent) setIsTransparent(false);
    }
  };

  const handleBorderWidthChange = (width) => {
    setBorderWidth(width);
    if (width === 0) {
      setBorderRadius(0);
    }
  };

  const handleTransparentToggle = () => {
    const newIsTransparent = !isTransparent;
    setIsTransparent(newIsTransparent);
    if (newIsTransparent) {
      setInsideBackgroundColor('transparent');
    } else {
      setInsideBackgroundColor(lastInsideBackgroundColor);
    }
  };

  const handleMarginChange = (value) => {
    setMargin(value);
    if (value === 0) {
      setIsTransparentOutside(false);
      setOutsideBackgroundColor('#ffffff');
      setLastOutsideBackgroundColor('#ffffff');
    }
  };

  const handleOutsideBackgroundColorChange = (color) => {
    setOutsideBackgroundColor(color);
    if (color.toLowerCase() === 'transparent') {
      if (!isTransparentOutside) setIsTransparentOutside(true);
    } else {
      setLastOutsideBackgroundColor(color);
      if (isTransparentOutside) setIsTransparentOutside(false);
    }
  };

  const handleTransparentOutsideToggle = () => {
    const newIsTransparentOutside = !isTransparentOutside;
    setIsTransparentOutside(newIsTransparentOutside);
    if (newIsTransparentOutside) {
      setOutsideBackgroundColor('transparent');
    } else {
      setOutsideBackgroundColor(lastOutsideBackgroundColor);
    }
  };

  const applyCustomRatio = () => {
    const width = toPositiveInteger(customWidth, selectedRatio.width);
    const height = toPositiveInteger(customHeight, selectedRatio.height);
    const ratioLabel = getRatioLabel(width, height);

    setSelectedRatio({
      name: 'Custom',
      ratio: ratioLabel,
      width,
      height,
      category: 'Custom',
    });
    setCustomWidth(String(width));
    setCustomHeight(String(height));
    setIsEditMode(false);
    setIsManuallyTransformed(false);
  };

  const swapRatio = () => {
    const [w, h] = selectedRatio.ratio.split(':').map(Number);
    const isAlreadySwapped = selectedRatio.name.includes('(Swapped)');

    const swappedRatio = {
      ...selectedRatio,
      ratio: `${h}:${w}`,
      width: selectedRatio.height,
      height: selectedRatio.width,
      name: isAlreadySwapped
        ? selectedRatio.name.replace(' (Swapped)', '')
        : selectedRatio.name + ' (Swapped)'
    };
    setSelectedRatio(swappedRatio);
    setIsEditMode(false); // Exit edit mode when changing ratio
    setIsManuallyTransformed(false);
  };

  const exportImage = async (format = 'png') => {
    if (!canvasRef.current || !uploadedImage) return;

    setIsExporting(true);

    const normalizedFormat = format === 'jpg' ? 'jpeg' : format;
    const allowTransparency = normalizedFormat !== 'jpeg';
    const outerColor = allowTransparency
      ? outsideBackgroundColor
      : ((isTransparentOutside || outsideBackgroundColor.toLowerCase() === 'transparent')
        ? '#ffffff'
        : outsideBackgroundColor);
    const innerColor = allowTransparency
      ? insideBackgroundColor
      : ((isTransparent || insideBackgroundColor.toLowerCase() === 'transparent')
        ? '#ffffff'
        : insideBackgroundColor);

    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    exportCanvas.width = selectedRatio.width;
    exportCanvas.height = selectedRatio.height;

    const outerWidth = exportCanvas.width - margin * 2;
    const outerHeight = exportCanvas.height - margin * 2;

    const shouldFillOuter = !allowTransparency || !isTransparentOutside;

    if (shouldFillOuter) {
      exportCtx.fillStyle = outerColor;
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // Save context and clip to the outer rounded rectangle
    exportCtx.save();
    exportCtx.beginPath();
    exportCtx.roundRect(margin, margin, outerWidth, outerHeight, borderRadius);
    exportCtx.clip();

    // Fill the clipped area with border color first
    if (borderWidth > 0) {
      exportCtx.fillStyle = borderColor;
      exportCtx.fillRect(margin, margin, outerWidth, outerHeight);
    }

    // Define inner area (inside the border)
    const innerX = margin + borderWidth;
    const innerY = margin + borderWidth;
    const innerWidth = outerWidth - borderWidth * 2;
    const innerHeight = outerHeight - borderWidth * 2;
    const innerBorderRadius = Math.max(0, borderRadius - borderWidth);

    // Save context and clip to the inner rounded rectangle
    exportCtx.save();
    exportCtx.beginPath();
    exportCtx.roundRect(innerX, innerY, innerWidth, innerHeight, innerBorderRadius);
    exportCtx.clip();

    const shouldClearInner = allowTransparency && (isTransparent || innerColor.toLowerCase() === 'transparent');

    if (shouldClearInner) {
      exportCtx.clearRect(innerX, innerY, innerWidth, innerHeight);
    } else {
      exportCtx.fillStyle = innerColor;
      exportCtx.fillRect(innerX, innerY, innerWidth, innerHeight);
    }

    // Use the same positioning as the main canvas
    const { width: drawWidth, height: drawHeight } = imageSize;
    const { x, y } = imagePosition;

    // Draw image (will be clipped)
    exportCtx.drawImage(uploadedImage, x, y, drawWidth, drawHeight);

    // Restore from inner clip, then outer clip
    exportCtx.restore();
    exportCtx.restore();

    // Small delay for visual feedback
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `image-${selectedRatio.ratio.replace(':', 'x')}.${normalizedFormat}`;
      const mime = normalizedFormat === 'webp'
        ? 'image/webp'
        : normalizedFormat === 'jpeg'
          ? 'image/jpeg'
          : 'image/png';
      const quality = (normalizedFormat === 'webp' || normalizedFormat === 'jpeg') ? 0.92 : undefined;
      exportCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          link.href = exportCanvas.toDataURL(mime, quality);
          link.click();
        }
        setIsExporting(false);
      }, mime, quality);
    }, 300);
  };

  const categories = [...new Set(PRESET_RATIOS.map(preset => preset.category))];
  const normalizedCustomWidth = toPositiveInteger(customWidth, selectedRatio.width);
  const normalizedCustomHeight = toPositiveInteger(customHeight, selectedRatio.height);
  const customRatioLabel = getRatioLabel(normalizedCustomWidth, normalizedCustomHeight);
  const canApplyCustomRatio = Number(customWidth) > 0 && Number(customHeight) > 0;
  const isCustomRatioSelected = selectedRatio.name === 'Custom';

  useEffect(() => {
    if (!isEditMode || !uploadedImage || !isScalingFromSlider.current) return;

    const scaleFactor = imageScale / 100;

    const newWidth = baseImageSize.width * scaleFactor;
    const newHeight = baseImageSize.height * scaleFactor;

    if (newWidth <= 0 || newHeight <= 0) return;

    const originX = imagePosition.x + centerPoint.x;
    const originY = imagePosition.y + centerPoint.y;

    const newX = originX - centerPoint.x * (newWidth / imageSize.width);
    const newY = originY - centerPoint.y * (newHeight / imageSize.height);

    const newCenterPoint = {
      x: centerPoint.x * (newWidth / imageSize.width),
      y: centerPoint.y * (newHeight / imageSize.height),
    };

    setImageSize({ width: newWidth, height: newHeight });
    setImagePosition({ x: newX, y: newY });
    setCenterPoint(newCenterPoint);

    isScalingFromSlider.current = false;

  }, [
    imageScale,
    isEditMode,
    uploadedImage,
    baseImageSize.width,
    baseImageSize.height,
    imagePosition.x,
    imagePosition.y,
    imageSize.width,
    imageSize.height,
    centerPoint.x,
    centerPoint.y,
  ]);

  useEffect(() => {
    if (!isEditMode || !uploadedImage) {
      // Reset base size when not in edit mode
      setBaseImageSize({ width: 0, height: 0 });
      return;
    };
    // Set initial base size when entering edit mode or when image changes
    if (uploadedImage && baseImageSize.width === 0) {
      const scaleFactor = imageScale / 100;
      setBaseImageSize({
        width: imageSize.width / scaleFactor,
        height: imageSize.height / scaleFactor
      });
    }
  }, [
    isEditMode,
    uploadedImage,
    imageSize.width,
    imageSize.height,
    imageScale,
    baseImageSize.width,
    baseImageSize.height,
  ]);

  return (
    <div className="flex flex-col flex-grow bg-gray-50">
      <div className="flex flex-col flex-grow mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-8 h-8 bg-gray-900 rounded">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Image Ratio Converter</h1>
                <p className="text-sm text-gray-500">Simple image resizing for social media</p>
              </div>
            </div>
            {uploadedImage && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportImage('png')}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {isExporting ? 'Exporting...' : 'Export PNG'}
                </button>
                <button
                  onClick={() => exportImage('jpeg')}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Export JPEG
                </button>
                <button
                  onClick={() => exportImage('webp')}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Export WebP
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-grow">
          {/* Sidebar */}
          <div className="flex flex-col w-80 bg-white border-r border-gray-200">
            {/* Upload Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">UPLOAD IMAGE</h2>

              {!uploadedImage ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <svg className="mx-auto mb-4 w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm font-medium text-gray-900">Drop image here</p>
                  <p className="mb-4 text-xs text-gray-500">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded transition-colors hover:bg-gray-800"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex justify-center items-center w-8 h-8 bg-green-100 rounded">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Image uploaded</p>
                        <p className="text-xs text-gray-500">{originalImageData.width} × {originalImageData.height}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (imageObjectUrlRef.current) {
                          URL.revokeObjectURL(imageObjectUrlRef.current);
                          imageObjectUrlRef.current = null;
                        }
                        setUploadedImage(null);
                        setOriginalImageData(null);
                        setIsGif(false);
                        setGifFrameCount(0);
                        setCurrentFrame(0);
                        gifReaderRef.current = null;
                        gifBytesRef.current = null;
                        setIsEditMode(false);
                        setIsManuallyTransformed(false);
                        setImagePosition({ x: 0, y: 0 });
                        setImageSize({ width: 0, height: 0 });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <img
                    src={originalImageData?.previewUrl}
                    alt="Uploaded"
                    className="object-cover w-full h-32 bg-gray-100 rounded-lg"
                  />
                  {isGif && gifFrameCount > 0 && (
                    <div className="pt-2">
                      <label className="block mb-2 text-xs font-medium text-gray-700">
                        FRAME ({currentFrame + 1} / {gifFrameCount})
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={gifFrameCount - 1}
                        value={currentFrame}
                        onChange={(e) => handleFrameChange(e.target.value)}
                        className="w-full slider"
                      />
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Ratio Presets */}
            {uploadedImage && (
              <div className="overflow-hidden flex-1">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-gray-900">RATIO PRESETS</h2>
                    <button
                      onClick={swapRatio}
                      className="px-2 py-1 text-xs text-gray-500 rounded border border-gray-200 hover:text-gray-700"
                    >
                      ↔ Swap
                    </button>
                  </div>

                  <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Custom ratio</p>
                        <p className="text-[11px] text-gray-500">Set exact canvas dimensions</p>
                      </div>
                      <span className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded">
                        {customRatioLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block mb-1 text-[11px] font-semibold text-gray-700 tracking-wide uppercase">Width (px)</label>
                        <input
                          type="number"
                          min="1"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] font-semibold text-gray-700 tracking-wide uppercase">Height (px)</label>
                        <input
                          type="number"
                          min="1"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-600">
                        {normalizedCustomWidth} × {normalizedCustomHeight} px {isCustomRatioSelected ? '• Active' : ''}
                      </div>
                      <button
                        onClick={applyCustomRatio}
                        disabled={!canApplyCustomRatio}
                        className="px-3 py-2 text-xs font-semibold text-white bg-gray-900 rounded disabled:opacity-50 hover:bg-gray-800"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto pr-2 space-y-4 max-h-96">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                          {category}
                        </h3>
                        <div className="space-y-1">
                          {PRESET_RATIOS.filter(preset => preset.category === category).map((preset, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedRatio(preset);
                                setIsManuallyTransformed(false);
                              }}
                              className={`w-full text-left p-3 rounded-md text-sm transition-colors ${selectedRatio.name === preset.name
                                  ? 'bg-gray-900 text-white'
                                  : 'hover:bg-gray-50'
                                }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{preset.name}</span>
                                <span className={`text-xs ${selectedRatio.name === preset.name ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {preset.ratio}
                                </span>
                              </div>
                              <div className={`text-xs mt-1 ${selectedRatio.name === preset.name ? 'text-gray-400' : 'text-gray-500'}`}>
                                {preset.width} × {preset.height}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex flex-1">
            {/* Canvas Area */}
            <div className="flex flex-1 justify-center items-center p-8 bg-gray-100">
              {uploadedImage ? (
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      {selectedRatio.name} • {selectedRatio.ratio}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isEditMode && (
                        <button
                          onClick={() => setShowCenterPoint(!showCenterPoint)}
                          title="Toggle center point"
                          className={`p-1 rounded ${showCenterPoint ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                          </svg>
                        </button>
                      )}
                      <div className="text-xs text-gray-500">
                        {selectedRatio.width} × {selectedRatio.height}
                      </div>
                    </div>
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[500px] border border-gray-200"
                    style={{ objectFit: 'contain' }}
                    onDoubleClick={handleCanvasDoubleClick}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="mx-auto mb-4 w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mb-2 text-lg font-medium">Upload an image to get started</p>
                  <p className="text-sm">Choose from preset ratios or customize your own</p>
                </div>
              )}
            </div>

            {/* Controls Panel */}
            {uploadedImage && (
              <div className="w-80 bg-white border-l border-gray-200">
                <div className="p-6">
                  <h2 className="mb-6 text-sm font-semibold text-gray-900">SETTINGS</h2>

                  <div className="space-y-6">
                    {/* Background */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-medium text-gray-700">INNER BACKGROUND</label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="transparentBg"
                            checked={isTransparent}
                            onChange={handleTransparentToggle}
                            className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-400"
                          />
                          <label htmlFor="transparentBg" className="ml-2 text-sm text-gray-700">
                            Transparent
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-9 rounded-md border border-gray-300 p-0.5 ${isTransparent ? 'opacity-50' : ''}`}>
                          <input
                            type="color"
                            value={isTransparent ? lastInsideBackgroundColor : insideBackgroundColor}
                            onChange={(e) => handleInsideBackgroundColorChange(e.target.value)}
                            disabled={isTransparent}
                            className="w-full h-full border-none cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        <input
                          type="text"
                          value={insideBackgroundColor}
                          onChange={(e) => handleInsideBackgroundColorChange(e.target.value)}
                          disabled={isTransparent}
                          className="flex-1 px-3 py-2 font-mono text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Border */}
                    <div>
                      <label className="block mb-3 text-xs font-medium text-gray-700">
                        BORDER WIDTH ({borderWidth}px)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={borderWidth}
                        onChange={(e) => handleBorderWidthChange(Number(e.target.value))}
                        className="w-full slider"
                      />
                    </div>

                    {borderWidth > 0 && (
                      <div>
                        <label className="block mb-3 text-xs font-medium text-gray-700">BORDER COLOR</label>
                        <div className="flex items-center space-x-3">
                          <div className="p-0.5 w-10 h-9 rounded-md border border-gray-300">
                            <input
                              type="color"
                              value={borderColor}
                              onChange={(e) => setBorderColor(e.target.value)}
                              className="w-full h-full border-none cursor-pointer"
                            />
                          </div>
                          <input
                            type="text"
                            value={borderColor}
                            onChange={(e) => setBorderColor(e.target.value)}
                            disabled={isTransparent}
                            className="flex-1 px-3 py-2 font-mono text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}

                    {borderWidth > 0 && (
                      <div>
                        <label className="block mb-3 text-xs font-medium text-gray-700">
                          BORDER RADIUS ({borderRadius}px)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={borderRadius}
                          onChange={(e) => setBorderRadius(Number(e.target.value))}
                          className="w-full slider"
                        />
                      </div>
                    )}

                    {/* Margin */}
                    <div>
                      <label className="block mb-3 text-xs font-medium text-gray-700">
                        MARGIN ({margin}px)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={margin}
                        onChange={(e) => handleMarginChange(Number(e.target.value))}
                        className="w-full slider"
                      />
                    </div>

                    {margin > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-medium text-gray-700">OUTSIDE BACKGROUND</label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="transparentOutside"
                              checked={isTransparentOutside}
                              onChange={handleTransparentOutsideToggle}
                              className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-400"
                            />
                            <label htmlFor="transparentOutside" className="ml-2 text-sm text-gray-700">
                              Transparent
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-9 rounded-md border border-gray-300 p-0.5 ${isTransparentOutside ? 'opacity-50' : ''}`}>
                            <input
                              type="color"
                              value={isTransparentOutside ? lastOutsideBackgroundColor : outsideBackgroundColor}
                              onChange={(e) => handleOutsideBackgroundColorChange(e.target.value)}
                              disabled={isTransparentOutside}
                              className="w-full h-full border-none cursor-pointer disabled:cursor-not-allowed"
                            />
                          </div>
                          <input
                            type="text"
                            value={outsideBackgroundColor}
                            onChange={(e) => handleOutsideBackgroundColorChange(e.target.value)}
                            disabled={isTransparentOutside}
                            className="flex-1 px-3 py-2 font-mono text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Settings */}
                    <div>
                      <label className="block mb-3 text-xs font-medium text-gray-700">FIT MODE</label>
                      <select
                        value={fitMode}
                        onChange={(e) => {
                          setFitMode(e.target.value);
                          setIsManuallyTransformed(false);
                        }}
                        className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      >
                        <option value="contain">Contain</option>
                        <option value="cover">Cover</option>
                        <option value="fill">Fill</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-3 text-xs font-medium text-gray-700">
                        SCALE ({imageScale}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={imageScale}
                        onChange={(e) => {
                          if (isEditMode) {
                            isScalingFromSlider.current = true;
                            setIsManuallyTransformed(true);
                          }
                          setImageScale(Number(e.target.value))
                        }}
                        className="w-full slider"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="maintainRatio"
                        checked={maintainRatio}
                        onChange={(e) => setMaintainRatio(e.target.checked)}
                        className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-400"
                      />
                      <label htmlFor="maintainRatio" className="ml-3 text-sm text-gray-700">
                        Maintain aspect ratio
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
