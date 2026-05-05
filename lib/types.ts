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

export interface InquirySubmission {
  id: string
  created_at: string
  data: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    event_type?: string
    event_date?: string
    guest_count?: string
    budget?: string
    venue?: string
    color_palette?: string
    message?: string
    [key: string]: string | undefined
  }
}
