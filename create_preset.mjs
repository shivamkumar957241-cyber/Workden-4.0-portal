import https from 'https';

const data = JSON.stringify({
  name: 'workden_unsigned',
  unsigned: true
});

const options = {
  hostname: 'api.cloudinary.com',
  port: 443,
  path: '/v1_1/dynrihmjd/upload_presets',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('391877286629736:vXF0lsYpNUQNfYhcPzQnKgP0WHc').toString('base64')
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
