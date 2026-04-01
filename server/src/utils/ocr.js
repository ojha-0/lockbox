const Tesseract = require('tesseract.js');

// Lazily create a single worker shared by all OCR calls — loading the
// English traineddata on every request would be very slow.
let workerPromise = null;
const getWorker = () => {
  if (!workerPromise) workerPromise = Tesseract.createWorker('eng');
  return workerPromise;
};

const runOcrOnFile = async (filePath) => {
  const worker = await getWorker();
  const { data } = await worker.recognize(filePath);
  return data?.text || '';
};

module.exports = { runOcrOnFile };
