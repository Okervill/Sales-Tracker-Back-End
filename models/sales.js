const { getTransactionSKUs } = require('./transactionSKUs')

module.exports = {
    addSale(conn, saledata) {
        return new Promise((resolve, reject) => {
            query = 'INSERT INTO sales SET ?';
            conn.query(query, saledata, (err, res) => {
                if (err) return reject(err);
                return resolve(res);
            });
        });
    },
    getSalesByUser(conn, uid, startdate, enddate) {
        return new Promise((resolve, reject) => {

            query = 'SELECT * FROM sales WHERE employee = ? and date >= ? and date <= ?';
            conn.query(query, [uid, startdate, enddate], async (err, rows) => {
                if (err) return reject(err);
                for (row of rows) {
                    let skus = await getTransactionSKUs(conn, row.transactionnumber);
                    row.skus = skus;
                    let salerev = 0;
                    for (sku of skus) {
                        salerev += parseFloat(sku.rev);
                    }
                    row.salerev = salerev;
                }
                return resolve(rows);
            });

        });
    },
    getSaleByTransaction(conn, transactionnumber) {
        return new Promise((resolve, reject) => {
            query = 'SELECT * FROM sales WHERE transactionnumber = ?';
            conn.query(query, transactionnumber, (err, rows) => {
                if (err) return reject(err);
                return resolve(rows);
            })
        })
    },
    getSalesByStore(conn, store, startdate, enddate) {
        return new Promise((resolve, reject) => {

            let storecode = store + '%';

            query = 'SELECT * FROM sales WHERE transactionnumber like ? AND date >= ? AND date <= ?';
            conn.query(query, [storecode, startdate, enddate], async (err, rows) => {
                if (err) return reject(err);
                for (row of rows) {
                    let skus = await getTransactionSKUs(conn, row.transactionnumber);
                    row.skus = skus;
                    let salerev = 0;
                    for (sku of skus) {
                        salerev += parseFloat(sku.rev);
                    }
                    row.salerev = salerev;
                }
                return resolve(rows);
            })
        })
    }
}