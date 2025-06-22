import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [gifFramesData, setGifFramesData] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [margin, setMargin] = useState(0);
  const isScalingFromSlider = useRef(false);

  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const drawCheckerboard = (ctx, width, height) => {
    const squareSize = 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e0e0e0';
    for (let y = 0; y < height; y += squareSize) {
      for (let x = 0; x < width; x += squareSize) {
        if ((Math.floor(y / squareSize) + Math.floor(x / squareSize)) % 2 === 0) {
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
    }
  };

  const drawImageOnCanvas = useCallback(() => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = selectedRatio.width;
    canvas.height = selectedRatio.height;
    
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
      
      // Update image position and size for edit mode
      if (!isManuallyTransformed) {
        setImagePosition({ x, y });
        setImageSize({ width: drawWidth, height: drawHeight });
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
      imageSize, centerPoint, showCenterPoint, isTransparent, isManuallyTransformed, margin, isTransparentOutside, outsideBackgroundColor]);

  const drawResizeHandles = (ctx, x, y, width, height) => {
    const handleSize = 8;
    const handleColor = '#3b82f6';
    const handleBorderColor = '#ffffff';
    
    const handles = [
      // Corners
      { x: x - handleSize/2, y: y - handleSize/2, cursor: 'nw-resize', type: 'corner', direction: 'nw' },
      { x: x + width - handleSize/2, y: y - handleSize/2, cursor: 'ne-resize', type: 'corner', direction: 'ne' },
      { x: x - handleSize/2, y: y + height - handleSize/2, cursor: 'sw-resize', type: 'corner', direction: 'sw' },
      { x: x + width - handleSize/2, y: y + height - handleSize/2, cursor: 'se-resize', type: 'corner', direction: 'se' },
      // Sides
      { x: x + width/2 - handleSize/2, y: y - handleSize/2, cursor: 'n-resize', type: 'side', direction: 'n' },
      { x: x + width - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'e-resize', type: 'side', direction: 'e' },
      { x: x + width/2 - handleSize/2, y: y + height - handleSize/2, cursor: 's-resize', type: 'side', direction: 's' },
      { x: x - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'w-resize', type: 'side', direction: 'w' },
    ];
    
    handles.forEach(handle => {
      ctx.fillStyle = handleBorderColor;
      ctx.fillRect(handle.x - 1, handle.y - 1, handleSize + 2, handleSize + 2);
      
      ctx.fillStyle = handleColor;
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    });
    
    // Draw selection border
    ctx.strokeStyle = handleColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  };

  const drawCenterPoint = (ctx) => {
    const handleSize = 10;
    const handleColor = '#3b82f6';
    const handleBorderColor = '#ffffff';

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Center point is relative to image, so calculate canvas coordinates
    const centerX = imagePosition.x + centerPoint.x;
    const centerY = imagePosition.y + centerPoint.y;

    // Draw center point
    ctx.fillStyle = handleBorderColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, handleSize / 2 + 1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = handleColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, handleSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw crosshairs
    ctx.strokeStyle = handleColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - handleSize, centerY);
    ctx.lineTo(centerX + handleSize, centerY);
    ctx.moveTo(centerX, centerY - handleSize);
    ctx.lineTo(centerX, centerY + handleSize);
    ctx.stroke();
  };

  useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);

  const handleFrameChange = (frameIndex) => {
    if (!gifFramesData.length) return;
    const newFrameIndex = Number(frameIndex);
    setCurrentFrame(newFrameIndex);

    const frame = gifFramesData[newFrameIndex];
    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(originalImageData.width, originalImageData.height);
    imageData.data.set(frame);
    ctx.putImageData(imageData, 0, 0);
    img.src = canvas.toDataURL();
    img.onload = () => {
      setUploadedImage(img);
    }
  }

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();

      img.onload = () => {
        setOriginalImageData({
          width: img.width,
          height: img.height,
          dataUrl: dataUrl,
        });
        setIsManuallyTransformed(false);

        if (file.type === 'image/gif') {
          setIsGif(true);
          
          const base64 = dataUrl.split(',')[1];
          const binaryStr = atob(base64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          const gifReader = new GifReader(bytes);
          const frames = [];
          for (let i = 0; i < gifReader.numFrames(); i++) {
            const image_data = new Uint8ClampedArray(gifReader.width * gifReader.height * 4);
            gifReader.decodeAndBlitFrameRGBA(i, image_data);
            frames.push(image_data);
          }
          setGifFramesData(frames);
          setCurrentFrame(0);

          // Create first frame image for canvas
          const firstFrame = frames[0];
          const canvas = document.createElement('canvas');
          canvas.width = gifReader.width;
          canvas.height = gifReader.height;
          const ctx = canvas.getContext('2d');
          const imageData = ctx.createImageData(gifReader.width, gifReader.height);
          imageData.data.set(firstFrame);
          ctx.putImageData(imageData, 0, 0);

          const firstFrameImg = new Image();
          firstFrameImg.onload = () => {
            setUploadedImage(firstFrameImg);
          };
          firstFrameImg.src = canvas.toDataURL();

        } else {
          setIsGif(false);
          setGifFramesData([]);
          setUploadedImage(img);
        }
      }
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
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
      { x: imageX - handleSize/2, y: imageY - handleSize/2, direction: 'nw', cursor: 'nw-resize' },
      { x: imageX + imageWidth - handleSize/2, y: imageY - handleSize/2, direction: 'ne', cursor: 'ne-resize' },
      { x: imageX - handleSize/2, y: imageY + imageHeight - handleSize/2, direction: 'sw', cursor: 'sw-resize' },
      { x: imageX + imageWidth - handleSize/2, y: imageY + imageHeight - handleSize/2, direction: 'se', cursor: 'se-resize' },
      { x: imageX + imageWidth/2 - handleSize/2, y: imageY - handleSize/2, direction: 'n', cursor: 'n-resize' },
      { x: imageX + imageWidth - handleSize/2, y: imageY + imageHeight/2 - handleSize/2, direction: 'e', cursor: 'e-resize' },
      { x: imageX + imageWidth/2 - handleSize/2, y: imageY + imageHeight - handleSize/2, direction: 's', cursor: 's-resize' },
      { x: imageX - handleSize/2, y: imageY + imageHeight/2 - handleSize/2, direction: 'w', cursor: 'w-resize' },
    ];
    
    for (let handle of handles) {
      if (Math.abs(mousePos.x - (handle.x + handleSize/2)) <= handleSize/2 + tolerance &&
          Math.abs(mousePos.y - (handle.y + handleSize/2)) <= handleSize/2 + tolerance) {
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

  const handleCanvasMouseMove = (e) => {
    if (!isEditMode || !uploadedImage) return;
    
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);
    
    if (dragState.isDragging) {
      setIsManuallyTransformed(true);
      const deltaX = mousePos.x - dragState.startPos.x;
      const deltaY = mousePos.y - dragState.startPos.y;
      
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
        // Handle resize
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
        }
        
        // Scale from center point
        const originX = dragState.startPosition.x + dragState.startCenterPoint.x;
        const originY = dragState.startPosition.y + dragState.startCenterPoint.y;
        
        newX = originX - (dragState.startCenterPoint.x) * (newWidth / dragState.startSize.width);
        newY = originY - (dragState.startCenterPoint.y) * (newHeight / dragState.startSize.height);

        // Update center point
        const newCenterPoint = {
          x: dragState.startCenterPoint.x * (newWidth / dragState.startSize.width),
          y: dragState.startCenterPoint.y * (newHeight / dragState.startSize.height),
        }
        
        setImageSize({ width: newWidth, height: newHeight });
        setImagePosition({ x: newX, y: newY });
        setCenterPoint(newCenterPoint);
      }
    } else {
      // Update cursor based on hover
      const handle = getResizeHandle(mousePos, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);
      if (handle) {
        canvas.style.cursor = handle.cursor;
      } else if (showCenterPoint) {
        const centerX = imagePosition.x + centerPoint.x;
        const centerY = imagePosition.y + centerPoint.y;
        const dist = Math.sqrt(Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2));
        if (dist < 10) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = isPointInImage(mousePos, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height) ? 'move' : 'default';
        }
      } else if (isPointInImage(mousePos, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  const handleCanvasMouseUp = () => {
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
    
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    exportCanvas.width = selectedRatio.width;
    exportCanvas.height = selectedRatio.height;
    
    const outerWidth = exportCanvas.width - margin * 2;
    const outerHeight = exportCanvas.height - margin * 2;

    // Draw outer background if not transparent
    if (!isTransparentOutside) {
        exportCtx.fillStyle = outsideBackgroundColor;
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

    if (isTransparent) {
        exportCtx.clearRect(innerX, innerY, innerWidth, innerHeight);
    } else {
        exportCtx.fillStyle = insideBackgroundColor;
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
      link.download = `image-${selectedRatio.ratio.replace(':', 'x')}.${format}`;
      
      if (format === 'webp') {
        link.href = exportCanvas.toDataURL('image/webp', 0.9);
      } else {
        link.href = exportCanvas.toDataURL('image/png');
      }
      
      link.click();
      setIsExporting(false);
    }, 300);
  };

  const categories = [...new Set(PRESET_RATIOS.map(preset => preset.category))];

  useEffect(() => {
    if (!isEditMode || !uploadedImage || !isScalingFromSlider.current) return;
    
    const scaleFactor = imageScale / 100;

    const baseWidth = imageSize.width / (imageScale / 100);
    const baseHeight = imageSize.height / (imageScale / 100);

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

  }, [imageScale]);

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

  }, [isEditMode, uploadedImage, imageSize, imageScale, baseImageSize.width]);

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
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
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
                        setUploadedImage(null);
                        setOriginalImageData(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <img
                    src={originalImageData?.dataUrl}
                    alt="Uploaded"
                    className="object-cover w-full h-32 bg-gray-100 rounded-lg"
                  />
                  {isGif && gifFramesData.length > 0 && (
                    <div className="pt-2">
                      <label className="block mb-2 text-xs font-medium text-gray-700">
                        FRAME ({currentFrame + 1} / {gifFramesData.length})
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={gifFramesData.length - 1}
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
                              className={`w-full text-left p-3 rounded-md text-sm transition-colors ${
                                selectedRatio.name === preset.name
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
                            <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
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
