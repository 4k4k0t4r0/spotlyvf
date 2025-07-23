import { apiClient } from './apiClient';

export interface GoogleReview {
  id: number;
  google_place_id: string;
  place_name: string;
  reviewer_name: string;
  reviewer_avatar_url?: string;
  reviewer_review_count: number;
  rating: number;
  review_text?: string;
  review_date: string;
  is_verified: boolean;
  helpful_count: number;
  business_response?: string;
  business_response_date?: string;
  scraped_at: string;
}

export interface GoogleReviewsResponse {
  place_id: string;
  reviews_in_database: number;
  reviews: GoogleReview[];
  last_updated?: string;
  total_reviews_on_google?: number;
  google_limitation_note?: string;
  limitation_explanation?: string;
}

export const googleReviewsApi = {
  // Obtener reseñas de Google para un lugar específico
  async getGoogleReviews(placeId: string, forceRefresh = false): Promise<GoogleReviewsResponse> {
    try {
      const url = `/google-reviews/by_place/?place_id=${placeId}&refresh=${forceRefresh}`;
      const response = await apiClient.getDirect(url);
      return response as GoogleReviewsResponse;
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      throw error;
    }
  },

  // Forzar scraping de reseñas
  async scrapeReviews(placeId: string) {
    try {
      return await apiClient.post('/google-reviews/scrape_now/', {
        place_id: placeId
      });
    } catch (error) {
      console.error('Error scraping Google reviews:', error);
      throw error;
    }
  }
};
