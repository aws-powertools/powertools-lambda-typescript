const fs = require('node:fs');
module.exports = async ({ context, core }) => {
  const filename = 'pr.txt';

  try {
    fs.writeFileSync(`./${filename}`, JSON.stringify(context.payload));

    return `PR successfully saved ${filename}`;
  } catch (err) {
    core.setFailed('Failed to save PR details');
    console.error(err);
  }
};
