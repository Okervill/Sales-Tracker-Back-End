const mysql = require('mysql');

const getConnection = () => {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '3825443',
            database: 'salestracker'
        });
        connection.connect(err => {
            return reject(err);
        });
        return resolve(connection);
    })
}

module.exports.getConnection = getConnection