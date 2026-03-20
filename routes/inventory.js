var express = require('express');
var router = express.Router();
let Inventory = require('../schemas/inventory')
let Product = require('../schemas/products')

// GET all inventories (with populated product)
router.get('/', async function (req, res, next) {
  try {
    let data = await Inventory.find({}).populate({ path: 'product' })
    res.status(200).send(data)
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
})

// GET inventory by id (with product)
router.get('/:id', async function (req, res, next) {
  try {
    let inv = await Inventory.findById(req.params.id).populate({ path: 'product' })
    if (!inv) return res.status(404).send({ message: 'Inventory not found' })
    res.status(200).send(inv)
  } catch (error) {
    res.status(404).send({ message: 'Inventory not found' })
  }
})

// helper to find inventory by product id
async function findInventoryByProduct(productId) {
  return await Inventory.findOne({ product: productId })
}

// Add stock: { product, quantity }
router.post('/add_stock', async function (req, res, next) {
  try {
    let { product, quantity } = req.body
    quantity = Number(quantity || 0)
    if (!product || quantity <= 0) return res.status(400).send({ message: 'Invalid product or quantity' })

    let inv = await findInventoryByProduct(product)
    if (!inv) return res.status(404).send({ message: 'Inventory not found for product' })
    inv.stock = inv.stock + quantity
    await inv.save()
    res.status(200).send(inv)
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
})

// Remove stock: { product, quantity }
router.post('/remove_stock', async function (req, res, next) {
  try {
    let { product, quantity } = req.body
    quantity = Number(quantity || 0)
    if (!product || quantity <= 0) return res.status(400).send({ message: 'Invalid product or quantity' })

    let inv = await findInventoryByProduct(product)
    if (!inv) return res.status(404).send({ message: 'Inventory not found for product' })
    if (inv.stock < quantity) return res.status(400).send({ message: 'Insufficient stock' })
    inv.stock = inv.stock - quantity
    await inv.save()
    res.status(200).send(inv)
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
})

// reservation: reduce stock and increase reserved
router.post('/reservation', async function (req, res, next) {
  try {
    let { product, quantity } = req.body
    quantity = Number(quantity || 0)
    if (!product || quantity <= 0) return res.status(400).send({ message: 'Invalid product or quantity' })

    let inv = await findInventoryByProduct(product)
    if (!inv) return res.status(404).send({ message: 'Inventory not found for product' })
    if (inv.stock < quantity) return res.status(400).send({ message: 'Insufficient stock to reserve' })
    inv.stock -= quantity
    inv.reserved += quantity
    await inv.save()
    res.status(200).send(inv)
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
})

// sold: reduce reserved and increase soldCount
router.post('/sold', async function (req, res, next) {
  try {
    let { product, quantity } = req.body
    quantity = Number(quantity || 0)
    if (!product || quantity <= 0) return res.status(400).send({ message: 'Invalid product or quantity' })

    let inv = await findInventoryByProduct(product)
    if (!inv) return res.status(404).send({ message: 'Inventory not found for product' })
    if (inv.reserved < quantity) return res.status(400).send({ message: 'Insufficient reserved quantity to mark sold' })
    inv.reserved -= quantity
    inv.soldCount += quantity
    await inv.save()
    res.status(200).send(inv)
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
})

module.exports = router
