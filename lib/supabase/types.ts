export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      alternative_overrides: {
        Row: {
          action: Database['public']['Enums']['override_action'];
          alternative_product_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          product_id: string;
        };
        Insert: {
          action: Database['public']['Enums']['override_action'];
          alternative_product_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_id: string;
        };
        Update: {
          action?: Database['public']['Enums']['override_action'];
          alternative_product_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alternative_overrides_alternative_product_id_fkey';
            columns: ['alternative_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alternative_overrides_alternative_product_id_fkey';
            columns: ['alternative_product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'alternative_overrides_alternative_product_id_fkey';
            columns: ['alternative_product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alternative_overrides_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alternative_overrides_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'alternative_overrides_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
      brands: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_history: {
        Row: {
          changed_at: string;
          field: Database['public']['Enums']['price_field'];
          id: string;
          new_cents: number | null;
          old_cents: number | null;
          product_id: string;
          sync_run_id: string | null;
        };
        Insert: {
          changed_at?: string;
          field: Database['public']['Enums']['price_field'];
          id?: string;
          new_cents?: number | null;
          old_cents?: number | null;
          product_id: string;
          sync_run_id?: string | null;
        };
        Update: {
          changed_at?: string;
          field?: Database['public']['Enums']['price_field'];
          id?: string;
          new_cents?: number | null;
          old_cents?: number | null;
          product_id?: string;
          sync_run_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_history_sync_run_id_fkey';
            columns: ['sync_run_id'];
            isOneToOne: false;
            referencedRelation: 'sync_runs';
            referencedColumns: ['id'];
          },
        ];
      };
      price_quarantine: {
        Row: {
          created_at: string;
          current_cents: number | null;
          delta_pct: number | null;
          field: Database['public']['Enums']['price_field'];
          id: string;
          product_id: string;
          proposed_cents: number | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database['public']['Enums']['quarantine_status'];
          sync_run_id: string | null;
        };
        Insert: {
          created_at?: string;
          current_cents?: number | null;
          delta_pct?: number | null;
          field: Database['public']['Enums']['price_field'];
          id?: string;
          product_id: string;
          proposed_cents?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database['public']['Enums']['quarantine_status'];
          sync_run_id?: string | null;
        };
        Update: {
          created_at?: string;
          current_cents?: number | null;
          delta_pct?: number | null;
          field?: Database['public']['Enums']['price_field'];
          id?: string;
          product_id?: string;
          proposed_cents?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database['public']['Enums']['quarantine_status'];
          sync_run_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_quarantine_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_quarantine_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_quarantine_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_quarantine_sync_run_id_fkey';
            columns: ['sync_run_id'];
            isOneToOne: false;
            referencedRelation: 'sync_runs';
            referencedColumns: ['id'];
          },
        ];
      };
      prices: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          last_synced_at: string | null;
          margin_cents: number | null;
          margin_pct: number | null;
          product_id: string;
          purchase_price_cents: number | null;
          sale_price_cents: number | null;
          sale_price_includes_vat: boolean;
          updated_at: string;
          valid_from: string | null;
          vat_pct: number;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          last_synced_at?: string | null;
          margin_cents?: number | null;
          margin_pct?: number | null;
          product_id: string;
          purchase_price_cents?: number | null;
          sale_price_cents?: number | null;
          sale_price_includes_vat?: boolean;
          updated_at?: string;
          valid_from?: string | null;
          vat_pct?: number;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          last_synced_at?: string | null;
          margin_cents?: number | null;
          margin_pct?: number | null;
          product_id?: string;
          purchase_price_cents?: number | null;
          sale_price_cents?: number | null;
          sale_price_includes_vat?: boolean;
          updated_at?: string;
          valid_from?: string | null;
          vat_pct?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          brand_id: string;
          created_at: string;
          ean: string | null;
          id: string;
          model_name: string;
          model_number: string;
          model_year: number;
          panel_type: Database['public']['Enums']['panel_type'] | null;
          screen_size_inch: number | null;
          segment: Database['public']['Enums']['segment_type'] | null;
          sku_hellotv: string | null;
          status: Database['public']['Enums']['product_status'];
          successor_id: string | null;
          updated_at: string;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          ean?: string | null;
          id?: string;
          model_name: string;
          model_number: string;
          model_year: number;
          panel_type?: Database['public']['Enums']['panel_type'] | null;
          screen_size_inch?: number | null;
          segment?: Database['public']['Enums']['segment_type'] | null;
          sku_hellotv?: string | null;
          status?: Database['public']['Enums']['product_status'];
          successor_id?: string | null;
          updated_at?: string;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          ean?: string | null;
          id?: string;
          model_name?: string;
          model_number?: string;
          model_year?: number;
          panel_type?: Database['public']['Enums']['panel_type'] | null;
          screen_size_inch?: number | null;
          segment?: Database['public']['Enums']['segment_type'] | null;
          sku_hellotv?: string | null;
          status?: Database['public']['Enums']['product_status'];
          successor_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_successor_id_fkey';
            columns: ['successor_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_successor_id_fkey';
            columns: ['successor_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_successor_id_fkey';
            columns: ['successor_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
      rfid_tags: {
        Row: {
          created_at: string;
          epc: string;
          id: string;
          linked_at: string | null;
          linked_by: string | null;
          product_id: string | null;
          status: Database['public']['Enums']['tag_status'];
        };
        Insert: {
          created_at?: string;
          epc: string;
          id?: string;
          linked_at?: string | null;
          linked_by?: string | null;
          product_id?: string | null;
          status?: Database['public']['Enums']['tag_status'];
        };
        Update: {
          created_at?: string;
          epc?: string;
          id?: string;
          linked_at?: string | null;
          linked_by?: string | null;
          product_id?: string | null;
          status?: Database['public']['Enums']['tag_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'rfid_tags_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rfid_tags_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'rfid_tags_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
      scan_events: {
        Row: {
          ean: string | null;
          epc: string | null;
          id: string;
          input_type: Database['public']['Enums']['scan_input_type'];
          product_id: string | null;
          resolved_at: string | null;
          result: Database['public']['Enums']['scan_result'];
          rfid_tag_id: string | null;
          scanned_at: string;
          scanned_by: string | null;
        };
        Insert: {
          ean?: string | null;
          epc?: string | null;
          id?: string;
          input_type: Database['public']['Enums']['scan_input_type'];
          product_id?: string | null;
          resolved_at?: string | null;
          result: Database['public']['Enums']['scan_result'];
          rfid_tag_id?: string | null;
          scanned_at?: string;
          scanned_by?: string | null;
        };
        Update: {
          ean?: string | null;
          epc?: string | null;
          id?: string;
          input_type?: Database['public']['Enums']['scan_input_type'];
          product_id?: string | null;
          resolved_at?: string | null;
          result?: Database['public']['Enums']['scan_result'];
          rfid_tag_id?: string | null;
          scanned_at?: string;
          scanned_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scan_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scan_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'scan_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scan_events_rfid_tag_id_fkey';
            columns: ['rfid_tag_id'];
            isOneToOne: false;
            referencedRelation: 'rfid_tags';
            referencedColumns: ['id'];
          },
        ];
      };
      settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      stock_levels: {
        Row: {
          id: string;
          location_code: string;
          location_name: string | null;
          product_id: string;
          qty: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_code: string;
          location_name?: string | null;
          product_id: string;
          qty?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_code?: string;
          location_name?: string | null;
          product_id?: string;
          qty?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_levels_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_levels_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_levels_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
      sync_runs: {
        Row: {
          error_text: string | null;
          finished_at: string | null;
          id: string;
          items_seen: number;
          prices_changed: number;
          quarantined: number;
          started_at: string;
          status: Database['public']['Enums']['sync_status'];
          stock_changed: number;
          unmatched: number;
        };
        Insert: {
          error_text?: string | null;
          finished_at?: string | null;
          id?: string;
          items_seen?: number;
          prices_changed?: number;
          quarantined?: number;
          started_at?: string;
          status?: Database['public']['Enums']['sync_status'];
          stock_changed?: number;
          unmatched?: number;
        };
        Update: {
          error_text?: string | null;
          finished_at?: string | null;
          id?: string;
          items_seen?: number;
          prices_changed?: number;
          quarantined?: number;
          started_at?: string;
          status?: Database['public']['Enums']['sync_status'];
          stock_changed?: number;
          unmatched?: number;
        };
        Relationships: [];
      };
      vendit_articles: {
        Row: {
          created_at: string;
          id: string;
          match_confidence: number | null;
          match_method: Database['public']['Enums']['match_method'] | null;
          product_id: string | null;
          suggested_product_id: string | null;
          updated_at: string;
          vendit_article_id: string;
          vendit_description: string | null;
          vendit_ean: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_confidence?: number | null;
          match_method?: Database['public']['Enums']['match_method'] | null;
          product_id?: string | null;
          suggested_product_id?: string | null;
          updated_at?: string;
          vendit_article_id: string;
          vendit_description?: string | null;
          vendit_ean?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_confidence?: number | null;
          match_method?: Database['public']['Enums']['match_method'] | null;
          product_id?: string | null;
          suggested_product_id?: string | null;
          updated_at?: string;
          vendit_article_id?: string;
          vendit_description?: string | null;
          vendit_ean?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vendit_articles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendit_articles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'vendit_articles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendit_articles_suggested_product_id_fkey';
            columns: ['suggested_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendit_articles_suggested_product_id_fkey';
            columns: ['suggested_product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'vendit_articles_suggested_product_id_fkey';
            columns: ['suggested_product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      v_margin_watchlist: {
        Row: {
          brand_name: string | null;
          margin_cents: number | null;
          margin_pct: number | null;
          model_name: string | null;
          model_number: string | null;
          product_id: string | null;
          sale_price_cents: number | null;
        };
        Relationships: [];
      };
      v_price_changes_recent: {
        Row: {
          changed_at: string | null;
          current_margin_pct: number | null;
          delta_cents: number | null;
          delta_pct: number | null;
          field: Database['public']['Enums']['price_field'] | null;
          id: string | null;
          model_name: string | null;
          new_cents: number | null;
          old_cents: number | null;
          product_id: string | null;
          sync_run_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_history_sync_run_id_fkey';
            columns: ['sync_run_id'];
            isOneToOne: false;
            referencedRelation: 'sync_runs';
            referencedColumns: ['id'];
          },
        ];
      };
      v_prices_basic: {
        Row: {
          currency: string | null;
          is_stale: boolean | null;
          last_synced_at: string | null;
          product_id: string | null;
          purchase_price_cents: number | null;
        };
        Insert: {
          currency?: string | null;
          is_stale?: never;
          last_synced_at?: string | null;
          product_id?: string | null;
          purchase_price_cents?: number | null;
        };
        Update: {
          currency?: string | null;
          is_stale?: never;
          last_synced_at?: string | null;
          product_id?: string | null;
          purchase_price_cents?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
      v_product_full: {
        Row: {
          brand_id: string | null;
          brand_name: string | null;
          currency: string | null;
          ean: string | null;
          id: string | null;
          is_stale: boolean | null;
          last_synced_at: string | null;
          margin_cents: number | null;
          margin_pct: number | null;
          model_name: string | null;
          model_number: string | null;
          model_year: number | null;
          panel_type: Database['public']['Enums']['panel_type'] | null;
          purchase_price_cents: number | null;
          sale_price_cents: number | null;
          sale_price_includes_vat: boolean | null;
          screen_size_inch: number | null;
          segment: Database['public']['Enums']['segment_type'] | null;
          sku_hellotv: string | null;
          status: Database['public']['Enums']['product_status'] | null;
          stock_by_location: Json | null;
          successor_id: string | null;
          total_stock: number | null;
          vat_pct: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_successor_id_fkey';
            columns: ['successor_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_successor_id_fkey';
            columns: ['successor_id'];
            isOneToOne: false;
            referencedRelation: 'v_margin_watchlist';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_successor_id_fkey';
            columns: ['successor_id'];
            isOneToOne: false;
            referencedRelation: 'v_product_full';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      approve_quarantine: { Args: { p_id: string }; Returns: undefined };
      calc_sale_excl_cents: {
        Args: { p_incl: boolean; p_sale: number; p_vat: number };
        Returns: number;
      };
      confirm_match: {
        Args: { p_article_id: string; p_product_id: string };
        Returns: undefined;
      };
      current_user_role: {
        Args: never;
        Returns: Database['public']['Enums']['user_role'];
      };
      fn_alternatives: {
        Args: { p_limit?: number; p_product_id: string };
        Returns: {
          brand_name: string;
          is_pinned: boolean;
          is_successor: boolean;
          margin_diff_pp: number;
          margin_pct: number;
          model_name: string;
          model_year: number;
          panel_type: Database['public']['Enums']['panel_type'];
          product_id: string;
          sale_price_cents: number;
          score: number;
          screen_size_inch: number;
          segment: Database['public']['Enums']['segment_type'];
          total_stock: number;
        }[];
      };
      fn_lookup_scan: {
        Args: { p_ean?: string; p_epc?: string };
        Returns: Json;
      };
      reject_quarantine: { Args: { p_id: string }; Returns: undefined };
    };
    Enums: {
      match_method: 'ean' | 'sku' | 'manual';
      override_action: 'pin' | 'block';
      panel_type: 'LED' | 'QLED' | 'MiniLED' | 'OLED';
      price_field: 'purchase' | 'sale';
      product_status: 'active' | 'eol';
      quarantine_status: 'pending' | 'approved' | 'rejected';
      scan_input_type: 'rfid' | 'ean';
      scan_result: 'hit' | 'unknown_tag' | 'unlinked';
      segment_type: 'budget' | 'mid' | 'premium';
      sync_status: 'running' | 'success' | 'failed';
      tag_status: 'active' | 'inactive' | 'defect';
      user_role: 'admin' | 'sales' | 'warehouse';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      match_method: ['ean', 'sku', 'manual'],
      override_action: ['pin', 'block'],
      panel_type: ['LED', 'QLED', 'MiniLED', 'OLED'],
      price_field: ['purchase', 'sale'],
      product_status: ['active', 'eol'],
      quarantine_status: ['pending', 'approved', 'rejected'],
      scan_input_type: ['rfid', 'ean'],
      scan_result: ['hit', 'unknown_tag', 'unlinked'],
      segment_type: ['budget', 'mid', 'premium'],
      sync_status: ['running', 'success', 'failed'],
      tag_status: ['active', 'inactive', 'defect'],
      user_role: ['admin', 'sales', 'warehouse'],
    },
  },
} as const;
