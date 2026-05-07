const { Jimp } = require('jimp');

async function makeCircular() {
  try {
    const image = await Jimp.read('public/logo.png');
    image.circle();
    await image.write('public/logo.png');
    console.log('Logo cropped successfully.');
  } catch (err) {
    console.error('Error cropping logo:', err);
  }
}

makeCircular();
