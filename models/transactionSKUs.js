/*

const transactionSKUs = {
    transactionnumber: 'varchar(20)',
    sku: 'varchar(20)',
    type: 'varchar(20)',
    description: 'varchar(250)',
    rev: 'varchar(20)'
}

*/

module.exports = {
    addTransactionSKUs(conn, saledata) {
        return new Promise((resolve, reject) => {
            query = 'INSERT INTO transactionSKUs SET ?';
            conn.query(query, saledata, (err, res) => {
                if (err) return reject(err)
                return resolve(res)
            });
        })
    },
    getTransactionSKUs(conn, transactionnumber) {
        return new Promise((resolve, reject) => {
            query = 'SELECT * FROM transactionSKUs WHERE transactionnumber = ?'
            conn.query(query, transactionnumber, (err, rows) => {
                if (err) return reject(err)
                return resolve(rows)
            })
        })
    }
}