// Create this as scripts/updateCricketNews.js
const { exec } = require('child_process');
const path = require('path');

function updateCricketNews() {
  const pythonScript = path.join(__dirname, 'cricket_news_fetcher.py');
  console.log('Running cricket news update...');
  
  exec(`python "${pythonScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing cricket news script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Cricket news script stderr: ${stderr}`);
    }
    
    console.log(stdout);
  });
}

module.exports = updateCricketNews;