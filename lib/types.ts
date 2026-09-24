export type Category = string

export interface PortfolioCategory {
  value: string
  label: string
}

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

export interface HeroSlide {
  type: 'image' | 'video'
  src: string
}

export interface SiteConfig {
  previewImages: [string, string, string, string]
  heroSlides: HeroSlide[]
  heroSlideDuration: number
  updatedAt: string
}

export interface LandingContent {
  hero: {
    subtitle: string
    buttonLabel: string
  }
  about: {
    eyebrow: string
    title: string
    body: string
    ctaLabel: string
  }
  services: {
    heading: string
    items: { title: string; desc: string }[]
  }
  gallery: {
    heading: string
  }
  testimonial: {
    quote: string
    attribution: string
  }
  testimonials: { quote: string; attribution: string }[]
  cta: {
    heading: string
    buttonLabel: string
  }
}

export interface PopupOption {
  value: string
  label: string
}

export interface PopupContent {
  eyebrow: string
  title: string
  body: string
  image: string
  options: PopupOption[]
}

export interface AboutPageContent {
  eyebrow: string
  title: string
  body1: string
  body2: string
  image: string
  ctaLabel: string
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

// ─── Business Management ───────────────────────────────────────────────────────

export interface Customer {
  id: string
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  company: string | null
  address: string | null
  notes: string | null
  source: 'inquiry' | 'manual'
  inquiry_id: string | null
}

export interface LineItem {
  id: string
  title: string
  description: string | null
  qty: number
  unit_price: number // cents
  sort_order: number
  image_url: string | null
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'

export interface Proposal {
  id: string
  created_at: string
  updated_at: string
  customer_id: string
  token: string
  title: string
  event_date: string | null
  status: ProposalStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  valid_until: string | null
  notes: string | null
  terms: string | null
  sent_at: string | null
  viewed_at: string | null
  responded_at: string | null
  deposit_percentage: number
  payment_request_id: string | null
  line_items: LineItem[]
  signature: ESignature | null
  payment_request_token: string | null
  deposit_status: 'pending' | 'paid' | 'cancelled' | null
}

export interface ProposalLineItem extends LineItem {
  proposal_id: string
}

export interface ESignature {
  id: string
  signer_name: string
  signer_email: string
  signature_data: string
  signed_at: string
  ip_address: string | null
  user_agent: string | null
  document_hash: string
}

export interface ProposalSignature extends ESignature {
  proposal_id: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'

export interface Invoice {
  id: string
  created_at: string
  updated_at: string
  customer_id: string
  proposal_id: string | null
  token: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string | null
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  currency: string
  notes: string | null
  terms: string | null
  sent_at: string | null
  payment_request_id: string | null
  line_items: LineItem[]
  signature: ESignature | null
  payment_request_token: string | null
}

export interface InvoiceLineItem extends LineItem {
  invoice_id: string
}

export interface InvoiceSignature extends ESignature {
  invoice_id: string
}

export interface DashboardStats {
  openInquiries: number
  outstandingInvoiceTotal: number
  pendingProposals: number
  activeMembers: number
  mrr: number
}
