# Spotlyvf Backend - 30 Microservices Architecture

## 1. Authentication Service (auth_service)
- **Purpose**: User registration, login, JWT token management
- **Models**: User, UserProfile, RefreshToken

## 2. User Management Service (user_service)
- **Purpose**: User profile management, preferences
- **Models**: UserPreferences, UserSettings

## 3. Business Service (business_service)
- **Purpose**: Business registration and profile management
- **Models**: Business, BusinessProfile, BusinessVerification

## 4. Location Service (location_service)
- **Purpose**: Geographic data and location management
- **Models**: Location, City, State, Country

## 5. Category Service (category_service)
- **Purpose**: Place categories management
- **Models**: Category, Subcategory

## 6. Place Service (place_service)
- **Purpose**: Core place information management
- **Models**: Place, PlaceImages, PlaceFeatures

## 7. Review Service (review_service)
- **Purpose**: Reviews and ratings management
- **Models**: Review, ReviewImage, ReviewLike

## 8. Reservation Service (reservation_service)
- **Purpose**: Booking and reservation management
- **Models**: Reservation, ReservationSlot, TimeSlot

## 9. Search Service (search_service)
- **Purpose**: Advanced search and filtering
- **Models**: SearchHistory, PopularSearch

## 10. Recommendation Service (recommendation_service)
- **Purpose**: AI-powered place recommendations
- **Models**: Recommendation, RecommendationFeedback

## 11. Notification Service (notification_service)
- **Purpose**: Push notifications and alerts
- **Models**: Notification, NotificationTemplate, DeviceToken

## 12. Payment Service (payment_service)
- **Purpose**: Payment processing for reservations
- **Models**: Payment, PaymentMethod, Transaction

## 13. Analytics Service (analytics_service)
- **Purpose**: User behavior and app analytics
- **Models**: UserActivity, PlaceVisit, EventTracking

## 14. Content Service (content_service)
- **Purpose**: Static content and CMS
- **Models**: Content, Banner, Promotion

## 15. Social Service (social_service)
- **Purpose**: Social features, follows, sharing
- **Models**: Follow, Share, SocialPost

## 16. Chat Service (chat_service)
- **Purpose**: In-app messaging between users and businesses
- **Models**: Conversation, Message, MessageStatus

## 17. Rating Service (rating_service)
- **Purpose**: Complex rating algorithms and aggregation
- **Models**: RatingMetric, RatingWeight, RatingHistory

## 18. Image Service (image_service)
- **Purpose**: Image upload, processing, and storage
- **Models**: Image, ImageMetadata, ImageProcessing

## 19. Cache Service (cache_service)
- **Purpose**: Redis cache management
- **Models**: CacheEntry, CacheConfig

## 20. Log Service (log_service)
- **Purpose**: Application logging and monitoring
- **Models**: LogEntry, ErrorLog, PerformanceLog

## 21. Email Service (email_service)
- **Purpose**: Email notifications and templates
- **Models**: EmailTemplate, EmailQueue, EmailLog

## 22. SMS Service (sms_service)
- **Purpose**: SMS notifications and verification
- **Models**: SMSTemplate, SMSQueue, SMSLog

## 23. Verification Service (verification_service)
- **Purpose**: Account and business verification
- **Models**: VerificationCode, VerificationRequest

## 24. Report Service (report_service)
- **Purpose**: User reports and content moderation
- **Models**: Report, ReportType, Moderation

## 25. Favorite Service (favorite_service)
- **Purpose**: User favorites and wishlist
- **Models**: Favorite, FavoriteList, WishlistItem

## 26. Schedule Service (schedule_service)
- **Purpose**: Business hours and availability
- **Models**: BusinessHours, Holiday, SpecialHours

## 27. Pricing Service (pricing_service)
- **Purpose**: Dynamic pricing and promotions
- **Models**: PriceRange, Promotion, Discount

## 28. Integration Service (integration_service)
- **Purpose**: Third-party API integrations
- **Models**: APIKey, Integration, WebhookLog

## 29. Backup Service (backup_service)
- **Purpose**: Data backup and recovery
- **Models**: BackupJob, BackupLog, RecoveryPoint

## 30. Health Service (health_service)
- **Purpose**: System health monitoring
- **Models**: HealthCheck, SystemStatus, ServiceHealth
