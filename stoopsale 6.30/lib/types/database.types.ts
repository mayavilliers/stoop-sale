// Hand-authored to match supabase/migrations/0001_init.sql.
// In a project with the Supabase CLI linked, regenerate with: `npm run db:types`.

export type UserRole = "USER" | "ADMIN";
export type SaleType = "GARAGE" | "STOOP" | "YARD" | "MOVING" | "ESTATE" | "OTHER";
export type Category =
  | "FURNITURE" | "CLOTHING" | "KIDS_BABY" | "BOOKS" | "RECORDS" | "ELECTRONICS"
  | "HOME_GOODS" | "VINTAGE" | "TOOLS" | "FREE_STUFF" | "OTHER";
export type ListingStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "DELETED";
export type ReportReason =
  | "SPAM" | "INAPPROPRIATE" | "SCAM" | "WRONG_LOCATION" | "ALREADY_ENDED" | "OTHER";
export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          image: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          image?: string | null;
          role?: UserRole;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      sale_listings: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          sale_type: SaleType;
          description: string;
          categories: Category[];
          address: string;
          neighborhood: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          latitude: number;
          longitude: number;
          starts_at: string;
          ends_at: string;
          notes: string | null;
          cash_only: boolean;
          venmo_accepted: boolean;
          early_birds_ok: boolean;
          rain_date: string | null;
          status: ListingStatus;
          reported_count: number;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          sale_type: SaleType;
          description?: string;
          categories?: Category[];
          address: string;
          neighborhood?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          latitude: number;
          longitude: number;
          starts_at: string;
          ends_at: string;
          notes?: string | null;
          cash_only?: boolean;
          venmo_accepted?: boolean;
          early_birds_ok?: boolean;
          rain_date?: string | null;
          status?: ListingStatus;
          // moderation fields — set by admins / seed, not by the create form
          reported_count?: number;
          is_hidden?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["sale_listings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sale_listings_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_photos: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          width: number | null;
          height: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          url: string;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["sale_photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sale_photos_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "sale_listings";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_sales: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: { id?: string; user_id: string; listing_id: string };
        Update: Partial<Database["public"]["Tables"]["saved_sales"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "saved_sales_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "sale_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_sales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          listing_id: string;
          reporter_id: string | null;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          reporter_id?: string | null;
          reason: ReportReason;
          details?: string | null;
          status?: ReportStatus;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "sale_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      submit_report: {
        Args: { p_listing_id: string; p_reason: ReportReason; p_details?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      sale_type: SaleType;
      category: Category;
      listing_status: ListingStatus;
      report_reason: ReportReason;
      report_status: ReportStatus;
    };
  };
}

// Convenience row aliases used across the app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SaleListing = Database["public"]["Tables"]["sale_listings"]["Row"];
export type SalePhoto = Database["public"]["Tables"]["sale_photos"]["Row"];
export type SavedSale = Database["public"]["Tables"]["saved_sales"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
