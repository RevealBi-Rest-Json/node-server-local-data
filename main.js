var express = require('express');
var reveal = require('reveal-sdk-node');
var cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Step 0 - Create API to Retrieve Dashboards - this is only necessary if you want to list dashboards in your client UI
app.get('/dashboards', (req, res) => {
  const directoryPath = './dashboards';
  fs.readdir(directoryPath, (err, files) => {
    const fileNames = files.map((file) => {
    const { name } = path.parse(file);
    return { name };
    });
    res.send(fileNames);
  });
});


// Step 1.5 - **New Endpoint** - Serve the local `data.json` file
app.get('/local-data', (req, res) => {
  const dataPath = path.join(__dirname, 'appdata', 'data.json');
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading the data file.');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.parse(data));
  });
});

// Step 1 - Optional, userContext
const userContextProvider = (request) => {
  const userId = request.headers['x-header-one']; 
  console.log("in userContextProvider " + userId);  
  var props = new Map();
  props.set("userId", userId); 
  return new reveal.RVUserContext(userId, props);
};

// Step 2 - Set up your Authentication Provider
  const authenticationProvider = async (userContext, dataSource) => {
    if (dataSource instanceof reveal.RVODataDataSource) {
      return new reveal.RVUsernamePasswordDataSourceCredential("", ""); 
    }
  }

// Step 3 - Set up your Data Source Provider
const dataSourceProvider = async (userContext, dataSource) => {
  console.log("Enter Data Source Provider");
  if (dataSource instanceof reveal.RVRESTDataSource) {
    if (dataSource.id === "SalesByCategory") {
      dataSource.url = "http://localhost:7066/local-data";
    }
  }
  return dataSource;
}

// Step 4 - Set up your Data Source Item Provider, not required for REST Data Source
const dataSourceItemProvider = async (userContext, dataSourceItem) => {
  await dataSourceProvider(userContext, dataSourceItem.dataSource);
  return dataSourceItem;
  }

// Step 5 - Set up your Reveal Options
const revealOptions = {
    userContextProvider: userContextProvider,
    //authenticationProvider: authenticationProvider,
    dataSourceProvider: dataSourceProvider,
    dataSourceItemProvider: dataSourceItemProvider,
    localFileStoragePath: "data"
}

// Step 6 - Initialize Reveal with revealOptions
app.use('/', reveal(revealOptions));

// Step 7 - Start your Node Server
app.listen(7066, () => {
    console.log(`Reveal server accepting http requests`);
});
