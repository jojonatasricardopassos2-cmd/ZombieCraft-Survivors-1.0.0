const https = require('https');

https.get('https://www.myinstants.com/pt/instant/see-you-71367/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const match = data.match(/media\/sounds\/[^"']+\.mp3/);
    if (match) {
        console.log('FOUND:', match[0]);
    } else {
        console.log('Not found');
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
