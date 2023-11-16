const path = require('path');
const crypto = require('crypto');
const fileUploader = require('../src/Utils/multer');

jest.mock('crypto');

describe('fileUploader', () => {
  describe('storage', () => {
    it('should set the correct destination path', () => {
      const mockCb = jest.fn();
      const mockRequest = {};
      const mockFile = {};
      const expectedPath = path.resolve(__dirname, '..', '..', 'files', 'uploads');

      fileUploader.storage.destination(mockRequest, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(null, expectedPath);
    });

    it('should generate a random filename', () => {
      const mockCb = jest.fn();
      const mockRequest = {};
      const mockFile = { originalname: 'example.pdf' };

      crypto.randomBytes.mockImplementationOnce((size, callback) => {
        const mockHash = Buffer.from('mockhash123');
        callback(null, mockHash);
      });

      fileUploader.storage.filename(mockRequest, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(null, 'mockhash123-example.pdf');
    });
  });

  describe('fileFilter', () => {
    it('should accept valid file formats', () => {
      const mockCb = jest.fn();
      const mockRequest = {};
      const mockFile = { mimetype: 'application/pdf' };

      fileUploader.fileFilter(mockRequest, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(null, true);
    });

    it('should reject invalid file formats', () => {
      const mockCb = jest.fn();
      const mockRequest = {};
      const mockFile = { mimetype: 'image/jpeg' };

      fileUploader.fileFilter(mockRequest, mockFile, mockCb);

      expect(mockCb).toHaveBeenCalledWith(new Error('Invalid format.'));
    });
  });
});
