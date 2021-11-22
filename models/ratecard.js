/*
Add a new rate card:
> Upload file
> Enter ratecard name (e.g. July 2021)
> POST to name and file to server
> CREATE TABLE "ratecard name"(sku varchar(6) not null, type varchar(x) not null,
     description varchar(x) not null, newrev varchar(x) not null, upgrev varchar(x) not null)
> "INSERT INTO ratecards ?" > {storecode, ratecard name, active?}

Change current rate card:
> Admin Page
> Page loads current rate cards from "ratecard" table as <select>*
    Where active ratecard != selected save button appears
*/


//Start of "ratecard" table
const getRateCards = conn => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM ratecards';
        conn.query(query, (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        })
    })
}

const getStoresRateCards = (conn, storecode) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM ratecards WHERE storecode = ?';
        conn.query(query, storecode, (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        })
    })
}

const getActiveRateCard = (conn, storecode) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM ratecards WHERE storecode = ? AND active = ?'
        conn.query(query, [storecode, true], (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        })
    })
}

const updateActiveRatecard = (conn, tablename, active) => {
    return new Promise((resolve, reject) => {
        let query = 'UPDATE ratecards SET active = ? WHERE tablename = ?';
        conn.query(query, [active, tablename], (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        })
    })
}

const insertRateCard = (conn, tablename) => {
    return new Promise(async (resolve, reject) => {
        let query = 'INSERT INTO ratecards(storecode, tablename, active) VALUES (?,?,?)';
        let storecode = tablename.substr(0, 5);
        let activeTable = await getActiveRateCard(conn, storecode);
        let active = false;
        if (activeTable.length === 0) {
            active = true;
        }
        conn.query(query, [storecode, tablename, active], (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        })
    })
}
//End of "ratecard" table

//Specific rates table

const createRateCardTable = (conn, name) => {
    return new Promise((resolve, reject) => {
        let query = `CREATE TABLE ??(sku varchar(20) not null primary key, type varchar(20) not null, description varchar(250) not null, newrev varchar(20) not null, upgrev varchar(20) not null)`
        conn.query(query, name, (err, res) => {
            if (err) return reject(err);
            return resolve(true);
        })
    })
}

const insertSKUData = (conn, tablename, sku) => {
    return new Promise((resolve, reject) => {
        let query = 'INSERT INTO ??(description, newrev, sku, type, upgrev) VALUES ?';
        conn.query(query, [tablename, sku], (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        })
    })
}

const getSKUData = (conn, storecode, sku) => {
    return new Promise(async (resolve, reject) => {
        let activeTable = await getActiveRateCard(conn, storecode);
        if (activeTable.length === 0) {
            return reject({ "error": "There is no active ratecard for store: " + storecode })
        }
        let tablename = activeTable[0].tablename;
        let query = 'SELECT * FROM ?? WHERE sku = ?';
        conn.query(query, [tablename, sku], (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        })
    })
}


module.exports.insertRateCard = insertRateCard;

module.exports.getRateCards = getRateCards;
module.exports.getStoresRateCards = getStoresRateCards
module.exports.getActiveRateCard = getActiveRateCard;
module.exports.updateActiveRatecard = updateActiveRatecard;

module.exports.insertSKUData = insertSKUData;
module.exports.getSKUData = getSKUData;

module.exports.createRateCardTable = createRateCardTable;