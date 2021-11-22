const getStoreTargets = (conn, storecode, date) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM storeTargets WHERE storecode = ? AND date = ?';
        conn.query(query, [storecode, date], (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        })
    })
}

const setStoreTargets = (conn, targets) => {
    return new Promise((resolve, reject) => {
        let query = 'INSERT INTO storeTargets(storecode, date, new, upg, payg, hbb, ciot, tech, business, revenue) VALUES(?,?,?,?,?,?,?,?,?,?)';
        conn.query(query, [targets.store, targets.date, targets.new, targets.upg, targets.payg, targets.hbb, targets.ciot, targets.tech, targets.bus, targets.rev], (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        })
    })
}

const updateStoreTargets = (conn, targets) => {
    return new Promise((resolve, reject) => {

        let query = 'UPDATE storeTargets SET new = ?, upg = ?, payg = ?, hbb = ?, ciot = ?, tech = ?, business = ?, revenue = ? WHERE storecode = ? AND date = ?';
        conn.query(query, [targets.new, targets.upg, targets.payg, targets.hbb, targets.ciot, targets.tech, targets.bus, targets.rev, targets.store, targets.date], (err, res) => {
            if(err) return reject(err);
            return resolve(res);
        })

    })
}

module.exports.getStoreTargets = getStoreTargets;
module.exports.setStoreTargets = setStoreTargets;
module.exports.updateStoreTargets = updateStoreTargets;