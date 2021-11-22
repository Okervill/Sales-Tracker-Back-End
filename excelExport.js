// Set up
const excel = require('excel4node');
const { getConnection } = require('./database/db');
const { getSalesByStore } = require('./models/sales');
const workbook = new excel.Workbook();
const sheet = workbook.addWorksheet('Sheet 1');

async function main() {
    const conn = await getConnection();
    const allSales = await getSalesByStore(conn, '60188', '2021-01-1', '2022-01-01');

    //Headers
    let count = 1
    for (let key of Object.keys(allSales[0])) {
        sheet.cell(1, count).string(key);
        count++;
    }

    //Sale info
    for (let i = 0; i < allSales.length; i++) {
        let j = 1;
        for (let key of Object.keys(allSales[i])) {
            if (key === 'skus') {
                let skuString = '';
                for (sku of allSales[i][key]) {
                    skuString += `${sku.sku} `;
                }
                sheet.cell(i + 2, j).string(skuString.toString());
            } else {
                sheet.cell(i + 2, j).string(allSales[i][key].toString());
            }
            j++;
        }
        console.log(i);
    }

    workbook.write('exportedData.xlsx')
}

main();