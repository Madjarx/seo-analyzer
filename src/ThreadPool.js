const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

class ThreadPool {
  constructor(size) {
    this.size = size;
    this.threads = Array(size).fill(null);
    this.tasks = [];
  }

  execute(website, keywords) {
    return new Promise((resolve, reject) => {
      try {
        new URL(website); 
      } catch (error) {
        console.error(`Error while executing task for website ${website}:`, error.message);
        resolve({ error: error.message });
      }

      const worker = new Worker('./src/worker.js', { workerData: { website, keywords } });
      const results = [];

      worker.on('message', (message) => {
        if (message.error) {
          reject(new Error(message.error));
        } else {
          results.push(message);
        }
      });

      worker.on('error', reject);

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        } else {
          const filename = path.join(__dirname, 'data', 'results', `${new URL(website).hostname}.json`);
          fs.writeFile(filename, JSON.stringify(results, null, 2), (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        }
      });
    });
  }
}

module.exports = ThreadPool;