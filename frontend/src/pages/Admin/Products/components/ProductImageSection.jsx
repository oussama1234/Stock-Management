import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCw, Download, Eye, Image as ImageIcon } from 'lucide-react';
import { useImageUrl } from '../hooks/useImageUrl';

const ProductImageSection = memo(({ product }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  
  const { getImageUrl } = useImageUrl();
  
  const images = product?.images || [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[selectedImageIndex] : null;
  const currentImageUrl = currentImage ? getImageUrl(currentImage) : null;

  const handleImageSelect = useCallback((index) => {
    setSelectedImageIndex(index);
  }, []);

  const handleImageModal = useCallback((open) => {
    setIsImageModalOpen(open);
    if (!open) {
      setImageZoom(1);
      setImageRotation(0);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setImageZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setImageRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!currentImageUrl) return;
    
    try {
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product?.name || 'product'}-image-${selectedImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }, [currentImageUrl, product?.name, selectedImageIndex]);

  if (!product) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6"
      >
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-2xl mb-4"></div>
          <div className="flex space-x-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 w-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6"
      >
        {/* Main Image Display */}
        <div className="relative group">
          {hasImages ? (
            <div className="relative h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
              <motion.img
                key={selectedImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={currentImageUrl}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="w-full h-full object-contain cursor-zoom-in"
                onClick={() => handleImageModal(true)}
                loading="lazy"
              />
              
              {/* Image Overlay Actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleImageModal(true)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors duration-200"
                    title="View full size"
                  >
                    <Eye className="h-5 w-5 text-gray-700" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDownloadImage}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors duration-200"
                    title="Download image"
                  >
                    <Download className="h-5 w-5 text-gray-700" />
                  </motion.button>
                </div>
              </div>
              
              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>
          ) : (
            <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No images available</p>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {hasImages && images.length > 1 && (
          <div className="mt-6">
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleImageSelect(index)}
                  className={`flex-shrink-0 relative ${
                    selectedImageIndex === index
                      ? 'ring-3 ring-blue-500 ring-offset-2'
                      : 'ring-1 ring-gray-200 hover:ring-gray-300'
                  } rounded-xl overflow-hidden transition-all duration-200`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} - Thumbnail ${index + 1}`}
                    className="h-20 w-20 object-cover"
                    loading="lazy"
                  />
                  {selectedImageIndex === index && (
                    <div className="absolute inset-0 bg-blue-500/20" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && currentImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => handleImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Controls */}
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleZoomOut}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors duration-200"
                  title="Zoom out"
                >
                  <ZoomOut className="h-5 w-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleZoomIn}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors duration-200"
                  title="Zoom in"
                >
                  <ZoomIn className="h-5 w-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRotate}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors duration-200"
                  title="Rotate"
                >
                  <RotateCw className="h-5 w-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDownloadImage}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors duration-200"
                  title="Download"
                >
                  <Download className="h-5 w-5 text-gray-700" />
                </motion.button>
              </div>
              
              {/* Modal Image */}
              <motion.img
                src={currentImageUrl}
                alt={`${product.name} - Full size`}
                className="max-w-full max-h-full object-contain rounded-2xl"
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out'
                }}
              />
              
              {/* Zoom Level Indicator */}
              {imageZoom !== 1 && (
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  {Math.round(imageZoom * 100)}%
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ProductImageSection.displayName = 'ProductImageSection';

export default ProductImageSection;