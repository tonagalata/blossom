export type Category = 'arrangements' | 'events' | 'rentals'

export interface PortfolioItem {
  id: string
  src: string
  alt: string
  title: string
  category: Category
  wide: boolean
  visible: boolean
  order: number
  createdAt: string
}

export interface SiteConfig {
  heroImage: string
  aboutImage: string
  previewImages: [string, string, string, string]
  updatedAt: string
}

export interface InquiryAttachment {
  id: string
  inquiry_id: string
  filename: string
  content_type: string
  storage_url: string
}

export interface StripeConfig {
  publishableKey: string
  secretKey: string
  webhookSecret?: string
}

export interface PaymentRequest {
  id: string
  token: string
  created_at: string
  amount: number       // cents
  currency: string
  description: string
  client_name: string | null
  client_email: string | null
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  stripe_payment_intent_id: string | null
}

export interface MembershipPlan {
  id: string
  stripe_product_id: string | null
  stripe_price_id: string | null
  name: string
  description: string | null
  amount: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  active: number
  sort_order: number
}

export interface Member {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  password_hash: string
  created_at: string
  stripe_customer_id: string | null
  subscription_id: string | null
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null
  plan_id: string | null
  current_period_end: string | null
}

export interface MemberInquiry {
  id: string
  member_id: string
  created_at: string
  subject: string
  message: string
  status: 'open' | 'replied' | 'closed'
  reply: string | null
  replied_at: string | null
}

export interface Inquiry {
  id: string
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  event_type: string | null
  event_date: string | null
  guest_count: string | null
  venue: string | null
  budget: string | null
  color_palette: string | null
  message: string | null
  read: number
  attachments: InquiryAttachment[]
}
