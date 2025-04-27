const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/getResponse', (req, res) => {
  // Implement your getResponse logic here

//   import fs from 'fs';
//   import path from 'path';
  
//   export default function handler(req, res) {
//     if (req.method === 'GET') {
//       const filePath = path.join(process.cwd(), 'data', 'response.json');
//       if (fs.existsSync(filePath)) {
//         const fileContents = fs.readFileSync(filePath, 'utf8');
//         res.status(200).json(JSON.parse(fileContents));
//       } else {
//         res.status(200).json({ response: '' });
//       }
//     } else {
//       res.status(405).json({ message: 'Method not allowed' });
//     }
//   }
  



  res.json({ message: 'Response from getResponse' });
});

app.post('/api/saveResponse', (req, res) => {
  // Implement your saveResponse logic here

//   import fs from 'fs';
//   import path from 'path';
  
//   export default function handler(req, res) {
//     if (req.method === 'POST') {
//       const { response } = req.body;
//       const filePath = path.join(process.cwd(), 'data', 'response.json');
//       fs.writeFileSync(filePath, JSON.stringify({ response }));
//       res.status(200).json({ message: 'Response saved' });
//     } else {
//       res.status(405).json({ message: 'Method not allowed' });
//     }
//   }

  res.json({ message: 'Response saved successfully' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
