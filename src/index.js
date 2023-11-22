const fs = require('fs');
const os = require('os');
const winston = require('winston');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const ThreadPool = require('./ThreadPool');
const threadPool = new ThreadPool(10); // Adjust the size to your needs


const argv = yargs(hideBin(process.argv)).argv;

const keywords = fs.readFileSync(argv.keywords, 'utf-8').split('\n');
const websites = fs.readFileSync(argv.websites, 'utf-8').split('\n').filter(website => {
    try {
      new URL(website);
      return true;
    } catch (error) {
      return false;
    }
  });


// Create a logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({ level: 'info' }),
    ],
});


const filteredKeywords = keywords.filter(keyword => keyword.trim() !== '');
const filteredWebsites = websites.filter(website => website.trim() !== '');


console.log(filteredKeywords)
console.log(filteredWebsites)


Promise.all(filteredWebsites.map((website) => threadPool.execute(website, filteredKeywords)))
    .then((results) => {
        logger.debug('Results:', results);
    })
    .catch((error) => {
        logger.error('Error:', error);
    });



// Log resource usage every second
// setInterval(() => {
//     const freeMemory = os.freemem();
//     const totalMemory = os.totalmem();
//     const cpuUsage = os.loadavg(); // This is not the CPU usage percentage. It's the system load average for the past 1, 5, and 15 minutes.

//     logger.info('Memory usage:', (totalMemory - freeMemory) / totalMemory);
//     logger.info('CPU usage:', cpuUsage);
// }, 1000);



