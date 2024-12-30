const fs = require("fs");
const sax = require("sax");
const https = require('https');
const path = require('path');
const {Readable} = require('stream');

function downloadFile(url) {
  https.get(url, (response) => {
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'downloaded-file';

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+?)"/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const filePath = path.resolve(__dirname, filename);
    const fileStream = fs.createWriteStream(filePath);

    response.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log(`File downloaded: ${filePath}`);
    });

    fileStream.on('error', (err) => {
      console.error(`Error writing file: ${err.message}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading file: ${err.message}`);
  });
}

let saxStream = sax.createStream(true)
saxStream.on("error", function (e) {
  console.error("error!", e)
  this._parser.error = null
  this._parser.resume()
})

let tag = ''
saxStream.on('opentag', function (node) {
  tag = node.name

  if (node.name !== 'enclosure') {
    return
  }

  let url = node.attributes.url
  console.log('Getting', url)
  downloadFile(url)
});

saxStream.on('text', function (text) {
  if (tag === 'title') {
    console.log(text)
  }
});

let source = process.argv[2]
let pipes = new Promise(((resolve) => {
  saxStream.on('end', () => {
    resolve()
  })
  fetch(source).then(res => {
    let stream = Readable.fromWeb(res.body)
    stream.pipe(saxStream)
  });
}))
