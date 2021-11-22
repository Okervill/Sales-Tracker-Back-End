const _ = require('lodash');
const aws = require('aws-sdk');
const {
    getSKUData
} = require('../models/ratecard');
const config = require('./config.json');
const {
    getConnection
} = require('../database/db');

aws.config.update({
    accessKeyId: config.awsAccesskeyID,
    secretAccessKey: config.awsSecretAccessKey,
    region: config.awsRegion
});

const textract = new aws.Textract();

const getSale = async (buffer, defaultstore) => {
    return new Promise(async (resolve, reject) => {
        const params = {
            Document: {
                Bytes: buffer
            }
        }
        const request = textract.detectDocumentText(params);
        const data = await request.promise();

        if (data && data.Blocks) {
            text = ''
            for (block of data.Blocks) {
                text += `${block.Text ? block.Text + '\n' : ''}`
            }
            saledata = await getSaleData(text, defaultstore)
                .catch(err => {
                    return reject(err);
                })
            return resolve(saledata);
        }
        return resolve(undefined);
    })
}

async function getSaleData(sale_str, defaultstore) {


    return new Promise(async (resolve, reject) => {

        const conn = await getConnection()
            .catch(err => {
                return reject(err)
            })

        lines = sale_str.split('\n')
        sale = {
            adviser: '',
            transactionID: '',
            orderNumber: '',
            skus: [],
            date: '',
            type: '',
            business: '',
            saves: '',
            revenue: 0,
            kpis: {
                kpinew: 0,
                upg: 0,
                payg: 0,
                hbbnew: 0,
                hbbupg: 0,
                ins: 0,
                ciot: 0,
                tech: 0,
                bus: 0,
                ent: 0
            }
        }
        let foundSkus = new Set()
        for (line of lines) {
            if (line.startsWith('Transaction ID')) {
                let transactionID = line.split(':')[1].split(' ').join('').trim();

                //Remove invalid char from transaction ID
                let valid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                transactionID = transactionID.split('')
                for (char of transactionID) {
                    if (valid.indexOf(char) == -1) {
                        transactionID.splice(transactionID.indexOf(char), 1)
                    }
                }
                transactionID = transactionID.join('')
                if(!transactionID.startsWith('60188') || !transactionID.startsWith('70153')){
                    transactionID = defaultstore + transactionID.substr(5);
                }
                sale.transactionID = transactionID;
                transdate = transactionID.substr(transactionID.length - 8);
                sale.date = `${transdate.substr(0, 4)}-${transdate.substr(4, 2)}-${transdate.substr(6, 2)}`;
            }
            if (line.startsWith('Order Number')) {
                sale.orderNumber = line.split(':')[1].trim();
                if (sale.orderNumber.split('-')[0] === 'EDM') {
                    sale.type = 'Upgrade';
                }
            }
            if (line.startsWith('You have been served by:')) {
                sale.adviser = line.split(':')[1].trim();
            }
            for (word of line.split(' ')) {
                if (word.length === 6 && !isNaN(word) && word.match(/[0-9]/g).length === word.length) {
                    if (foundSkus.has(word)) {
                        continue;
                    }
                    let skudata = await getSKUData(conn, sale.transactionID.substr(0,5), word)
                        .catch(err => {
                            return reject(err);
                        })
                    if (word == '107551') {
                        sale.kpis.hbbnew = 1;
                    }
                    if (skudata === undefined || skudata.length === 0) continue
                    skudata[0].valid = true;
                    sale.skus.push(skudata[0]);
                    foundSkus.add(word);
                }
            }
        }


        for (skucode of sale.skus) {

            //Upg
            if (sale.orderNumber.startsWith('EDM')) {
                sale.kpis.upg++
                //New
            } else if (sale.orderNumber.startsWith('SBL')) {
                if (!skucode.type.includes('HBB') && !skucode.type.includes('GIGAFAST')) {
                    sale.kpis.kpinew++
                    sale.type = "New"
                } else {
                    if (sale.kpis.hbbnew === 0) {
                        sale.kpis.hbbupg = 1
                    }
                    sale.type = 'HBB'
                }
            }
            //Check ent
            if (skucode.description.includes('Entertainment')) {
                sale.kpis.ent++
            }

            if (sale.type === 'New') {
                sale.revenue += parseFloat(skucode.newrev);
            } else {
                sale.revenue += parseFloat(skucode.upgrev);
            }

            //Update KPIs
            switch (skucode.type) {
                case 'CIOT':
                    sale.kpis.ciot++
                    break
                case 'Insurance':
                    sale.kpis.ins++
                    break
                case 'Tech':
                    sale.kpis.tech++
                    break
                default:
                    break
            }

        }

        return resolve(sale);
    })
}

exports.getSale = getSale;