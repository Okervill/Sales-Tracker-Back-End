const setStaffTargets = (conn, targets) => {
    return new Promise((resolve, reject) => {
        let query = 'INSERT INTO staffTargets(business, ciot, date, employee, hbb, hours, new, payg, revenue, storecode, tech, upg, weighting) VALUES ?'
        conn.query(query, [targets], (err, resp) => {
            if(err) return reject(err);
            return resolve(resp);
        })

    })
}

const getStaffTargets = (conn, uid, date, storecode) => {
    return new Promise((resolve, reject) => {

        let query = 'SELECT * FROM staffTargets WHERE employee = ? AND date = ? AND storecode = ?';
        if(uid === 'all'){
            query = 'SELECT * FROM  staffTargets WHERE date = ? AND storecode = ?';
            conn.query(query, [date, storecode], (err, rows) => {
                if(err) return reject(err);
                return resolve(rows);
            })
        } else {
            conn.query(query, [uid, date, storecode], (err, rows) => {
                if(err) return reject(err);
                return resolve(rows);
            })
        }

    })
}

const updateStaffTargets = (conn, targets) => {
    return new Promise((resolve, reject) => {

        let query = 'UPDATE staffTargets SET new = ?, upg = ?, payg = ?, hbb = ?, ciot = ?, tech = ?, business = ?, revenue = ?, hours = ?, weighting = ? WHERE employee = ? AND date = ? AND storecode = ?'
        conn.query(query, [targets.new, targets.upg, targets.payg, targets.hbb, targets.ciot, targets.tech, targets.bus, targets.rev, targets.hours, targets.weighting, targets.employee, targets.date, targets.store], (err, resp) => {
            if(err) return reject(err);
            return resolve(resp);
        })

    })
}

const deleteStaffTargets = (conn, date, store) => {
    return new Promise((resolve, reject) => {

        let query = 'DELETE FROM staffTargets WHERE storecode = ? AND date = ?';
        conn.query(query, [store, date], (err, res) => {
            if(err) return reject(err);
            return resolve(res);
        })

    })
}

module.exports.setStaffTargets = setStaffTargets;
module.exports.updateStaffTargets = updateStaffTargets;
module.exports.deleteStaffTargets = deleteStaffTargets;
module.exports.getStaffTargets = getStaffTargets;