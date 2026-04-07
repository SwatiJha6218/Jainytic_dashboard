const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.static(__dirname + '/public'));

app.use('/bc', createProxyMiddleware({
  target: 'http://38.10.111.250:29925',
  changeOrigin: true,
  pathRewrite: { '^/bc': '' },
  on: {
    proxyReq: (proxyReq) => {
      const credentials = Buffer.from('mk2:Pbtpl@135').toString('base64');
      proxyReq.setHeader('Authorization', `Basic ${credentials}`);
    },
    error: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}));

app.listen(3001, '0.0.0.0', () => {
  console.log('✅ Proxy + static server running!');
  console.log('📊 Open dashboard at: http://localhost:5500');
});