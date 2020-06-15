// const generate = require('csv-generate/lib/sync')
const parse = require('csv-parse/lib/sync')
const stringify = require('csv-stringify')
// const transform = require('stream-transform')
const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
// const readline = require('readline')
const util = require('util')

const dir = __dirname
const dataDir = path.join(__dirname, '../data')
const outputDir = path.join(__dirname, '../static')

const dataFile
  = 'FSP-Shop-orders-2020_06_14_19_43_03.csv'
  // = 'FSP-Shop-orders-2020_06_14_12_22_50.csv'
  // = 'FSP-Shop-orders-2020_06_08_12_06_37.csv'
  // = 'FSP-Shop-orders-2020_06_12_10_10_02.csv'

const SHOP_FILE = path.join(dataDir, dataFile)

let pf17 = []
let lookups = {
  status: []
}
let isOutput = false

parseCsv()

async function parseCsv() {
  const content = await fs.readFile(SHOP_FILE)

  const records = parse(content, {
    columns: true,
    on_record: (record, { lines }) => {
      // line_items
      const lineItems = parseItems(record, 'line_items')
      if (lineItems.id) {
        if (lineItems.name.startsWith('PorcFest 2020')) {
          record.category = 'PorcFest 2020'
        }
        record.lineItemName = lineItems.name
        record.lineItemQuantity = lineItems.quantity
      }
      record.lineItems = lineItems

      // fee_items
      record.feeItems = parseItems(record, 'fee_items')

      // coupon_items
      record.couponItems = parseItems(record, 'coupon_items')

      // refunds
      record.refundItems = parseItems(record, 'refunds')

      // lookups: status
      if (record.category === 'PorcFest 2020') {
        let statusIdx = lookups.status.findIndex(s => s.name === record.status)
        if (statusIdx === -1) {
          lookups.status.push({ name: record.status, count: 1 })
        } else {
          lookups.status[statusIdx].count++
        }
        // if (!lookups.status.includes(record.status)) {
        //   lookups.status.push(record.status)
        // }
      }

      if (isOutput) {
        console.log('lines:' + JSON.stringify(lines))

        console.log('record:')
        // console.log(JSON.stringify(record))
        console.log(util.inspect(record, {
          showHidden: false,
          compact: false,
          maxArrayLength: Infinity
        }, 'utf-8'))

        // OUTPUT fields
        // console.log('fields:')
        // let props = Object.keys(record)
        // props.sort()
        // console.log(props)

        isOutput = false
      }

      return record
    }
  })

  pf17 = records.filter(r => r.category === 'PorcFest 2020')

  const reg = pf17.filter(pf => (pf.status === 'processing' || pf.status === 'completed') && pf.lineItemQuantity > 1)
  const care = pf17.filter(pf => pf.status === 'cancelled' || pf.status === 'refunded')
  const foh = pf17.filter(pf => pf.status === 'failed' || pf.status === 'on-hold')

  const pf17Count = pf17.reduce(regSum, 0)
  const pf17RegCount = reg.reduce(regSum, 0)
  const pf17CareCount = care.reduce(regSum, 0)
  const pf17FohCount = foh.reduce(regSum, 0)

  // sort lookups
  Object.keys(lookups).forEach(key => {
    lookups[key].sort()
  })

    // OUTPUT PorcFest 17 count
    console.log('pf17 records: ' + pf17.length + ', count: ' + pf17Count)
    console.log('pf17 reg: ' + reg.length + ', count: ' + pf17RegCount)
    console.log('pf17 care: ' + care.length + ', count: ' + pf17CareCount)
    console.log('pf17 foh: ' + foh.length + ', count: ' + pf17FohCount)

  const json = records.map( JSON.stringify ).join('\n')

  console.log('-==] parseCsv done [==-')

  writeFile(lookups, 'lookups.js')
  writeFile(pf17, 'pf17.js')
  writeFile(reg, 'pf17-reg.js')
  writeFile(care, 'pf17-care.js')
  writeFile(foh, 'pf17-foh.js')

  // writeCsv()
  writeJso()
  writeJson(pf17, 'pf17')
  writeJson(reg, 'pf17-reg')
  writeJson(care, 'pf17-care')
}

function parseItems(record, items_name) {
  if (!record[items_name]) { return {} }

  const items = {}

  record[items_name].split('|').forEach(element => {
    const item = element.split(':')
    items[item[0]] = item[1]
  })

  return items
}

const regSum = (acc, curr) => acc + curr.lineItemQuantity * 1

function propSum(arr, prop) {
  return arr.reduce((acc, curr) => acc + curr[prop], 0)
}

function writeCsv() {
  console.log('starting writeCsv...')

  stringify(pf17, {
    header: true,
    columns: [
      'order_id', 'date', 'status',
      'discount_total', 'order_total', 'refunded_total', 'payment_method',
      'billing_first_name', 'billing_last_name', 'billing_company',
      'billing_email', 'billing_phone',
      'billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_country',
      'customer_note',
      'lineItems.name', 'lineItems.product_id', 'lineItems.quantity', 'lineItems.subtotal', 'lineItems.total', 'lineItems.refunded', 'lineItems.refunded_qty',
      'feeItems.title', 'feeItems.total',
      'couponItems.code', 'couponItems.amount', 'couponItems.description',
      'refundItems.date', 'refundItems.amount', 'refundItems.reason'
    ]
  }, (err, output) => {
    if (err) throw err

    fs.writeFile('pf17.csv', output, err => {
      if (err) throw err
      console.log('pf17.csv written')
    })
  })

  // // const records = []
  // const records = generate(pf17, {
  //   seed: 1,
  //   columns: [
  //     'order_id', 'date', 'status',
  //     'discount_total', 'order_total', 'refunded_total', 'payment_method',
  //     'billing_first_name', 'billing_last_name', 'billing_company',
  //     'billing_email', 'billing_phone',
  //     'billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_country',
  //     'customer_note',
  //     'lineItems.name', 'lineItems.product_id', 'lineItems.quantity', 'lineItems.subtotal', 'lineItems.total', 'lineItems.refunded', 'lineItems.refunded_qty',
  //     'feeItems.title', 'feeItems.total',
  //     'couponItems.code', 'couponItems.amount', 'couponItems.description',
  //     'refundItems.date', 'refundItems.amount', 'refundItems.reason'
  //   ]
  // })
  // .on('readable', function() {
  //   let record
  //   while (record = this.read()) {
  //     records.push(record)
  //   }
  // })
  // .on('error', err => { console.error(err) })
  // .on('end', function () {

  // })

  // console.log(util.inspect(records))
  console.log('done write')
}

function writeFile(arr, filename, arrName) {
  const outputFile = path.join(outputDir, filename)

  fsSync.writeFileSync(outputFile, util.inspect(arr, {
    showHidden: false,
    compact: false,
    maxArrayLength: Infinity
  }, 'utf-8'))

  let count, outputName
  if (Array.isArray(arr)) {
    outputName = arrName ? arrName : 'items'
    count = arr.length
  } else {
    outputName = 'properties'
    count = Object.keys(arr).length
  }

  console.log('wrote ' + filename + ' with ' + count + ' ' + outputName)
}

function writeFileRaw(arr, filename, arrName) {
  const outputName = arrName ? arrName : 'items'
  const outputFile = path.join(outputDir, filename)

  fsSync.writeFileSync(outputFile, arr.join('\n'), 'utf-8')

  console.log('wrote raw ' + filename + ' with ' + arr.length + ' ' + outputName)
}

function writeJso() {
  writeFile(pf17, 'pf17.js')
  writeFile(lookups, 'lookups.js')
}

function writeJson(arr, filename) {
  filename = filename || 'output'

  fsSync.writeFileSync(
    path.join(outputDir, filename + '.json'),
    JSON.stringify(arr),
    'utf-8'
  )

  console.log('wrote ' + filename + '.json')
}
