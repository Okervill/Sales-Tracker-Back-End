const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = express();
const moment = require('moment');
const xlsx = require('node-xlsx');

//Initialise Firebase Admin
const admin = require("firebase-admin");
const serviceAccount = require("./firebaseAdminKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://albayan-30531-default-rtdb.europe-west1.firebasedatabase.app"
});

//DB
const { getConnection } = require('./database/db');

//Models
const { createRateCardTable, insertSKUData, getSKUData, insertRateCard, getRateCards, getStoresRateCards, getActiveRateCard, updateActiveRatecard } = require('./models/ratecard');
const { getAllRates } = require('./models/rateParser');
const { addSale, getSalesByUser, getSaleByTransaction, getSalesByStore } = require('./models/sales');
const { addTransactionSKUs } = require('./models/transactionSKUs');
const { getStoreTargets, setStoreTargets, updateStoreTargets } = require('./models/storeTargets');
const { getStaffTargets, setStaffTargets, deleteStaffTargets } = require('./models/staffTargets');

//Textract
const { getSale } = require('./textract/getTextFromImage');

let conn = undefined;

getConnection()
  .then(connection => {
    conn = connection;
  })

const httpPort = 80;
const httpsPort = 443;
const hostname = 'api.albayan.io';

const ssloptions = {
  cert: fs.readFileSync('./ssl/api_albayan_io.crt'),
  ca: fs.readFileSync('./ssl/api_albayan_io.ca-bundle'),
  key: fs.readFileSync('./ssl/api_albayan_io.key')
}

const httpServer = http.createServer(app);
const httpsServer = https.createServer(ssloptions, app);

app.use(cors());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(fileUpload());
//app.use(express.static('public'));

app.options('*', cors());

app.get('/', (req, res, next) => {
  res.redirect('https://albayan.io');
});

app.use((req, res, next) => {
  if (req.protocol === 'http') {
    res.redirect(301, `https://${req.headers.host}${req.url}`)
  }
  let authToken = req.get('authToken');
  if (authToken == undefined) {
    res.status(401).send({
      "Invalid Token": "No token supplied."
    });
    return console.log(`${moment().format('DD/MM/YY HH:mm:ss')} | ${req.url} | ${req.ip} | No token supplied`);
  }
  admin.auth().verifyIdToken(authToken)
    .then(isValid => {
      console.log(`${moment().format('DD/MM/YY HH:mm:ss')} | ${req.url} | ${req.ip} | ${isValid.email} `);
      next();
    })
    .catch(err => {
      res.status(401).send({
        "Invalid Token": "The supplied token is not valid."
      });
      console.log(`${moment().format('DD/MM/YY HH:mm:ss')} | ${req.url} | ${req.ip} | ${err.code}`);
    })
});

//POST HANDLERS

app.post('/post/ratecard', (req, res, next) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send({ "error": "No files were uploaded." });
  }

  let ratecard = req.files.ratecard;
  let ratecardname = req.body.ratecardname;
  let storecode = req.body.storecode;
  let tablename = storecode + ratecardname;

  let filepath = `./tmp/${ratecard.name}`
  ratecard.mv(filepath)
    .then(() => {
      if (!fs.existsSync(filepath)) {
        return res.status(400).send({ "error": "No files were uploaded." });
      };
      let rateSheetObj = xlsx.parse(filepath);
      insertRateCard(conn, tablename)
        .then(() => {
          createRateCardTable(conn, tablename)
            .then(() => {
              let ratesArrayObj = getAllRates(rateSheetObj);
              let ratesArray = ratesArrayObj.map(obj => {
                return Object.keys(obj).sort().map(key => {
                  return obj[key];
                })
              });
              insertSKUData(conn, tablename, ratesArray)
                .then(() => {
                  return res.status(200).send({ "success": "Rate card created: " + tablename });
                })
                .catch(err => {
                  console.error(err);
                  return res.status(500).send({ "error": err });
                })
            })
            .catch(err => {
              console.error(err);
              return res.status(500).send({ "error": err });
            })
        })
    })
    .catch(err => {
      return res.status(500).send({ "error": err })
    })
    .catch(err => {
      console.error(err);
      return res.status(500).send({ "error": err });
    })

})

app.post('/post/sale', (req, res, next) => {
  let saledata = JSON.parse(req.body.saledata);
  let saleskus = JSON.parse(req.body.saleskus);
  getSaleByTransaction(conn, saledata.transactionnumber)
    .then(transaction => {
      if (transaction.length >= 1) {
        res.status(200).send({ "error": "Sale already exists" })
      } else {
        addSale(conn, saledata)
          .catch(err => console.error(err));
        addTransactionSKUs(conn, saleskus)
          .catch(err => console.error(err));
        res.status(200).send(JSON.stringify(saledata));
      }
    })
})

app.post('/post/receipt', (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    console.log('No files were uploaded.');
    return res.status(400).send('No files were uploaded.');
  }

  let receiptdata = req.files.receiptdata;
  let defaultstore = req.body.defaultstore;

  let filepath = `./tmp/${receiptdata.name}`
  receiptdata.mv(filepath)
    .then(() => {
      if (!fs.existsSync(filepath)) console.log('no file');
      let img = fs.readFileSync(filepath);
      getSale(img, defaultstore)
        .then(data => {
          getSaleByTransaction(conn, data.transactionID)
            .then(transaction => {
              if (transaction.length >= 1) {
                data.exists = true;
              } else {
                data.exists = false;
              }
              res.status(200).send(data);
            })
            .catch(err => {
              console.error(err);
              res.status(500).send(err);
            })
        })
        .catch(err => {
          console.error(err);
          res.status(500).send(err);
        })
    })
    .catch(err => {
      console.error(err)
      res.status(500).send({ "error": err })
    })
})

app.post('/users/disable', (req, res, next) => {
  let uid = JSON.parse(req.body.uid);
  admin.auth().getUser(uid)
    .then(user => {
      if (user.disabled) {
        admin.auth().updateUser(uid, {
          disabled: false
        })
          .catch(err => {
            console.error(err);
            res.status(500).send(err);
          })
      } else {
        admin.auth().updateUser(uid, {
          disabled: true
        })
          .catch(err => {
            console.error(err);
            res.status(500).send(err);
          })
      }
      user.disabled = !user.disabled
      res.status(200).send(user);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    })
})

app.post('/users/create', (req, res, next) => {
  let userdata = JSON.parse(req.body.userdata);
  admin.auth().createUser({
    email: userdata.email,
    displayName: userdata.firstname + ' ' + userdata.surname,
    password: userdata.password,
    disabled: userdata.disabled
  }).then(userRecord => {
    res.status(200).send(userRecord);
  }).catch(err => {
    res.status(500).send(err);
  })
})

app.post('/ratecards/activate', (req, res, next) => {
  let tablename = req.body.tablename;
  getActiveRateCard(conn, tablename.substr(0, 5))
    .then(ratecard => {
      let currentRatecard = ratecard[0].tablename;
      if (tablename === currentRatecard) {
        return res.status(200).send({ "success": "Ratecard updated: " + currentRatecard });
      }
      updateActiveRatecard(conn, currentRatecard, false)
        .then(() => {
          updateActiveRatecard(conn, tablename, true)
            .then(() => {
              return res.status(200).send({ "success": "Ratecard activated: " + tablename })
            }).catch(err => {
              return res.status(500).send({ err })
            })
        }).catch(err => {
          return res.status(500).send({ err })
        })
    })
})

app.post('/post/targets', (req, res, next) => {
  let targets = JSON.parse(req.body.targets);
  let date = targets.date;
  let isValid = moment(date, 'YYYY-MM-DD', true).isValid();
  targets.date = moment(date, 'YYYY-MM-DD'. true).startOf('month').format('YYYY-MM-DD');
  if(!isValid){
    return res.status(500).send('Invalid date provided');
  }
  getStoreTargets(conn, targets.store, targets.date)
    .then(resp => {
      if(resp.length === 0){
        setStoreTargets(conn, targets)
          .then(result => {
            return res.status(200).send(result);
          })
          .catch(err => {
            console.error(err);
            return res.status(500).send(err);
          })
      } else {
        updateStoreTargets(conn, targets)
          .then(result => {
            return res.status(200).send(result);
          })
          .catch(err => {
            console.error(err);
            return res.status(500).send(err);
          })
      }
    })

})

app.post('/post/stafftargets', (req, res, next) => {
  let targets = JSON.parse(req.body.targets);
  let date = JSON.parse(req.body.date);
  let store = JSON.parse(req.body.storecode);

  let isValid = moment(date, 'YYYY-MM-DD', true).isValid()
  if (!isValid) {
    return res.status(500).send('Invalid date provided');
  }

  deleteStaffTargets(conn, date, store)
    .then(() => {
      setStaffTargets(conn, targets)
        .then(resp => {
          return res.status(200).send(resp);
        })
        .catch(err => {
          console.error(err);
          return res.status(500).send(err);
        })
    })
    .catch(err => {
      console.error(err);
      return res.status(500).send(err);
    })
})

//GET HANDLERS

app.get('/get/stafftargets/:storecode/:date/:uid', (req, res, next) => {
  let storecode = req.params.storecode;
  let date = req.params.date;
  let uid = req.params.uid;

  let isValid = moment(date, 'YYYY-MM-DD', true).isValid()
  if (!isValid) {
    return res.status(500).send('Invalid date provided');
  }

  getStaffTargets(conn, uid, date, storecode)
    .then(targets => {
      return res.status(200).send(targets);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).send(err);
    })
})

app.get('/get/storetargets/:storecode/:date', (req, res, next) => {
  let storecode = req.params.storecode;
  let paramdate = req.params.date;

  let isValid = moment(paramdate, 'YYYY-MM-DD', true).isValid()
  if (!isValid) {
    return res.status(500).send('Invalid date provided');
  }

  let date = moment(paramdate, 'YYYY-MM-DD', true).startOf('month').format('YYYY-MM-DD');

  getStoreTargets(conn, storecode, date)
    .then(targets => {
      return res.status(200).send(targets);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).send(err);
    })
})

app.get('/get/usersales/:uid/:startdate/:enddate', (req, res, next) => {

  let uid = req.params.uid;
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;

  if (uid.startsWith('store-')) {

    getSalesByStore(conn, uid.split('-')[1], startdate, enddate)
      .then(sales => {
        res.status(200).send(sales)
      })
      .catch(err => {
        console.error(err);
        res.status(500).send({
          "error": "An error occurred."
        });
      })

  } else {

    getSalesByUser(conn, uid, startdate, enddate)
      .then(sales => {
        res.status(200).send(sales);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send({
          "error": "An error occurred."
        });
      })

  }
})

app.get('/get/sku/:storecode/:skucode', (req, res, next) => {

  let storecode = req.params.storecode;
  let sku = req.params.skucode;

  getSKUData(conn, storecode, sku)
    .then(data => {
      if (data.length === 0) {
        res.send({
          "error": "SKU Not Found"
        });
      } else {
        data[0].valid = true;
        res.send(data[0]);
      }
    });
});

app.get('/get/ratecards/:storecode', (req, res, next) => {
  let storecode = req.params.storecode;
  if (storecode === 'all') {
    getRateCards(conn)
      .then(rows => {
        res.status(200).send(rows);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send(err);
      })
  } else {
    getStoresRateCards(conn, storecode)
      .then(rows => {
        res.status(200).send(rows);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send(err);
      })
  }
})

app.get('/get/storesales/:storecode/:startdate/:enddate', (req, res, next) => {

  let storecode = req.params.storecode;
  let startdate = req.params.startdate;
  let enddate = req.params.enddate;

  getSalesByStore(conn, storecode, startdate, enddate)
    .then(sales => {
      res.status(200).send(sales);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    })
})

httpServer.listen(httpPort, hostname);
httpsServer.listen(httpsPort, hostname, () => {
  console.log(`Listening for traffic on: ${hostname}:${httpsPort}`)
});