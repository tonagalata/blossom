import type { LineItem } from './types'
import { randomId } from './randomId'

export function blankLineItem(sortOrder = 0): LineItem {
  return { id: randomId(), title: '', description: null, qty: 1, unit_price: 0, sort_order: sortOrder, image_url: null }
}
