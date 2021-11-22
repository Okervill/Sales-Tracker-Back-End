function getAllRates(obj) {
    //Gets all new and upg skus successfully with no edits to the sheet

    let allSKUs = new Map();

    obj[0].data.splice(0, 1)
    obj[1].data.splice(0, 1)

    //Tariff SKUs

    for (row of obj[0].data) {

        let skuData = {
            type: row[0],
            sku: row[1] === undefined ? row[6] : row[1],
            description: row[6],
            newrev: 0,
            upgrev: 0
        }

        if (allSKUs.has(skuData.sku)) {
            skuData = allSKUs.get(skuData.sku)
        }

        if (row[7] == 'Retention') {
            skuData.upgrev = parseFloat(row[8]).toFixed(2)
        } else if (row[7] == 'Acquisition') {
            skuData.newrev = parseFloat(row[8]).toFixed(2)
        }

        allSKUs.set(skuData.sku, skuData)

    }

    //Non-Tariff SKUs

    for (row of obj[1].data) {

        let skuData = {
            type: '',
            sku: '',
            description: '',
            newrev: 0,
            upgrev: 0
        }

        if (row[0] != undefined && row[1] != undefined && row[2] != undefined && row[3] != undefined) {

            skuData.description = row[0]
            skuData.sku = String(row[1]).length === 5 ? `0${String(row[1])}` : String(row[1])
            skuData.newrev = parseFloat(row[3]).toFixed(2)
            skuData.upgrev = parseFloat(row[3]).toFixed(2)
            skuData.type = 'Accessories'

            allSKUs.set(skuData.sku, skuData)

            skuData = {
                type: '',
                sku: '',
                description: '',
                newrev: 0,
                upgrev: 0
            }
        }

        if (row[5] != undefined && row[6] != undefined && row[7] != undefined && row[8] != undefined) {

            skuData.description = row[5]
            skuData.sku = String(row[6]).length === 5 ? `0${String(row[6])}` : String(row[6])
            skuData.newrev = parseFloat(row[8]).toFixed(2)
            skuData.upgrev = parseFloat(row[8]).toFixed(2)
            skuData.type = 'CIOT'

            allSKUs.set(skuData.sku, skuData)

            skuData = {
                type: '',
                sku: '',
                description: '',
                newrev: 0,
                upgrev: 0
            }
        }

        if (row[13] != undefined && row[15] != undefined && row[16] != undefined && row[17] != undefined) {

            skuData.description = row[15]
            skuData.sku = String(row[13]).length === 5 ? `0${String(row[13])}` : String(row[13])
            skuData.newrev = parseFloat(row[17]).toFixed(2)
            skuData.upgrev = parseFloat(row[17]).toFixed(2)
            skuData.type = 'Insurance'

            allSKUs.set(skuData.sku, skuData)

            skuData = {
                type: '',
                sku: '',
                description: '',
                newrev: 0,
                upgrev: 0
            }
        }

        if (row[19] != undefined && row[20] != undefined && row[21] != undefined && row[22] != undefined) {

            skuData.description = row[20]
            skuData.sku = String(row[19]).length === 5 ? `0${String(row[19])}` : String(row[19])
            skuData.newrev = parseFloat(row[22]).toFixed(2)
            skuData.upgrev = parseFloat(row[22]).toFixed(2)
            skuData.type = 'Tech'

            allSKUs.set(skuData.sku, skuData)

            skuData = {
                type: '',
                sku: '',
                description: '',
                newrev: 0,
                upgrev: 0
            }
        }
    }


    let ratesArray = new Array(...allSKUs).map(rate => rate[1]);
    return ratesArray;

}

module.exports.getAllRates = getAllRates;