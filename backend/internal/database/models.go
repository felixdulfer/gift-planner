package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     *string   `gorm:"uniqueIndex" json:"email,omitempty"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Groups          []Group          `gorm:"foreignKey:CreatedBy" json:"-"`
	GroupMembers    []GroupMember    `gorm:"foreignKey:UserID" json:"-"`
	Events          []Event          `gorm:"foreignKey:CreatedBy" json:"-"`
	Receivers       []Receiver       `gorm:"foreignKey:CreatedBy" json:"-"`
	Wishlists       []Wishlist       `gorm:"foreignKey:CreatedBy" json:"-"`
	Gifts           []Gift           `gorm:"foreignKey:CreatedBy" json:"-"`
	GiftAssignments []GiftAssignment `gorm:"foreignKey:AssignedToUserID" json:"-"`
	Credentials     []WebAuthnCredential `gorm:"foreignKey:UserID" json:"-"`
}

// Group represents a group of users
type Group struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string     `gorm:"not null" json:"name"`
	Description *string    `json:"description,omitempty"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	CreatedBy   string     `gorm:"type:uuid;not null" json:"createdBy"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Creator User          `gorm:"foreignKey:CreatedBy" json:"-"`
	Members []GroupMember `gorm:"foreignKey:GroupID" json:"-"`
	Events  []Event       `gorm:"foreignKey:GroupID" json:"-"`
}

// GroupMember represents the join table between users and groups
type GroupMember struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GroupID   string    `gorm:"type:uuid;not null;index" json:"groupId"`
	UserID    string    `gorm:"type:uuid;not null;index" json:"userId"`
	JoinedAt  time.Time `gorm:"autoCreateTime" json:"joinedAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Group Group `gorm:"foreignKey:GroupID" json:"-"`
	User  User  `gorm:"foreignKey:UserID" json:"-"`
}

// Event represents an event within a group
type Event struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GroupID     string     `gorm:"type:uuid;not null;index" json:"groupId"`
	Name        string     `gorm:"not null" json:"name"`
	Description *string    `json:"description,omitempty"`
	Date        *time.Time `json:"date,omitempty"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	CreatedBy   string     `gorm:"type:uuid;not null" json:"createdBy"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Group     Group      `gorm:"foreignKey:GroupID" json:"-"`
	Creator   User       `gorm:"foreignKey:CreatedBy" json:"-"`
	Receivers []Receiver `gorm:"foreignKey:EventID" json:"-"`
	Wishlists []Wishlist `gorm:"foreignKey:EventID" json:"-"`
}

// Receiver represents a gift receiver for an event
type Receiver struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	EventID   string    `gorm:"type:uuid;not null;index" json:"eventId"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	CreatedBy string    `gorm:"type:uuid;not null" json:"createdBy"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Event     Event      `gorm:"foreignKey:EventID" json:"-"`
	Creator   User       `gorm:"foreignKey:CreatedBy" json:"-"`
	Wishlists []Wishlist `gorm:"foreignKey:ReceiverID" json:"-"`
}

// Wishlist represents a wishlist for a receiver
type Wishlist struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ReceiverID string    `gorm:"type:uuid;not null;index" json:"receiverId"`
	EventID   *string    `gorm:"type:uuid;index" json:"eventId,omitempty"`
	Name      *string    `json:"name,omitempty"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	CreatedBy string     `gorm:"type:uuid;not null" json:"createdBy"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Receiver Receiver `gorm:"foreignKey:ReceiverID" json:"-"`
	Event    *Event   `gorm:"foreignKey:EventID" json:"-"`
	Creator  User     `gorm:"foreignKey:CreatedBy" json:"-"`
	Gifts    []Gift   `gorm:"foreignKey:WishlistID" json:"-"`
}

// Gift represents a gift item in a wishlist
type Gift struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	WishlistID  string     `gorm:"type:uuid;not null;index" json:"wishlistId"`
	Name        string     `gorm:"not null" json:"name"`
	Picture     *string    `json:"picture,omitempty"`
	Link        *string    `json:"link,omitempty"`
	IsQualified bool       `gorm:"default:false" json:"isQualified"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	CreatedBy   string     `gorm:"type:uuid;not null" json:"createdBy"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Wishlist   Wishlist        `gorm:"foreignKey:WishlistID" json:"-"`
	Creator    User            `gorm:"foreignKey:CreatedBy" json:"-"`
	Assignments []GiftAssignment `gorm:"foreignKey:GiftID" json:"-"`
}

// GiftAssignment represents an assignment of a gift to a user
type GiftAssignment struct {
	ID               string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GiftID           string     `gorm:"type:uuid;not null;index" json:"giftId"`
	AssignedToUserID string     `gorm:"type:uuid;not null;index" json:"assignedToUserId"`
	AssignedAt       time.Time  `gorm:"autoCreateTime" json:"assignedAt"`
	AssignedBy       string     `gorm:"type:uuid;not null" json:"assignedBy"`
	IsPurchased      bool       `gorm:"default:false" json:"isPurchased"`
	PurchasedAt      *time.Time `json:"purchasedAt,omitempty"`
	UpdatedAt        time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	Gift            Gift `gorm:"foreignKey:GiftID" json:"-"`
	AssignedToUser  User `gorm:"foreignKey:AssignedToUserID" json:"-"`
	AssignedByUser  User `gorm:"foreignKey:AssignedBy" json:"-"`
}

// WebAuthnCredential stores WebAuthn credentials for users
type WebAuthnCredential struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID          string    `gorm:"type:uuid;not null;index" json:"userId"`
	CredentialID    []byte    `gorm:"type:bytea;not null;uniqueIndex" json:"-"`
	PublicKey       []byte    `gorm:"type:bytea;not null" json:"-"`
	Counter         uint32    `gorm:"default:0" json:"counter"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

// WebAuthnSession stores temporary WebAuthn session data
type WebAuthnSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    *string   `gorm:"type:uuid;index" json:"userId,omitempty"`
	Challenge []byte    `gorm:"type:bytea;not null" json:"-"`
	SessionData []byte  `gorm:"type:bytea;not null" json:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	ExpiresAt time.Time `gorm:"not null;index" json:"expiresAt"`

	// Relations
	User *User `gorm:"foreignKey:UserID" json:"-"`
}

// BeforeCreate hook to generate UUID for User
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for Group
func (g *Group) BeforeCreate(tx *gorm.DB) error {
	if g.ID == "" {
		g.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for GroupMember
func (gm *GroupMember) BeforeCreate(tx *gorm.DB) error {
	if gm.ID == "" {
		gm.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for Event
func (e *Event) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for Receiver
func (r *Receiver) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for Wishlist
func (w *Wishlist) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" {
		w.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for Gift
func (g *Gift) BeforeCreate(tx *gorm.DB) error {
	if g.ID == "" {
		g.ID = uuid.New().String()
	}
	return nil
}

// BeforeCreate hook to generate UUID for GiftAssignment
func (ga *GiftAssignment) BeforeCreate(tx *gorm.DB) error {
	if ga.ID == "" {
		ga.ID = uuid.New().String()
	}
	return nil
}

