import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_COMMERCE, normalizeCommerce, productPricing, validateCommerce } from '../../../packages/core/src/productCommerce'
import { commerceSignals } from '../src/services/storefrontCommerce'
import { remainingOfferTime } from '../src/services/productPresentation'
import type { Product } from '../src/types/database'

const now = Date.parse('2026-09-03T18:00:00Z')
const future = '2026-09-03T19:00:00Z'
const past = '2026-09-03T17:00:00Z'

test('defaults do not invent discounts, installments or scarcity', () => {
  assert.deepEqual(normalizeCommerce(null), DEFAULT_COMMERCE)
  const result = productPricing(249.9, null, undefined, now)
  assert.equal(result.pix, 249.9)
  assert.equal(result.discount, 0)
  assert.equal(result.commerce.installments, 1)
})
test('promotion, Pix and installments share one calculation', () => {
  const result = productPricing(200, 180, { installments: 12, pixDiscountPercent: 10 }, now)
  assert.equal(result.current, 180)
  assert.equal(result.pix, 162)
  assert.equal(result.discount, 19)
  assert.equal(result.installment, 15)
})
test('timed promotion expires without restarting', () => {
  assert.equal(productPricing(200, 180, {offerEnabled:true,offerEndsAt:future}, now).current, 180)
  assert.equal(productPricing(200, 180, {offerEnabled:true,offerEndsAt:past}, now).current, 200)
  assert.equal(remainingOfferTime(past, now), 0)
  assert.equal(remainingOfferTime(future, now), 3600)
  assert.equal(remainingOfferTime('invalid', now), 0)
})
test('invalid commercial conditions are rejected', () => {
  assert.ok(validateCommerce({...DEFAULT_COMMERCE,offerEnabled:true},200,180,now))
  assert.ok(validateCommerce({...DEFAULT_COMMERCE,offerEnabled:true,offerEndsAt:past},200,180,now))
  assert.ok(validateCommerce({...DEFAULT_COMMERCE,installments:0},200,180,now))
  assert.ok(validateCommerce({...DEFAULT_COMMERCE,pixDiscountPercent:100},200,180,now))
  assert.ok(validateCommerce(DEFAULT_COMMERCE,200,201,now))
  assert.equal(validateCommerce({...DEFAULT_COMMERCE,offerEnabled:true,offerEndsAt:future},200,180,now),null)
})
test('last unit requires opted-in controlled inventory', () => {
  const p = {price:200,stock:1,manage_stock:true,commerce:{...DEFAULT_COMMERCE,showLastUnit:true}} as Product
  assert.equal(commerceSignals(p,now).stock,1)
  assert.equal(commerceSignals({...p,manage_stock:false},now).stock,undefined)
  assert.equal(commerceSignals({...p,commerce:DEFAULT_COMMERCE},now).stock,undefined)
  assert.notEqual(commerceSignals({...p,stock:0},now).stock,1)
  assert.notEqual(commerceSignals({...p,stock:2},now).stock,1)
})
test('expired offer loses its campaign badge and countdown', () => {
  const p = {price:200,commerce:{...DEFAULT_COMMERCE,offerEnabled:true,offerEndsAt:past,badge:'daily'}} as Product
  assert.equal(commerceSignals(p,now).badge,'none')
  assert.equal(commerceSignals(p,now).offerEndsAt,undefined)
})
