const generate = require('csv-generate/lib/sync')
const parse = require('csv-parse/lib/sync')
const stringify = require('csv-stringify')
const transform = require('stream-transform')
const fs = require('fs').promises
const path = require('path')
// const readline = require('readline')
const util = require('util')

const dir = __dirname
const SHOP_FILE = 'FSP-Shop-orders-2020_06_08_18_50_58.csv'

let pf17
let isOutput = false

parseCsv()

async function parseCsv() {
  const content = await fs.readFile(path.join(dir, SHOP_FILE))

  const records = parse(content, {
    columns: true,
    on_record: (record, { lines }) => {
      // line_items
      const lineItems = parseItems(record, 'line_items')
      if (lineItems.name) {
        record.lineItemName = lineItems.name
        if (lineItems.name.startsWith('PorcFest 2020')) {
          record.category = 'PorcFest 2020'
        }
      }
      record.lineItems = lineItems

      // fee_items
      record.feeItems = parseItems(record, 'fee_items')

      // coupon_items
      record.couponItems = parseItems(record, 'coupon_items')

      // refunds
      record.refundItems = parseItems(record, 'refunds')

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
        // // props.sort()
        // console.log(props)

        isOutput = false
      }

      return record
    }
  })

  pf17 = records.filter(r => r.category === 'PorcFest 2020')

    // OUTPUT PorcFest 17 count
  console.log('pf17 count:')
  console.log(pf17.length)

  const json = records.map( JSON.stringify ).join('\n')

  console.log('-==] parseCsv done [==-')

  writeCsv()
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
