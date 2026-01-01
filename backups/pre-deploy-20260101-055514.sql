--
-- PostgreSQL database dump
--

\restrict YzwHS6Px239jsWLETwjpJPWsAcKzzsMzdmJYOblZK0MhJbmqMQQWIpTqApX2AK4

-- Dumped from database version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: gamblecodez
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO gamblecodez;

--
-- Name: pgrst; Type: SCHEMA; Schema: -; Owner: gamblecodez
--

CREATE SCHEMA pgrst;


ALTER SCHEMA pgrst OWNER TO gamblecodez;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: pre_config(); Type: FUNCTION; Schema: pgrst; Owner: gamblecodez
--

CREATE FUNCTION pgrst.pre_config() RETURNS void
    LANGUAGE sql
    AS $$
  SELECT
      set_config('pgrst.db_schemas', 'public', true)
    , set_config('pgrst.db_aggregates_enabled', 'true', true)
    , set_config('pgrst.db_anon_role', 'anonymous', true)
    , set_config('pgrst.jwt_role_claim_key', '."role"', true)
$$;


ALTER FUNCTION pgrst.pre_config() OWNER TO gamblecodez;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: gamblecodez
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO gamblecodez;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: gamblecodez
--

CREATE TABLE neon_auth.users_sync (
    raw_json jsonb NOT NULL,
    id text GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED NOT NULL,
    name text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
    email text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
    created_at timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE neon_auth.users_sync OWNER TO gamblecodez;

--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.ad_campaigns (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    linked_site text,
    image_url text NOT NULL,
    headline text NOT NULL,
    subtext text,
    cta_text text NOT NULL,
    target_url text NOT NULL,
    placement_ids integer[],
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_campaigns OWNER TO gamblecodez;

--
-- Name: ad_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.ad_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_campaigns_id_seq OWNER TO gamblecodez;

--
-- Name: ad_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.ad_campaigns_id_seq OWNED BY public.ad_campaigns.id;


--
-- Name: ad_clicks; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.ad_clicks (
    id integer NOT NULL,
    placement_id integer,
    campaign_id integer,
    user_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_clicks OWNER TO gamblecodez;

--
-- Name: ad_clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.ad_clicks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_clicks_id_seq OWNER TO gamblecodez;

--
-- Name: ad_clicks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.ad_clicks_id_seq OWNED BY public.ad_clicks.id;


--
-- Name: ad_impressions; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.ad_impressions (
    id integer NOT NULL,
    placement_id integer,
    campaign_id integer,
    user_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_impressions OWNER TO gamblecodez;

--
-- Name: ad_impressions_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.ad_impressions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_impressions_id_seq OWNER TO gamblecodez;

--
-- Name: ad_impressions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.ad_impressions_id_seq OWNED BY public.ad_impressions.id;


--
-- Name: ad_placements; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.ad_placements (
    id integer NOT NULL,
    placement_id text NOT NULL,
    location text NOT NULL,
    status text DEFAULT 'active'::text,
    current_campaign_id integer,
    rotation_mode text DEFAULT 'single'::text,
    frequency_capping integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ad_placements OWNER TO gamblecodez;

--
-- Name: ad_placements_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.ad_placements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ad_placements_id_seq OWNER TO gamblecodez;

--
-- Name: ad_placements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.ad_placements_id_seq OWNED BY public.ad_placements.id;


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.admin_audit_log (
    id integer NOT NULL,
    admin_user text,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_audit_log OWNER TO gamblecodez;

--
-- Name: admin_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.admin_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_audit_log_id_seq OWNER TO gamblecodez;

--
-- Name: admin_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.admin_audit_log_id_seq OWNED BY public.admin_audit_log.id;


--
-- Name: ads; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.ads (
    id integer NOT NULL,
    logo_url text NOT NULL,
    site_description text NOT NULL,
    bonus_code_description text,
    fine_print text,
    weight integer DEFAULT 1,
    button_url text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ads OWNER TO gamblecodez;

--
-- Name: ads_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.ads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ads_id_seq OWNER TO gamblecodez;

--
-- Name: ads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.ads_id_seq OWNED BY public.ads.id;


--
-- Name: affiliates_master; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.affiliates_master (
    id integer NOT NULL,
    name text NOT NULL,
    url text,
    logo text,
    top_pick boolean DEFAULT false,
    jurisdiction text,
    sc_allowed boolean DEFAULT false,
    crypto_allowed boolean DEFAULT false,
    cwallet_allowed boolean DEFAULT false,
    lootbox_allowed boolean DEFAULT false,
    show_in_profile boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    slug text,
    description text,
    resolved_domain text,
    redemption_speed text,
    redemption_minimum numeric,
    redemption_type text,
    created_by text,
    source text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    affiliate_url text,
    priority integer DEFAULT 0,
    category text,
    status text,
    level integer,
    date_added timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bonus_code text,
    bonus_description text,
    icon_url text
);


ALTER TABLE public.affiliates_master OWNER TO gamblecodez;

--
-- Name: affiliates_master_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.affiliates_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliates_master_id_seq OWNER TO gamblecodez;

--
-- Name: affiliates_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.affiliates_master_id_seq OWNED BY public.affiliates_master.id;


--
-- Name: ai_classification_snapshots; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.ai_classification_snapshots (
    id bigint NOT NULL,
    raw_drop_id bigint NOT NULL,
    model_name text,
    model_version text,
    run_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    label text,
    score numeric,
    details jsonb DEFAULT '{}'::jsonb,
    is_promo boolean,
    confidence_score numeric,
    extracted_codes text[],
    extracted_urls text[],
    resolved_domains text[],
    guessed_casino text,
    guessed_jurisdiction text,
    proposed_headline text,
    proposed_description text,
    validity_score numeric,
    is_spam boolean DEFAULT false,
    is_duplicate boolean DEFAULT false,
    duplicate_of_raw_drop_id bigint
);


ALTER TABLE public.ai_classification_snapshots OWNER TO gamblecodez;

--
-- Name: ai_classification_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.ai_classification_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_classification_snapshots_id_seq OWNER TO gamblecodez;

--
-- Name: ai_classification_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.ai_classification_snapshots_id_seq OWNED BY public.ai_classification_snapshots.id;


--
-- Name: blacklist; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.blacklist (
    id integer NOT NULL,
    user_id text NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text
);


ALTER TABLE public.blacklist OWNER TO gamblecodez;

--
-- Name: blacklist_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.blacklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blacklist_id_seq OWNER TO gamblecodez;

--
-- Name: blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.blacklist_id_seq OWNED BY public.blacklist.id;


--
-- Name: daily_drops; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.daily_drops (
    id integer NOT NULL,
    promo_code text,
    bonus_link text,
    affiliate_id integer,
    jurisdiction text,
    category text,
    active boolean DEFAULT true,
    drop_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daily_drops OWNER TO gamblecodez;

--
-- Name: daily_drops_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.daily_drops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_drops_id_seq OWNER TO gamblecodez;

--
-- Name: daily_drops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.daily_drops_id_seq OWNED BY public.daily_drops.id;


--
-- Name: drop_admin_actions; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.drop_admin_actions (
    id bigint NOT NULL,
    admin_user text NOT NULL,
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id bigint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resource_type text,
    resource_id bigint,
    changes jsonb DEFAULT '{}'::jsonb,
    reason text
);


ALTER TABLE public.drop_admin_actions OWNER TO gamblecodez;

--
-- Name: drop_admin_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.drop_admin_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drop_admin_actions_id_seq OWNER TO gamblecodez;

--
-- Name: drop_admin_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.drop_admin_actions_id_seq OWNED BY public.drop_admin_actions.id;


--
-- Name: drop_ai_learning; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.drop_ai_learning (
    id bigint NOT NULL,
    raw_drop_id bigint NOT NULL,
    promo_candidate_id bigint,
    affiliate_id integer,
    ai_label text,
    admin_label text,
    confidence numeric,
    notes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.drop_ai_learning OWNER TO gamblecodez;

--
-- Name: drop_ai_learning_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.drop_ai_learning_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drop_ai_learning_id_seq OWNER TO gamblecodez;

--
-- Name: drop_ai_learning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.drop_ai_learning_id_seq OWNED BY public.drop_ai_learning.id;


--
-- Name: drop_notifications_sent; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.drop_notifications_sent (
    id bigint NOT NULL,
    drop_promo_id bigint NOT NULL,
    user_id text NOT NULL,
    channel text NOT NULL,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    meta jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.drop_notifications_sent OWNER TO gamblecodez;

--
-- Name: drop_notifications_sent_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.drop_notifications_sent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drop_notifications_sent_id_seq OWNER TO gamblecodez;

--
-- Name: drop_notifications_sent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.drop_notifications_sent_id_seq OWNED BY public.drop_notifications_sent.id;


--
-- Name: drop_promos; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.drop_promos (
    id bigint NOT NULL,
    promo_candidate_id bigint NOT NULL,
    raw_drop_id bigint NOT NULL,
    affiliate_id integer,
    promo_code text,
    promo_description text,
    promo_url text,
    jurisdiction text,
    casino_name text,
    approved_at timestamp with time zone,
    approved_by text,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ai_notes jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'active'::text,
    source_raw_drop_id bigint,
    source_promo_candidate_id bigint,
    headline text,
    description text,
    promo_type text,
    bonus_code text,
    resolved_domain text,
    mapped_casino_id integer,
    jurisdiction_tags text[],
    quick_signup_url text,
    validity_flags jsonb DEFAULT '{}'::jsonb,
    audit_trail jsonb DEFAULT '[]'::jsonb,
    featured boolean DEFAULT false,
    view_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    expires_at timestamp with time zone,
    CONSTRAINT drop_promos_jurisdiction_check CHECK (((jurisdiction IS NULL) OR (jurisdiction <> ''::text))),
    CONSTRAINT drop_promos_promo_type_check CHECK (((promo_type IS NULL) OR (promo_type = ANY (ARRAY['code'::text, 'url'::text, 'hybrid'::text, 'info_only'::text])))),
    CONSTRAINT drop_promos_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'expired'::text, 'archived'::text])))
);


ALTER TABLE public.drop_promos OWNER TO gamblecodez;

--
-- Name: drop_promos_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.drop_promos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drop_promos_id_seq OWNER TO gamblecodez;

--
-- Name: drop_promos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.drop_promos_id_seq OWNED BY public.drop_promos.id;


--
-- Name: drop_user_reports; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.drop_user_reports (
    id bigint NOT NULL,
    drop_promo_id bigint NOT NULL,
    user_id text,
    report_type text,
    report_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    report_text text,
    CONSTRAINT drop_user_reports_type_check CHECK (((report_type IS NULL) OR (report_type = ANY (ARRAY['invalid_promo'::text, 'spam'::text, 'duplicate'::text, 'expired'::text, 'other'::text]))))
);


ALTER TABLE public.drop_user_reports OWNER TO gamblecodez;

--
-- Name: drop_user_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.drop_user_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drop_user_reports_id_seq OWNER TO gamblecodez;

--
-- Name: drop_user_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.drop_user_reports_id_seq OWNED BY public.drop_user_reports.id;


--
-- Name: live_banner; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.live_banner (
    id integer NOT NULL,
    message text NOT NULL,
    link_url text,
    active boolean DEFAULT true,
    priority integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.live_banner OWNER TO gamblecodez;

--
-- Name: live_banner_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.live_banner_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.live_banner_id_seq OWNER TO gamblecodez;

--
-- Name: live_banner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.live_banner_id_seq OWNED BY public.live_banner.id;


--
-- Name: newsletter_campaigns; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.newsletter_campaigns (
    id integer NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    preheader text,
    segment text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'draft'::text,
    sent_count integer DEFAULT 0,
    open_rate text DEFAULT '0%'::text,
    click_rate text DEFAULT '0%'::text,
    scheduled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.newsletter_campaigns OWNER TO gamblecodez;

--
-- Name: newsletter_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.newsletter_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletter_campaigns_id_seq OWNER TO gamblecodez;

--
-- Name: newsletter_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.newsletter_campaigns_id_seq OWNED BY public.newsletter_campaigns.id;


--
-- Name: newsletter_segments; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.newsletter_segments (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    rules jsonb,
    approx_count integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.newsletter_segments OWNER TO gamblecodez;

--
-- Name: newsletter_segments_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.newsletter_segments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletter_segments_id_seq OWNER TO gamblecodez;

--
-- Name: newsletter_segments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.newsletter_segments_id_seq OWNED BY public.newsletter_segments.id;


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.newsletter_subscribers (
    id integer NOT NULL,
    user_id text,
    email text,
    unsubscribed boolean DEFAULT false,
    last_opened timestamp without time zone,
    last_clicked timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.newsletter_subscribers OWNER TO gamblecodez;

--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.newsletter_subscribers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletter_subscribers_id_seq OWNER TO gamblecodez;

--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.newsletter_subscribers_id_seq OWNED BY public.newsletter_subscribers.id;


--
-- Name: newsletter_templates; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.newsletter_templates (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    last_used timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.newsletter_templates OWNER TO gamblecodez;

--
-- Name: newsletter_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.newsletter_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletter_templates_id_seq OWNER TO gamblecodez;

--
-- Name: newsletter_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.newsletter_templates_id_seq OWNED BY public.newsletter_templates.id;


--
-- Name: promo_candidates; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.promo_candidates (
    id bigint NOT NULL,
    raw_drop_id bigint NOT NULL,
    classification_snapshot_id bigint,
    affiliate_id integer,
    promo_code text,
    promo_description text,
    promo_url text,
    jurisdiction text,
    casino_name text,
    confidence numeric,
    ai_notes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_valid boolean DEFAULT true,
    is_hidden boolean DEFAULT false,
    status text DEFAULT 'pending'::text,
    ai_snapshot_id bigint,
    headline text,
    description text,
    promo_type text,
    bonus_code text,
    resolved_domain text,
    mapped_casino_id integer,
    jurisdiction_tags text[],
    validity_score numeric,
    is_spam boolean DEFAULT false,
    is_duplicate boolean DEFAULT false,
    reviewed_at timestamp with time zone,
    CONSTRAINT promo_candidates_jurisdiction_check CHECK (((jurisdiction IS NULL) OR (jurisdiction <> ''::text))),
    CONSTRAINT promo_candidates_promo_type_check CHECK (((promo_type IS NULL) OR (promo_type = ANY (ARRAY['code'::text, 'url'::text, 'hybrid'::text, 'info_only'::text])))),
    CONSTRAINT promo_candidates_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'non_promo'::text])))
);


ALTER TABLE public.promo_candidates OWNER TO gamblecodez;

--
-- Name: promo_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.promo_candidates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_candidates_id_seq OWNER TO gamblecodez;

--
-- Name: promo_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.promo_candidates_id_seq OWNED BY public.promo_candidates.id;


--
-- Name: promo_decisions; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.promo_decisions (
    id integer NOT NULL,
    promo_id integer NOT NULL,
    decision text NOT NULL,
    affiliate_id integer,
    deny_reason text,
    reviewed_by text NOT NULL,
    reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT promo_decisions_decision_check CHECK ((decision = ANY (ARRAY['approved'::text, 'denied'::text])))
);


ALTER TABLE public.promo_decisions OWNER TO gamblecodez;

--
-- Name: promo_decisions_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.promo_decisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_decisions_id_seq OWNER TO gamblecodez;

--
-- Name: promo_decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.promo_decisions_id_seq OWNED BY public.promo_decisions.id;


--
-- Name: promos; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.promos (
    id integer NOT NULL,
    source text DEFAULT 'discord'::text NOT NULL,
    channel text NOT NULL,
    content text NOT NULL,
    clean_text text,
    submitted_by text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    affiliate_id integer,
    deny_reason text,
    reviewed_by text,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT promos_channel_check CHECK ((channel = ANY (ARRAY['links'::text, 'codes'::text]))),
    CONSTRAINT promos_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])))
);


ALTER TABLE public.promos OWNER TO gamblecodez;

--
-- Name: promos_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.promos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promos_id_seq OWNER TO gamblecodez;

--
-- Name: promos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.promos_id_seq OWNED BY public.promos.id;


--
-- Name: raffle_entries; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.raffle_entries (
    id integer NOT NULL,
    raffle_id integer NOT NULL,
    user_id text NOT NULL,
    entry_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entry_source text,
    CONSTRAINT raffle_entries_entry_source_check CHECK ((entry_source = ANY (ARRAY['daily_checkin'::text, 'wheel'::text, 'secret_code'::text, 'manual'::text, 'wheel_spin'::text])))
);


ALTER TABLE public.raffle_entries OWNER TO gamblecodez;

--
-- Name: raffle_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.raffle_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raffle_entries_id_seq OWNER TO gamblecodez;

--
-- Name: raffle_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.raffle_entries_id_seq OWNED BY public.raffle_entries.id;


--
-- Name: raffle_winners; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.raffle_winners (
    id integer NOT NULL,
    raffle_id integer NOT NULL,
    winner text NOT NULL,
    prize text,
    won_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.raffle_winners OWNER TO gamblecodez;

--
-- Name: raffle_winners_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.raffle_winners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raffle_winners_id_seq OWNER TO gamblecodez;

--
-- Name: raffle_winners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.raffle_winners_id_seq OWNED BY public.raffle_winners.id;


--
-- Name: raffles; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.raffles (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    active boolean DEFAULT true,
    secret boolean DEFAULT false,
    hidden boolean DEFAULT false,
    prize_type text,
    prize_value text,
    raffle_type text DEFAULT 'timed'::text,
    num_winners integer DEFAULT 1,
    secret_code text,
    entry_sources jsonb DEFAULT '["daily_checkin", "wheel", "secret_code", "manual"]'::jsonb,
    entries_per_source jsonb DEFAULT '{"wheel": 5, "manual": 0, "secret_code": 10, "daily_checkin": 1}'::jsonb,
    winner_selection_method text DEFAULT 'random'::text,
    allow_repeat_winners boolean DEFAULT false,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    prize_site_id integer,
    sponsor_site text,
    sponsor_campaign_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT raffles_raffle_type_check CHECK ((raffle_type = ANY (ARRAY['timed'::text, 'manual'::text, 'daily'::text]))),
    CONSTRAINT raffles_winner_selection_method_check CHECK ((winner_selection_method = ANY (ARRAY['random'::text, 'weighted'::text])))
);


ALTER TABLE public.raffles OWNER TO gamblecodez;

--
-- Name: raffles_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.raffles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raffles_id_seq OWNER TO gamblecodez;

--
-- Name: raffles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.raffles_id_seq OWNED BY public.raffles.id;


--
-- Name: raw_drops; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.raw_drops (
    id bigint NOT NULL,
    source text NOT NULL,
    source_message_id text,
    source_channel text,
    source_user text,
    affiliate_id integer,
    raw_text text NOT NULL,
    detected_language text,
    ingested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    is_processed boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    jurisdiction_guess text,
    casino_name_guess text,
    meta jsonb DEFAULT '{}'::jsonb,
    source_channel_id text,
    source_user_id text,
    source_username text,
    raw_urls text[],
    bonus_code_candidates text[],
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT raw_drops_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'classified'::text, 'error'::text, 'skipped'::text])))
);


ALTER TABLE public.raw_drops OWNER TO gamblecodez;

--
-- Name: raw_drops_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.raw_drops_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raw_drops_id_seq OWNER TO gamblecodez;

--
-- Name: raw_drops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.raw_drops_id_seq OWNED BY public.raw_drops.id;


--
-- Name: redirects; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.redirects (
    id integer NOT NULL,
    slug text NOT NULL,
    weight integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.redirects OWNER TO gamblecodez;

--
-- Name: redirects_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.redirects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.redirects_id_seq OWNER TO gamblecodez;

--
-- Name: redirects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.redirects_id_seq OWNED BY public.redirects.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.settings OWNER TO gamblecodez;

--
-- Name: spin_logs; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.spin_logs (
    id integer NOT NULL,
    user_id text NOT NULL,
    reward text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.spin_logs OWNER TO gamblecodez;

--
-- Name: spin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.spin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spin_logs_id_seq OWNER TO gamblecodez;

--
-- Name: spin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.spin_logs_id_seq OWNED BY public.spin_logs.id;


--
-- Name: user_notification_settings; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.user_notification_settings (
    id integer NOT NULL,
    user_id text NOT NULL,
    telegram_notifications boolean DEFAULT true,
    email_notifications boolean DEFAULT false,
    push_notifications boolean DEFAULT true,
    drops_enabled boolean DEFAULT true,
    drops_last_sent timestamp with time zone,
    drops_frequency text DEFAULT 'instant'::text,
    drops_telegram boolean DEFAULT true,
    drops_email boolean DEFAULT false,
    drops_push boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_notification_settings OWNER TO gamblecodez;

--
-- Name: user_notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.user_notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notification_settings_id_seq OWNER TO gamblecodez;

--
-- Name: user_notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.user_notification_settings_id_seq OWNED BY public.user_notification_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.users (
    id integer NOT NULL,
    user_id text NOT NULL,
    pin_hash text,
    locked boolean DEFAULT false,
    telegram_id text,
    telegram_username text,
    cwallet_id text,
    email text,
    username text,
    jurisdiction text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO gamblecodez;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO gamblecodez;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wheel_config; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.wheel_config (
    id integer NOT NULL,
    spins_per_day integer DEFAULT 1,
    target_raffle_id integer,
    auto_draw_enabled boolean DEFAULT false,
    auto_draw_frequency text DEFAULT 'daily'::text,
    auto_draw_time time without time zone,
    prize_slots jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wheel_config_auto_draw_frequency_check CHECK ((auto_draw_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'manual'::text])))
);


ALTER TABLE public.wheel_config OWNER TO gamblecodez;

--
-- Name: wheel_config_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.wheel_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wheel_config_id_seq OWNER TO gamblecodez;

--
-- Name: wheel_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.wheel_config_id_seq OWNED BY public.wheel_config.id;


--
-- Name: wheel_prize_slots; Type: TABLE; Schema: public; Owner: gamblecodez
--

CREATE TABLE public.wheel_prize_slots (
    id integer NOT NULL,
    wheel_config_id integer NOT NULL,
    label text NOT NULL,
    color text NOT NULL,
    entry_multiplier integer DEFAULT 1,
    chance_weight integer DEFAULT 1,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.wheel_prize_slots OWNER TO gamblecodez;

--
-- Name: wheel_prize_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: gamblecodez
--

CREATE SEQUENCE public.wheel_prize_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wheel_prize_slots_id_seq OWNER TO gamblecodez;

--
-- Name: wheel_prize_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gamblecodez
--

ALTER SEQUENCE public.wheel_prize_slots_id_seq OWNED BY public.wheel_prize_slots.id;


--
-- Name: ad_campaigns id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_campaigns ALTER COLUMN id SET DEFAULT nextval('public.ad_campaigns_id_seq'::regclass);


--
-- Name: ad_clicks id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_clicks ALTER COLUMN id SET DEFAULT nextval('public.ad_clicks_id_seq'::regclass);


--
-- Name: ad_impressions id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_impressions ALTER COLUMN id SET DEFAULT nextval('public.ad_impressions_id_seq'::regclass);


--
-- Name: ad_placements id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_placements ALTER COLUMN id SET DEFAULT nextval('public.ad_placements_id_seq'::regclass);


--
-- Name: admin_audit_log id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.admin_audit_log ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_log_id_seq'::regclass);


--
-- Name: ads id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ads ALTER COLUMN id SET DEFAULT nextval('public.ads_id_seq'::regclass);


--
-- Name: affiliates_master id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.affiliates_master ALTER COLUMN id SET DEFAULT nextval('public.affiliates_master_id_seq'::regclass);


--
-- Name: ai_classification_snapshots id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ai_classification_snapshots ALTER COLUMN id SET DEFAULT nextval('public.ai_classification_snapshots_id_seq'::regclass);


--
-- Name: blacklist id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.blacklist ALTER COLUMN id SET DEFAULT nextval('public.blacklist_id_seq'::regclass);


--
-- Name: daily_drops id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.daily_drops ALTER COLUMN id SET DEFAULT nextval('public.daily_drops_id_seq'::regclass);


--
-- Name: drop_admin_actions id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_admin_actions ALTER COLUMN id SET DEFAULT nextval('public.drop_admin_actions_id_seq'::regclass);


--
-- Name: drop_ai_learning id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning ALTER COLUMN id SET DEFAULT nextval('public.drop_ai_learning_id_seq'::regclass);


--
-- Name: drop_notifications_sent id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_notifications_sent ALTER COLUMN id SET DEFAULT nextval('public.drop_notifications_sent_id_seq'::regclass);


--
-- Name: drop_promos id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos ALTER COLUMN id SET DEFAULT nextval('public.drop_promos_id_seq'::regclass);


--
-- Name: drop_user_reports id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_user_reports ALTER COLUMN id SET DEFAULT nextval('public.drop_user_reports_id_seq'::regclass);


--
-- Name: live_banner id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.live_banner ALTER COLUMN id SET DEFAULT nextval('public.live_banner_id_seq'::regclass);


--
-- Name: newsletter_campaigns id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_campaigns ALTER COLUMN id SET DEFAULT nextval('public.newsletter_campaigns_id_seq'::regclass);


--
-- Name: newsletter_segments id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_segments ALTER COLUMN id SET DEFAULT nextval('public.newsletter_segments_id_seq'::regclass);


--
-- Name: newsletter_subscribers id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_subscribers ALTER COLUMN id SET DEFAULT nextval('public.newsletter_subscribers_id_seq'::regclass);


--
-- Name: newsletter_templates id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_templates ALTER COLUMN id SET DEFAULT nextval('public.newsletter_templates_id_seq'::regclass);


--
-- Name: promo_candidates id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates ALTER COLUMN id SET DEFAULT nextval('public.promo_candidates_id_seq'::regclass);


--
-- Name: promo_decisions id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_decisions ALTER COLUMN id SET DEFAULT nextval('public.promo_decisions_id_seq'::regclass);


--
-- Name: promos id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);


--
-- Name: raffle_entries id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_entries ALTER COLUMN id SET DEFAULT nextval('public.raffle_entries_id_seq'::regclass);


--
-- Name: raffle_winners id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_winners ALTER COLUMN id SET DEFAULT nextval('public.raffle_winners_id_seq'::regclass);


--
-- Name: raffles id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffles ALTER COLUMN id SET DEFAULT nextval('public.raffles_id_seq'::regclass);


--
-- Name: raw_drops id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raw_drops ALTER COLUMN id SET DEFAULT nextval('public.raw_drops_id_seq'::regclass);


--
-- Name: redirects id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.redirects ALTER COLUMN id SET DEFAULT nextval('public.redirects_id_seq'::regclass);


--
-- Name: spin_logs id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.spin_logs ALTER COLUMN id SET DEFAULT nextval('public.spin_logs_id_seq'::regclass);


--
-- Name: user_notification_settings id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.user_notification_settings ALTER COLUMN id SET DEFAULT nextval('public.user_notification_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wheel_config id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.wheel_config ALTER COLUMN id SET DEFAULT nextval('public.wheel_config_id_seq'::regclass);


--
-- Name: wheel_prize_slots id; Type: DEFAULT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.wheel_prize_slots ALTER COLUMN id SET DEFAULT nextval('public.wheel_prize_slots_id_seq'::regclass);


--
-- Data for Name: users_sync; Type: TABLE DATA; Schema: neon_auth; Owner: gamblecodez
--

COPY neon_auth.users_sync (raw_json, updated_at, deleted_at) FROM stdin;
{"id": "d465f580-0885-4a4a-9e85-6e140922ccf3", "display_name": "Ganble (GambleCodez)", "has_password": false, "is_anonymous": false, "primary_email": "thetylo88@gmail.com", "selected_team": null, "auth_with_email": false, "client_metadata": null, "oauth_providers": [], "server_metadata": null, "otp_auth_enabled": false, "selected_team_id": null, "profile_image_url": "https://lh3.googleusercontent.com/a/ACg8ocJb7tvMJhb0WQcVR713VCDpyhZgTtojB6ZamWDlqPMqWcGu7J3TAQ=s96-c", "requires_totp_mfa": false, "signed_up_at_millis": 1763518472343, "passkey_auth_enabled": false, "last_active_at_millis": 1763518472343, "primary_email_verified": true, "client_read_only_metadata": null, "primary_email_auth_enabled": true}	\N	\N
\.


--
-- Data for Name: ad_campaigns; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.ad_campaigns (id, name, type, linked_site, image_url, headline, subtext, cta_text, target_url, placement_ids, start_date, end_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ad_clicks; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.ad_clicks (id, placement_id, campaign_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: ad_impressions; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.ad_impressions (id, placement_id, campaign_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: ad_placements; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.ad_placements (id, placement_id, location, status, current_campaign_id, rotation_mode, frequency_capping, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.admin_audit_log (id, admin_user, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: ads; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.ads (id, logo_url, site_description, bonus_code_description, fine_print, weight, button_url, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: affiliates_master; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.affiliates_master (id, name, url, logo, top_pick, jurisdiction, sc_allowed, crypto_allowed, cwallet_allowed, lootbox_allowed, show_in_profile, sort_order, slug, description, resolved_domain, redemption_speed, redemption_minimum, redemption_type, created_by, source, created_at, updated_at, affiliate_url, priority, category, status, level, date_added, bonus_code, bonus_description, icon_url) FROM stdin;
1	OSEsweeps	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	osesweeps.com	Same day	50	Debit	\N	\N	2025-12-30 21:33:31.475713	2025-12-30 21:33:31.475713	https://osesweeps.com/	100	US,SWEEPS,INSTANT,TOP_PICK,KYC	approved	4	2025-11-18 00:00:00+00	GambleCodez	🎁 Use code GambleCodez for 50% off your first purchase. Use code GCODEZ5 for 5% off all future purchases.	https://www.google.com/s2/favicons?sz=256&domain=osesweeps.com
24	Ace.com	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	ace.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=DSZ1Y3	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	150% EXTRA COINS on first purchase	https://www.google.com/s2/favicons?sz=256&domain=ace.com
25	AmericanLuck	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	americanluck.com	2-3 days	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://americanluck.com/signup/43693781-4eee-4b46-b25c-59017259d77c	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-10-22 00:00:00+00	\N	Sign up at AmericanLuck to grab 6 SC + 60,000 GC for free, plus extra coins on your first purchase. Collect 100 SC and redeem via bank transfer within 0–3 days.	https://www.google.com/s2/favicons?sz=256&domain=americanluck.com
26	BaBa	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	play.babacasino.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://baba.gamblecodez.com	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	Clean signup flow, curated offers, steady bonus drops — GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=play.babacasino.com
27	BCH.GAMES	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	bch.games	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://bch.games/play/GambleCodez	75	NONUS,CRYPTO,FAUCET,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Crypto faucet top pick: free claims + casino play, fast rails.	https://www.google.com/s2/favicons?sz=256&domain=bch.games
28	Betbolt	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	betbolt.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://betbolt.com/?r=SJICBK	75	NONUS,CRYPTO	approved	3	2024-10-16 00:00:00+00	\N	No‑KYC access, routine promos.	https://www.google.com/s2/favicons?sz=256&domain=betbolt.com
29	Bitsler.com	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	bitsler.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.bitsler.com/?ref=thetylo88	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Quick crypto play, social leaderboards, instant micro‑withdrawals.	https://www.google.com/s2/favicons?sz=256&domain=bitsler.com
30	Blockbet.gg	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	forbidden.blockbet.gg	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.blockbet.gg/share/v6/GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Crypto case openings, fast payout rails.	https://www.google.com/s2/favicons?sz=256&domain=forbidden.blockbet.gg
31	CSGOWIN	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	csgowin.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://csgowin.com/r/gamblecodez	75	NONUS,CRYPTO,LOOTBOX,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Lootbox platform, large case catalog, quick crypto withdrawals.	https://www.google.com/s2/favicons?sz=256&domain=csgowin.com
32	Cases.gg	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	cases.gg	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://cases.gg/r/GAMBLECODEZ	75	NONUS,CRYPTO,LOOTBOX,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Case‑opening hub, provably fair, speedy crypto withdrawals.	https://www.google.com/s2/favicons?sz=256&domain=cases.gg
33	Chanced	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	chanced.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://chanced.com/c/ev1h43	75	US,SWEEPS,INSTANT,TOP_PICK,KYC	approved	3	2024-10-16 00:00:00+00	\N	Instant sweeps: swift registration, frequent promos, fast claim flows.	https://www.google.com/s2/favicons?sz=256&domain=chanced.com
34	ChipNWin	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	chipnwin.com	5-7 days	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://chipnwin.com/?earn=rxGdtRPO	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	ChipNWin greets new players with 15,000 Gold Coins and 30 Crystals, and reloads like 60,000 GC + 40 SC for $19.99. Accumulate 100 SC and cash out via ACH or gift cards in about 2–7 business days.	https://www.google.com/s2/favicons?sz=256&domain=chipnwin.com
35	Chips.gg	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	chips.gg	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://chips.gg/signup?r=gambacodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Crypto‑first casino, instant micro‑withdrawals, curated quick‑play catalog.	https://www.google.com/s2/favicons?sz=256&domain=chips.gg
36	Clash.gg	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	clash.gg	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://clash.gg/r/GAMBLECODEZ	75	NONUS,CRYPTO,LOOTBOX,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Lootbox gaming, rapid rewards, active prize pools.	https://www.google.com/s2/favicons?sz=256&domain=clash.gg
37	ClubsPoker	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	play.clubs.poker	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://play.clubs.poker/?referralCode=16288	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	Social poker sweeps: tournaments, steady redemption flows.	https://www.google.com/s2/favicons?sz=256&domain=play.clubs.poker
38	Coinz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	coinz.us	Instant	\N	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=CDFHNB	100	US,SWEEPS,CRYPTO,INSTANT,TOP_PICK,KYC	approved	5	2025-12-05 00:00:00+00	\N	US sweeps top pick: free entry, first‑purchase promos, quick redemption flows.	https://www.google.com/s2/favicons?sz=256&domain=coinz.us
39	CrownCoinsCasino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	crowncoinscasino.com	1 day	50	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=787P2M	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	🔥 CrownCoinsCasino Top Pick: 65 SC for $23.99 + 1,300,000 GC, 40 SC for $15.99 + 800,000 GC — fast redemptions, hyped promos, GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=crowncoinscasino.com
40	Dara	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	daracasino.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://daracasino.com/signup?refferalCode=IAwNH43lfT	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-10-22 00:00:00+00	\N	Localized promos, straightforward redemption, frequent events.	https://www.google.com/s2/favicons?sz=256&domain=daracasino.com
41	Spindoo	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	spindoo.us	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.spindoo.us/?r=23729863	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-10-22 00:00:00+00	\N	Reliable sweeps portal: signup incentives, concise docs, dependable processing.	https://www.google.com/s2/favicons?sz=256&domain=spindoo.us
42	RichSweeps	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	richsweeps.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://richsweeps.com/?ref=r_gamblecodez	75	US,SWEEPS,INSTANT,TOP_PICK	approved	3	2024-10-16 00:00:00+00	\N	Fast‑claim sweeps: speedy rails, frequent freebies, VIP perks.	https://www.google.com/s2/favicons?sz=256&domain=richsweeps.com
43	SpeedSweeps	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	speedsweeps.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://speed.gamblecodez.com	75	US,SWEEPS,INSTANT,TOP_PICK	approved	5	2024-10-16 00:00:00+00	\N	Speed‑focused sweeps: low‑latency claims, instant‑friendly rails.	https://www.google.com/s2/favicons?sz=256&domain=speedsweeps.com
44	Legendz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	legendz.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=SMG0G2	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2024-10-16 00:00:00+00	\N	⚡ Instant sweeps redemptions — GambleCodez referral, daily SC wheel, blazing fast claims.	https://www.google.com/s2/favicons?sz=256&domain=legendz.com
45	McLuck	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepsflow.com	Instant	50	Skrill	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=W0H7JG	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	150% extra coins on first purchase	https://www.google.com/s2/favicons?sz=256&domain=sweepsflow.com
46	LuckyBird	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	luckybird.io	Instant	30	Crypto	\N	,,	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-12-14 00:00:00+00	\N	⚠️ Blacklisted: payout & trust reports — do not promote.	https://www.google.com/s2/favicons?sz=256&domain=luckybird.io
47	Runewager	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	runewager.com	Instant	10	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://runewager.com/?r=GambleCodez	100	US,NONUS,SWEEPS,CRYPTO,INSTANT,TOP_PICK	approved	5	2025-10-22 00:00:00+00	\N	🔥 GambleCodez TOP PICK: wager 3,000 SC in 7 days for 30 SC bonus (PROMO AVAILABLE ONLY ONCE PER ACC); DM @GambleCodez on TG. Blazing fast redemptions, global access, giveaways, updated slots, originals, Lootbox sportsbook.	https://www.google.com/s2/favicons?sz=256&domain=runewager.com
48	Jackbit	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	jackbit.co	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://jackbit.com/?r=GambleCodez	100	NONUS,CRYPTO,INSTANT,TOP_PICK	approved	5	2025-11-24 00:00:00+00	\N	🚀 Crypto casino: 10‑minute withdrawals, 100 free spins, GambleCodez rakeback perks.	https://www.google.com/s2/favicons?sz=256&domain=jackbit.co
49	BitStarz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	bitstarz.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://bitstarz.com/?r=GambleCodez	100	NONUS,CRYPTO,INSTANT,TOP_PICK	approved	5	2025-11-24 00:00:00+00	\N	⚡ Veteran crypto casino: under 10‑minute payouts, 180 free spins, GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=bitstarz.com
50	Betpanda	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	betpanda.io	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://betpanda.com/?r=GambleCodez	100	NONUS,CRYPTO,INSTANT	approved	5	2025-11-24 00:00:00+00	\N	Anonymous crypto play, instant ETH/BTC payouts, GambleCodez referral.	https://www.google.com/s2/favicons?sz=256&domain=betpanda.io
51	CoinCasino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	coincasino.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://coincasino.com/?r=GambleCodez	100	NONUS,CRYPTO,INSTANT	approved	5	2025-11-24 00:00:00+00	\N	Fast crypto cashouts, same‑day wallet transfers, GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=coincasino.com
52	Stake.com	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	stake.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://stake.com/?c=GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Premier crypto casino: extensive games, ultra‑fast withdrawals.	https://www.google.com/s2/favicons?sz=256&domain=stake.com
53	Stake.us	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	stake.us	Instant	50	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://stake.us/?c=thetylo88	100	US,SWEEPS,CRYPTO,INSTANT,TOP_PICK,KYC	approved	5	2024-10-16 00:00:00+00	\N	US‑focused crypto sweeps: instant‑style features, strong promo calendars.	https://www.google.com/s2/favicons?sz=256&domain=stake.us
54	SolPot	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	solpot.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://solpot.com/r/Gcodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Instant crypto titles: speedy payout rails, no‑KYC options.	https://www.google.com/s2/favicons?sz=256&domain=solpot.com
55	Thrill	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	thrill.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://thrill.com/?r=GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Instant crypto play: quick payouts, wide game catalog.	https://www.google.com/s2/favicons?sz=256&domain=thrill.com
56	Shuffle.com	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	shuffle.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://shuffle.com?r=GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	Lightning crypto hub: very fast withdrawals, provably fair catalog.	https://www.google.com/s2/favicons?sz=256&domain=shuffle.com
57	Scarlet Sands	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	scarletsands.com	Instant	25	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://scarletsands.com/?r=GambleCodez	75	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	🔥 A1 owned sweeps: GC + SC starter pack, $25 max redeem, lightning gift card cashouts, daily login rewards.	https://www.google.com/s2/favicons?sz=256&domain=scarletsands.com
58	LavishLuck	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	game.lavishluck.net	Instant	50	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://invite.lavishluck.net/8dID/0cyelj9k?c=USHZ5D2E	100	US,SWEEPS,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	US sweeps with verified KYC: 20,000 GC + 0.3 SC free, 50 SC bonus after $500 spend, fast cashouts.	https://www.google.com/s2/favicons?sz=256&domain=game.lavishluck.net
59	MegaSpinz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	megaspinz.com	Instant	25	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://megaspinz.com/raf/803489/register	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	A1 owned sweeps: 2.5 SC free, purchase packs with big SC bonuses, easy KYC, daily login rewards.	https://www.google.com/s2/favicons?sz=256&domain=megaspinz.com
60	VegasWay	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	vegasway.com	Instant	25	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	http://vegasway.com/?invited_by=4JQPFN	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	A1 owned sweeps: 1.10 SC free, $25 max redeem, quick gift card cashouts, daily login rewards.	https://www.google.com/s2/favicons?sz=256&domain=vegasway.com
61	JackpotRabbit	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	jackpotrabbit.com	Instant	25	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://jackpotrabbit.com/?r=GambleCodez	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	A1 owned sweeps: fast onboarding, GC + SC starter pack, $25 max redeem, quick gift card cashouts.	https://www.google.com/s2/favicons?sz=256&domain=jackpotrabbit.com
62	Funrize	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/68a479d5acc04452caf2359b	75	US,SWEEPS	approved	4	2025-12-05 00:00:00+00	\N	🚀 Funrize: flagship sweeps play, instant cashouts, daily login rewards.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
63	CiderCasino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	game.cidercasino.com	Instant	25	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://cidercasino.onelink.me/QfGN/oio1bede?c=L9V41WZX	75	US,SWEEPS,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	New sweeps site: 100K GC + 2 SC free on signup, daily rewards, simple slots catalog, mobile app support.	https://www.google.com/s2/favicons?sz=256&domain=game.cidercasino.com
64	BankRolla	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	bankrolla.com	Instant	100	Debit	\N	,,	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-12-05 00:00:00+00	\N	⚠️ BankRolla is blacklisted due to payout and trust concerns; avoid promoting this site.	https://www.google.com/s2/favicons?sz=256&domain=bankrolla.com
65	BC.GAME	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	bc.game	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-18 00:00:00+00	\N	⚠️ Blacklisted: payout & trust reports.	https://www.google.com/s2/favicons?sz=256&domain=bc.game
66	bcgame.us	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-18 00:00:00+00	\N	⚠️ bcgame.us is blacklisted due to payout and trust concerns; avoid promoting this site.	\N
67	Betzed	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	betzed.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-18 00:00:00+00	\N	⚠️ Blacklisted: payout & reliability complaints.	https://www.google.com/s2/favicons?sz=256&domain=betzed.com
68	BetUS	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-18 00:00:00+00	\N	⚠️ Blacklisted: community payout reports.	\N
69	Cool Cat	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	coolcat.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-18 00:00:00+00	\N	⚠️ Blacklisted: withdrawal delay reports.	https://www.google.com/s2/favicons?sz=256&domain=coolcat.io
70	Liberty Slots	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	libertyslots.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-18 00:00:00+00	\N	⚠️ Blacklisted: licensing & payout concerns.	https://www.google.com/s2/favicons?sz=256&domain=libertyslots.com
71	Winz.io	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	winz.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-24 00:00:00+00	\N	⚠️ Blacklisted: rogue crypto casino, payout complaints.	https://www.google.com/s2/favicons?sz=256&domain=winz.io
72	TrueFlip	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	trueflip.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-24 00:00:00+00	\N	⚠️ Blacklisted: rogue crypto casino, trust issues.	https://www.google.com/s2/favicons?sz=256&domain=trueflip.com
73	Sweepto	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-24 00:00:00+00	\N	⚠️ Blacklisted: scam sweeps site, rogue activity.	\N
74	Sweetspins	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	\N	0	BLACKLIST	blacklisted	1	2025-11-24 00:00:00+00	\N	⚠️ Sweetspins is blacklisted due to payout and trust concerns; avoid promoting this site.	\N
75	SweepShark	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepshark.com	Instant	25	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sweepshark.com/promotions	75	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-11-25 00:00:00+00	\N	A1 owned sweeps: free SC + GC packs, $25 max redeem, quick gift card cashouts, daily login rewards.	https://www.google.com/s2/favicons?sz=256&domain=sweepshark.com
76	WowVegas	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	wowvegas.com	3-5 days	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.wowvegas.com/?raf=1060914	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	🔥 Approachable sweeps: easy signup, recurring incentives, GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=wowvegas.com
77	YEET	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	yeet.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://yeet.com/register?aff=GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	⚡ Instant crypto hub: rapid payout rails, low‑friction signup.	https://www.google.com/s2/favicons?sz=256&domain=yeet.com
78	SpinPals	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	spinpals.com	1 day	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.spinpals.com?referralcode=gamblecodes	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	🎰 Casual sweeps: straightforward signup, frequent spin‑based promos.	https://www.google.com/s2/favicons?sz=256&domain=spinpals.com
79	Zunado	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	app.zunado.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://app.zunado.com/invite/NtjlncOBpQ1z	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	🏆 USA sweeps top pick: strong first‑purchase experience, steady promo calendar.	https://www.google.com/s2/favicons?sz=256&domain=app.zunado.com
80	FishTables.io	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	fishtables.io	Instant	100	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://fishtables.io/pre-register?ref=zpvfkfmea5	100	US,SWEEPS,INSTANT,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	🎣 Skill‑based sweeps: instant redemptions, crypto‑friendly rails, GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=fishtables.io
81	VegasGlory	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	vegasglory.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://vegasglory.com?referralCode=1aBppg	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	🔥 Competitive sweeps: strong first‑purchase deals, clear US redemption steps.	https://www.google.com/s2/favicons?sz=256&domain=vegasglory.com
82	Sportzino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sportzino.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sportzino.com/join?ref=GambleCodez	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	🏈 Sports + sweeps: redeemable flows for fans, GambleCodez referral.	https://www.google.com/s2/favicons?sz=256&domain=sportzino.com
83	SpinBlitz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/689b4fa85e73fb766f3ee133	75	US,SWEEPS	approved	4	2025-12-05 00:00:00+00	\N	🔥 SpinBlitz: curated drops, clear redemption flows, hyped sweeps play every day.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
84	SweepsRoyal	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepsroyal.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sweepsroyal.com/signup?ref=GambleCodez	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	👑 US top pick: large promo packs, instant‑friendly rails, consistent fast‑claim support.	https://www.google.com/s2/favicons?sz=256&domain=sweepsroyal.com
85	Flush.com	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	flush.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://flush.com/?ZVY3BS	100	NONUS,CRYPTO,LOOTBOX,INSTANT	approved	5	2025-10-23 00:00:00+00	\N	💎 Lootbox + crypto: broad token support, fast payout rails.	https://www.google.com/s2/favicons?sz=256&domain=flush.com
86	DimeSweeps	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	dimesweeps.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://dimesweeps.com/?ref=r_gamblecodez	100	US,SWEEPS,INSTANT,KYC	approved	3	2025-10-22 00:00:00+00	\N	💵 USA instant sweeps: straightforward promos, quick redemption rails.	https://www.google.com/s2/favicons?sz=256&domain=dimesweeps.com
87	SweepJungle	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepjungle.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=9EXFC1	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	Fast‑claim sweeps: clear first‑purchase offers, step‑by‑step redemption	https://www.google.com/s2/favicons?sz=256&domain=sweepjungle.com
88	JackpotGo	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	game.jackpotgo.com	Instant	3	PayPal	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://game.jackpotgo.com?invite_code=CPUYLLWB	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	🎰 High‑value sweeps: big signup rewards, straightforward redemption flow.	https://www.google.com/s2/favicons?sz=256&domain=game.jackpotgo.com
89	Degen	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	degen.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://degen.com/r/gamblecodez	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-10-22 00:00:00+00	\N	💬 Social sweeps hub: daily freebies, chat‑driven drops, easy claims.	https://www.google.com/s2/favicons?sz=256&domain=degen.com
90	OSEsweeps	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	osesweeps.com	Same day	50	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://osesweeps.com/	10	US,SWEEPS,INSTANT,TOP_PICK,KYC	approved	4	2025-11-18 00:00:00+00	GCODEZ5	🎁 Use code GambleCodez at signup for 50% off first purchase; GCODEZ5 = 5% off future.	https://www.google.com/s2/favicons?sz=256&domain=osesweeps.com
91	Scoop	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	scoop.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://scoop.com/?ref=r_gamblecodez	100	US,SWEEPS,INSTANT,TOP_PICK,KYC	approved	5	2025-11-18 00:00:00+00	\N	📦 Full US sweeps catalog: instant redemptions, clear first‑purchase offers, fast same‑day payouts.	https://www.google.com/s2/favicons?sz=256&domain=scoop.com
92	AceBet	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	acebet.com	Instant	10	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://acebet.com/welcome/r/gamblecodez	75	NONUS,CRYPTO	approved	3	2025-11-24 00:00:00+00	\N	AceBet crypto site — keep in crypto section	https://www.google.com/s2/favicons?sz=256&domain=acebet.com
93	CryptoPlay	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	cryptoplay.io	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://cryptoplay.io/?c=GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2025-11-24 00:00:00+00	\N	🎲 Provably fair crypto games: Dice, Towers, Mines, Keno, Limbo — anonymous play, fast deposits.	https://www.google.com/s2/favicons?sz=256&domain=cryptoplay.io
94	LuckyHands	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	luckyhands.com	2-3 days	50	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://luckyhands.com/sign-up?code=gamblecodes	75	US,SWEEPS,KYC	approved	3	2024-10-16 00:00:00+00	\N	LuckyHands offers an easy sign‑up with daily Sweeps Coin drops and tiered purchase packs. Once you hit 50 SC you can redeem prizes, with payouts taking around 1–3 business days via bank transfer.	https://www.google.com/s2/favicons?sz=256&domain=luckyhands.com
95	LuckyKong	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	luckykong.us	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://luckykong.us/register?promocode=MICHAELP	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	🦍 Simple signup sweeps: frequent bonus pushes, easy redemptions.	https://www.google.com/s2/favicons?sz=256&domain=luckykong.us
96	LuckySlots	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	megafrenzy.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=9HCROB	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	50% extra coins (max $50) for 7 days + Free SC on signup	https://www.google.com/s2/favicons?sz=256&domain=megafrenzy.com
97	SpinQuest	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	spinquest.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://spinquest.com/?u=BEP9K6G	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	🌀 Steady promos hub: user‑friendly signup, recurring engagement.	https://www.google.com/s2/favicons?sz=256&domain=spinquest.com
98	SpinSaga	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	play.spinsagacasino.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://play.spinsagacasino.com/?ref=19087&campaign=referFriend	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	📖 Approachable slots sweeps: frequent bonuses, clear cashier flow.	https://www.google.com/s2/favicons?sz=256&domain=play.spinsagacasino.com
99	SweepLuxe	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepluxe.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sweepluxe.com/sign-up?referralCode=XifRu8	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	💎 Accessible sweeps: guided promos, quick redemption steps.	https://www.google.com/s2/favicons?sz=256&domain=sweepluxe.com
100	SweepNext	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepnext.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sweepnext.com/?c=1698_QBJtf29K	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	⏭️ Routine sweeps: steady cadence, simple account flows.	https://www.google.com/s2/favicons?sz=256&domain=sweepnext.com
101	TheBoss	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	theboss.casino	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://theboss.gamblecodez.com	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	👔 Steady sweeps: approachable signup, common payout rails.	https://www.google.com/s2/favicons?sz=256&domain=theboss.casino
102	ToraTora	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	toratoracasino.com	3-5 days	100	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://toratoracasino.com/?mode=signup&referral=TORA-3AXFK-HN37TE-DX	75	US,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	🐯 Classic sweeps: clear promo banners, straightforward redemption guidance.	https://www.google.com/s2/favicons?sz=256&domain=toratoracasino.com
103	RoxyMoxy	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	5-7 days	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/68c0391afa90bc7b3fcb3a05	75	US,SWEEPS	approved	4	2025-12-05 00:00:00+00	\N	🌸 RoxyMoxy: friendly sweeps play, steady promo offers, accessible support.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
104	Sheesh	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sheeshcasino.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sheesh.gamblecodez.com	75	US,SWEEPS,TOP_PICK	approved	3	2024-10-16 00:00:00+00	\N	😎 Top‑pick sweeps: tidy onboarding, standout welcome offers, GambleCodez referral locked.	https://www.google.com/s2/favicons?sz=256&domain=sheeshcasino.com
105	Rolla	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	jackpota.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=HSQH8T	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	7‑Day Welcome Package Discount	https://www.google.com/s2/favicons?sz=256&domain=jackpota.com
106	RuneHall	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	runehall.com	Instant	10	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://runehall.com/a/GambleCodez	75	NONUS,SWEEPS	approved	3	2024-10-16 00:00:00+00	\N	⚔️ Global sweeps: periodic promotions, clear redemption guidelines.	https://www.google.com/s2/favicons?sz=256&domain=runehall.com
107	SBX	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sbx.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://sbx.com/sign-up?r=GAMBLECODEZ	75	NONUS,CRYPTO	approved	3	2024-10-16 00:00:00+00	\N	💠 No‑KYC crypto play: frequent short sessions, casual promos.	https://www.google.com/s2/favicons?sz=256&domain=sbx.com
108	TrustDice	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	trustdice.win	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://trustdice.win?ref=u_thetylo1988&utm_campaign=refward	75	NONUS,CRYPTO,FAUCET,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	🎲 Faucet + crypto rewards: fast rails, popular for frequent claimants.	https://www.google.com/s2/favicons?sz=256&domain=trustdice.win
109	Vave.com	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	vave.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://vave.com/aff/GambleCodez	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	⚡ Instant crypto claims: fast payouts, simple signup.	https://www.google.com/s2/favicons?sz=256&domain=vave.com
110	Wintomato	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	wintomato.com	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://wintomato.com/en/registration?refcode=1150810	75	NONUS,CRYPTO,FAUCET,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	🍅 Faucet + quick claims: sweeps titles, clear instructions, GambleCodez referral.	https://www.google.com/s2/favicons?sz=256&domain=wintomato.com
111	StarBets.io	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	starbets.io	Instant	1	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://starbets.io/?ref=Xr6ZCPKYRk	75	NONUS,CRYPTO,INSTANT	approved	3	2024-10-16 00:00:00+00	\N	⭐ Crypto gaming: rapid deposits/withdrawals, broad game selection.	https://www.google.com/s2/favicons?sz=256&domain=starbets.io
112	SplashCoins	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	play.splashcoins.com	1 day	100	Skrill	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=RVRFB3	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	150,000 GC + 2 SC free signup; 750,000 GC + 30 SC for $9.99; next‑day Skrill payouts.	https://www.google.com/s2/favicons?sz=256&domain=play.splashcoins.com
113	Lunaland	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	lunalandcasino.com	5-7 days	50	PayPal	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=R7YRUH	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-12-05 00:00:00+00	\N	100,000 LC + 2 SC free signup; 1,000,000 LC + 50 SC for $19.99; PayPal redemptions 1–7 days.	https://www.google.com/s2/favicons?sz=256&domain=lunalandcasino.com
114	High5Casino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	lonestarcasino.com	3-5 days	100	PayPal	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=Y7GQYA	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-12-05 00:00:00+00	\N	700 GC + 55 SC + 400 Diamonds + 1 SC daily for 5 days; gift card/PayPal payouts 1–5 days.	https://www.google.com/s2/favicons?sz=256&domain=lonestarcasino.com
115	Jackpota	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	luckyslots.us	5-7 days	100	GiftCard	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=XQDP5R	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	7,500 GC + 2.5 SC free signup; 80,000 GC + 40 SC for $19.99; gift card payouts 24–48h, cash 1–6 days.	https://www.google.com/s2/favicons?sz=256&domain=luckyslots.us
116	Spree	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	legendz.com	5-7 days	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=SMG0G2	100	US,SWEEPS,TOP_PICK,KYC	approved	5	2025-12-05 00:00:00+00	\N	25,000 GC + 2.5 SC free signup; 30,000 GC + 30 SC for $9.99; 2,000+ games; redemptions 2–10 days.	https://www.google.com/s2/favicons?sz=256&domain=legendz.com
117	RealPrize	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	high5casino.com	2-3 days	100	Bank	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=B9MX5N	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	100,000 GC + 2 SC free signup; 2,000,000 GC + 80 SC + 1,000 VIP points; payouts 1–2 days.	https://www.google.com/s2/favicons?sz=256&domain=high5casino.com
118	Pulsz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	gmv0cw4gptrk.com	Instant	100	Skrill	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=MEF4QG	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	200% Extra Coins offer after registration	https://www.google.com/s2/favicons?sz=256&domain=gmv0cw4gptrk.com
119	CasinoClick	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/67fd1968570905aaacec8495	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	🎰 CasinoClick: instant play, trusted sweeps excitement, smooth access, rapid rewards.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
120	NoLimitCoins	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/686e50bf3b003fb569e37506	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	🚀 NoLimitCoins: wide‑open sweeps action, fast redemption rails, thrill‑seeker catalog.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
121	TaoFortune	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/689dde705e73fb766f3f36f8	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	🌟 TaoFortune: approachable signup, steady promos, effortless sweeps experience.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
122	FortuneWheelz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/689dde895e73fb766f3f370e	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	💎 FortuneWheelz: guided promos, quick redemption steps, polished sweeps vibe.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
123	Thrillzz	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/68be920b5cb05cfc7826fe2c	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	⚡ Thrillzz: hyped signup energy, blazing fast redemptions, sweeps catalog built for excitement.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
124	Cazino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/68e79b4a6258883701da6326	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	🎯 Cazino: premium sweeps play, strong promo packs, streamlined redemption.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
125	SmilesCasino	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	tracker.gemified.io	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://tracker.gemified.io/r/y1scHuqaqHCV/691c77ed2533da79b98178af	75	US,SWEEPS,KYC	approved	4	2025-12-05 00:00:00+00	\N	😁 SmilesCasino: cheerful sweeps play, hyped promos, fast gift card cashouts.	https://www.google.com/s2/favicons?sz=256&domain=tracker.gemified.io
126	HelloMillions	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	hellomillions.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=5NG47A	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	First purchase offer: $19.99 for 40SC + Free SC after registration	https://www.google.com/s2/favicons?sz=256&domain=hellomillions.com
127	MegaFrenzy	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	sweepsflow.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=K49B1A	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	50% Extra SC on first purchase + GC	https://www.google.com/s2/favicons?sz=256&domain=sweepsflow.com
128	EpicSweeps	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	epicsweep.us	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://epicsweep.us?ref=2462_thetylo88	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-06 00:00:00+00	\N	🔥 EPICSWEEPS LAUNCH: 2SC FREE. Sister site to SpeedSweeps & RoyalSweeps — Premium Gold Bundles live: 12,000 W + 6 FREE SC + 600 VIP for $4.99 (20% EXTRA); BEST VALUE 200,000 W + 40 FREE SC + 2,000 VIP for $19.99 (20% EXTRA); 250,000 W + 50 FREE SC + 3,500 VIP for $34.99 — first‑purchase discounts, instant redemption, verified KYC, blazing fast gift card cashouts, daily VIP drops, must‑play launch energy!	https://www.google.com/s2/favicons?sz=256&domain=epicsweep.us
129	Stackr	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	stackrcasino.com	Instant	100	Debit	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.stackrcasino.com?referralcode=7bf413f9-fa37-4e66-9fc3-8ecda9804d80	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-06 00:00:00+00	\N	900,000 Gold Coins + 3 Free SC on first purchase	https://www.google.com/s2/favicons?sz=256&domain=stackrcasino.com
130	JacksClub	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	jacksclub.io	Instant	10	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://jacksclub.io?r=gamblecodez	100	US,NONUS,TOP_PICK,NO_KYC,INSTANT	approved	5	2025-12-09 00:00:00+00	\N	Social slots + daily tournaments; US + NON‑US access; instant play; GambleCodez pick.	https://www.google.com/s2/favicons?sz=256&domain=jacksclub.io
131	Shock	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	shock.com	Instant	\N	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://www.shock.com/?r=gamblecodez	100	NONUS,TOP_PICK,NO_KYC,INSTANT,FAUCET	approved	5	2025-12-09 00:00:00+00	\N	Faucet-style micro-claims; fast rails; no-KYC friendly; instant withdrawals.	https://www.google.com/s2/favicons?sz=256&domain=shock.com
132	NutsGG	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	nuts.gg	Instant	\N	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://nuts.gg/play/GambleCodez	100	US,NONUS,TOP_PICK,NO_KYC,INSTANT,FAUCET,SWEEPS	approved	5	2025-12-09 00:00:00+00	\N	Free tokens on join; faucet claims; US sweeps available; redeemable rewards.	https://www.google.com/s2/favicons?sz=256&domain=nuts.gg
133	Duel	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	duel.com	Instant	\N	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://duel.com/r/GambleCodez	100	NONUS,TOP_PICK,NO_KYC,INSTANT	approved	5	2025-12-09 00:00:00+00	\N	Head-to-head competitive rooms; instant payouts; no-KYC friendly; high-intensity play.	https://www.google.com/s2/favicons?sz=256&domain=duel.com
134	Shuffle.us	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	shuffle.us	Instant	100	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://shuffle.us?r=Telegram	75	US,SWEEPS,CRYPTO,INSTANT,TOP_PICK,KYC	approved	5	2024-10-16 00:00:00+00	\N	US sweeps top pick: instant crypto prize redemption (min redeem 100 SC); free SC on signup with code TELEGRAM; famous original games + huge slot provider selection; GC usable for VIP progression; KYC required; rapid redemption guidance.	https://www.google.com/s2/favicons?sz=256&domain=shuffle.us
135	CasinoCluck	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://cluck.gamblecodez.com	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	4	\N	Our Top Pick — free SC on signup + Daily Wheel (1–5 SC every day). KYC required for bonus SC and full bonus access.	https://www.google.com/s2/favicons?sz=256&domain=casinocluck.com	casinocluck.com
136	FunzCity	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	funzcity.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=CZBL3X	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	125k Coins + Discounted first purchase + Extras	https://www.google.com/s2/favicons?sz=256&domain=funzcity.com
137	LoneStar	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	lonestarcasino.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=LGKIBJ	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	$24.99 for 125K GC + 50SC free, $99.99 for 900K GC + 105SC free	https://www.google.com/s2/favicons?sz=256&domain=lonestarcasino.com
138	PlayFame	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	playfame.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=QEFWVC	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	Join PlayFame for generous sweeps coins bonuses, top‑rated features and claim your welcome package. Enjoy recurring bonuses and a seamless gaming experience.	https://www.google.com/s2/favicons?sz=256&domain=playfame.com
139	LuckyStake	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	luckystake.com	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://referral.sweepsflow.com/?r=66KFCD	100	US,SWEEPS,TOP_PICK,KYC,INSTANT	approved	5	2025-12-05 00:00:00+00	\N	7,500 GC + 2.5 SC no deposit; 150% bonus of 50,000 GC + 25 SC at $9.99	https://www.google.com/s2/favicons?sz=256&domain=luckystake.com
140	Yabby	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	yabbycasino.com	Instant	50	Crypto	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://yabbycasino.com/?r=GambleCodez	100	NONUS,CRYPTO,INSTANT,TOP_PICK	approved	5	2025-12-09 00:00:00+00	\N	🌐 Crypto sweeps: hyped promos, GambleCodez verified.	https://www.google.com/s2/favicons?sz=256&domain=yabbycasino.com
141	MetaWin.us	\N	\N	f	\N	f	f	f	f	t	0	\N	\N	metawin.us	\N	\N	\N	\N	\N	2025-12-30 22:08:48.02215	2025-12-30 22:08:48.02215	https://metawin.us/gamblecodez	100	US,SWEEPS,CRYPTO,TOP_PICK,KYC,INSTANT	approved	5	2025-12-14 00:00:00+00	\N	Signup AMOE mail-in grants 3 SC free + Daily login bonus up to 1 SC per day; New verified KYC accounts receive 10 SC free after purchasing 10 SC (limit 1); Instant crypto redemptions (1 SC = 1 USDC); GambleCodez verified Top Pick — hybrid sweeps + crypto synergy, turbo payouts, AMOE-friendly launch.	https://www.google.com/s2/favicons?sz=256&domain=metawin.us
\.


--
-- Data for Name: ai_classification_snapshots; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.ai_classification_snapshots (id, raw_drop_id, model_name, model_version, run_at, label, score, details, is_promo, confidence_score, extracted_codes, extracted_urls, resolved_domains, guessed_casino, guessed_jurisdiction, proposed_headline, proposed_description, validity_score, is_spam, is_duplicate, duplicate_of_raw_drop_id) FROM stdin;
\.


--
-- Data for Name: blacklist; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.blacklist (id, user_id, reason, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: daily_drops; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.daily_drops (id, promo_code, bonus_link, affiliate_id, jurisdiction, category, active, drop_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: drop_admin_actions; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.drop_admin_actions (id, admin_user, action_type, target_type, target_id, notes, created_at, resource_type, resource_id, changes, reason) FROM stdin;
\.


--
-- Data for Name: drop_ai_learning; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.drop_ai_learning (id, raw_drop_id, promo_candidate_id, affiliate_id, ai_label, admin_label, confidence, notes, created_at) FROM stdin;
\.


--
-- Data for Name: drop_notifications_sent; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.drop_notifications_sent (id, drop_promo_id, user_id, channel, sent_at, meta) FROM stdin;
\.


--
-- Data for Name: drop_promos; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.drop_promos (id, promo_candidate_id, raw_drop_id, affiliate_id, promo_code, promo_description, promo_url, jurisdiction, casino_name, approved_at, approved_by, is_active, is_featured, created_at, updated_at, ai_notes, status, source_raw_drop_id, source_promo_candidate_id, headline, description, promo_type, bonus_code, resolved_domain, mapped_casino_id, jurisdiction_tags, quick_signup_url, validity_flags, audit_trail, featured, view_count, click_count, expires_at) FROM stdin;
\.


--
-- Data for Name: drop_user_reports; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.drop_user_reports (id, drop_promo_id, user_id, report_type, report_notes, created_at, report_text) FROM stdin;
\.


--
-- Data for Name: live_banner; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.live_banner (id, message, link_url, active, priority, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: newsletter_campaigns; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.newsletter_campaigns (id, name, subject, preheader, segment, content, status, sent_count, open_rate, click_rate, scheduled_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: newsletter_segments; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.newsletter_segments (id, name, description, rules, approx_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: newsletter_subscribers; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.newsletter_subscribers (id, user_id, email, unsubscribed, last_opened, last_clicked, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: newsletter_templates; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.newsletter_templates (id, name, type, subject, body, last_used, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_candidates; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.promo_candidates (id, raw_drop_id, classification_snapshot_id, affiliate_id, promo_code, promo_description, promo_url, jurisdiction, casino_name, confidence, ai_notes, created_at, updated_at, is_valid, is_hidden, status, ai_snapshot_id, headline, description, promo_type, bonus_code, resolved_domain, mapped_casino_id, jurisdiction_tags, validity_score, is_spam, is_duplicate, reviewed_at) FROM stdin;
\.


--
-- Data for Name: promo_decisions; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.promo_decisions (id, promo_id, decision, affiliate_id, deny_reason, reviewed_by, reviewed_at) FROM stdin;
\.


--
-- Data for Name: promos; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.promos (id, source, channel, content, clean_text, submitted_by, status, affiliate_id, deny_reason, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: raffle_entries; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.raffle_entries (id, raffle_id, user_id, entry_time, entry_source) FROM stdin;
\.


--
-- Data for Name: raffle_winners; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.raffle_winners (id, raffle_id, winner, prize, won_at) FROM stdin;
\.


--
-- Data for Name: raffles; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.raffles (id, title, description, active, secret, hidden, prize_type, prize_value, raffle_type, num_winners, secret_code, entry_sources, entries_per_source, winner_selection_method, allow_repeat_winners, start_date, end_date, prize_site_id, sponsor_site, sponsor_campaign_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: raw_drops; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.raw_drops (id, source, source_message_id, source_channel, source_user, affiliate_id, raw_text, detected_language, ingested_at, processed_at, is_processed, is_hidden, jurisdiction_guess, casino_name_guess, meta, source_channel_id, source_user_id, source_username, raw_urls, bonus_code_candidates, status, created_at) FROM stdin;
\.


--
-- Data for Name: redirects; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.redirects (id, slug, weight, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.settings (key, value, updated_at) FROM stdin;
\.


--
-- Data for Name: spin_logs; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.spin_logs (id, user_id, reward, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: user_notification_settings; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.user_notification_settings (id, user_id, telegram_notifications, email_notifications, push_notifications, drops_enabled, drops_last_sent, drops_frequency, drops_telegram, drops_email, drops_push, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.users (id, user_id, pin_hash, locked, telegram_id, telegram_username, cwallet_id, email, username, jurisdiction, created_at, updated_at) FROM stdin;
1	cw_49657363	\N	f	\N	\N	49657363	GambleCodez@gmail.com	GambleCodez	GLOBAL	2025-12-31 00:28:09.723889	2025-12-31 00:33:19.578176
\.


--
-- Data for Name: wheel_config; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.wheel_config (id, spins_per_day, target_raffle_id, auto_draw_enabled, auto_draw_frequency, auto_draw_time, prize_slots, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wheel_prize_slots; Type: TABLE DATA; Schema: public; Owner: gamblecodez
--

COPY public.wheel_prize_slots (id, wheel_config_id, label, color, entry_multiplier, chance_weight, sort_order) FROM stdin;
\.


--
-- Name: ad_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.ad_campaigns_id_seq', 1, false);


--
-- Name: ad_clicks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.ad_clicks_id_seq', 1, false);


--
-- Name: ad_impressions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.ad_impressions_id_seq', 1, false);


--
-- Name: ad_placements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.ad_placements_id_seq', 1, false);


--
-- Name: admin_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.admin_audit_log_id_seq', 1, false);


--
-- Name: ads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.ads_id_seq', 1, false);


--
-- Name: affiliates_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.affiliates_master_id_seq', 141, true);


--
-- Name: ai_classification_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.ai_classification_snapshots_id_seq', 1, false);


--
-- Name: blacklist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.blacklist_id_seq', 1, false);


--
-- Name: daily_drops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.daily_drops_id_seq', 1, false);


--
-- Name: drop_admin_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.drop_admin_actions_id_seq', 1, false);


--
-- Name: drop_ai_learning_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.drop_ai_learning_id_seq', 1, false);


--
-- Name: drop_notifications_sent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.drop_notifications_sent_id_seq', 1, false);


--
-- Name: drop_promos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.drop_promos_id_seq', 1, false);


--
-- Name: drop_user_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.drop_user_reports_id_seq', 1, false);


--
-- Name: live_banner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.live_banner_id_seq', 1, false);


--
-- Name: newsletter_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.newsletter_campaigns_id_seq', 1, false);


--
-- Name: newsletter_segments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.newsletter_segments_id_seq', 1, false);


--
-- Name: newsletter_subscribers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.newsletter_subscribers_id_seq', 1, false);


--
-- Name: newsletter_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.newsletter_templates_id_seq', 1, false);


--
-- Name: promo_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.promo_candidates_id_seq', 1, false);


--
-- Name: promo_decisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.promo_decisions_id_seq', 1, false);


--
-- Name: promos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.promos_id_seq', 1, false);


--
-- Name: raffle_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.raffle_entries_id_seq', 1, false);


--
-- Name: raffle_winners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.raffle_winners_id_seq', 1, false);


--
-- Name: raffles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.raffles_id_seq', 1, false);


--
-- Name: raw_drops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.raw_drops_id_seq', 1, false);


--
-- Name: redirects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.redirects_id_seq', 1, false);


--
-- Name: spin_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.spin_logs_id_seq', 1, false);


--
-- Name: user_notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.user_notification_settings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: wheel_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.wheel_config_id_seq', 1, false);


--
-- Name: wheel_prize_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gamblecodez
--

SELECT pg_catalog.setval('public.wheel_prize_slots_id_seq', 1, false);


--
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: gamblecodez
--

ALTER TABLE ONLY neon_auth.users_sync
    ADD CONSTRAINT users_sync_pkey PRIMARY KEY (id);


--
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);


--
-- Name: ad_clicks ad_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_pkey PRIMARY KEY (id);


--
-- Name: ad_impressions ad_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_pkey PRIMARY KEY (id);


--
-- Name: ad_placements ad_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT ad_placements_pkey PRIMARY KEY (id);


--
-- Name: ad_placements ad_placements_placement_id_key; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT ad_placements_placement_id_key UNIQUE (placement_id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: affiliates_master affiliates_master_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.affiliates_master
    ADD CONSTRAINT affiliates_master_pkey PRIMARY KEY (id);


--
-- Name: ai_classification_snapshots ai_classification_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ai_classification_snapshots
    ADD CONSTRAINT ai_classification_snapshots_pkey PRIMARY KEY (id);


--
-- Name: blacklist blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_pkey PRIMARY KEY (id);


--
-- Name: blacklist blacklist_user_id_key; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_user_id_key UNIQUE (user_id);


--
-- Name: daily_drops daily_drops_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.daily_drops
    ADD CONSTRAINT daily_drops_pkey PRIMARY KEY (id);


--
-- Name: drop_admin_actions drop_admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_admin_actions
    ADD CONSTRAINT drop_admin_actions_pkey PRIMARY KEY (id);


--
-- Name: drop_ai_learning drop_ai_learning_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_pkey PRIMARY KEY (id);


--
-- Name: drop_notifications_sent drop_notifications_sent_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_notifications_sent
    ADD CONSTRAINT drop_notifications_sent_pkey PRIMARY KEY (id);


--
-- Name: drop_promos drop_promos_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_pkey PRIMARY KEY (id);


--
-- Name: drop_user_reports drop_user_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_user_reports
    ADD CONSTRAINT drop_user_reports_pkey PRIMARY KEY (id);


--
-- Name: live_banner live_banner_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.live_banner
    ADD CONSTRAINT live_banner_pkey PRIMARY KEY (id);


--
-- Name: newsletter_campaigns newsletter_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_campaigns
    ADD CONSTRAINT newsletter_campaigns_pkey PRIMARY KEY (id);


--
-- Name: newsletter_segments newsletter_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_segments
    ADD CONSTRAINT newsletter_segments_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: newsletter_templates newsletter_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.newsletter_templates
    ADD CONSTRAINT newsletter_templates_pkey PRIMARY KEY (id);


--
-- Name: promo_candidates promo_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_pkey PRIMARY KEY (id);


--
-- Name: promo_decisions promo_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_decisions
    ADD CONSTRAINT promo_decisions_pkey PRIMARY KEY (id);


--
-- Name: promos promos_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT promos_pkey PRIMARY KEY (id);


--
-- Name: raffle_entries raffle_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_entries
    ADD CONSTRAINT raffle_entries_pkey PRIMARY KEY (id);


--
-- Name: raffle_entries raffle_entries_raffle_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_entries
    ADD CONSTRAINT raffle_entries_raffle_id_user_id_key UNIQUE (raffle_id, user_id);


--
-- Name: raffle_winners raffle_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_winners
    ADD CONSTRAINT raffle_winners_pkey PRIMARY KEY (id);


--
-- Name: raffles raffles_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffles
    ADD CONSTRAINT raffles_pkey PRIMARY KEY (id);


--
-- Name: raw_drops raw_drops_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raw_drops
    ADD CONSTRAINT raw_drops_pkey PRIMARY KEY (id);


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_pkey PRIMARY KEY (id);


--
-- Name: redirects redirects_slug_key; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_slug_key UNIQUE (slug);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: spin_logs spin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.spin_logs
    ADD CONSTRAINT spin_logs_pkey PRIMARY KEY (id);


--
-- Name: user_notification_settings user_notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.user_notification_settings
    ADD CONSTRAINT user_notification_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE (user_id);


--
-- Name: wheel_config wheel_config_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.wheel_config
    ADD CONSTRAINT wheel_config_pkey PRIMARY KEY (id);


--
-- Name: wheel_prize_slots wheel_prize_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.wheel_prize_slots
    ADD CONSTRAINT wheel_prize_slots_pkey PRIMARY KEY (id);


--
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: gamblecodez
--

CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);


--
-- Name: idx_ad_campaigns_status; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns USING btree (status);


--
-- Name: idx_ad_campaigns_type; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_campaigns_type ON public.ad_campaigns USING btree (type);


--
-- Name: idx_ad_clicks_campaign; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_clicks_campaign ON public.ad_clicks USING btree (campaign_id);


--
-- Name: idx_ad_clicks_created; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_clicks_created ON public.ad_clicks USING btree (created_at);


--
-- Name: idx_ad_clicks_placement; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_clicks_placement ON public.ad_clicks USING btree (placement_id);


--
-- Name: idx_ad_clicks_user; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_clicks_user ON public.ad_clicks USING btree (user_id);


--
-- Name: idx_ad_impressions_campaign; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_impressions_campaign ON public.ad_impressions USING btree (campaign_id);


--
-- Name: idx_ad_impressions_created; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_impressions_created ON public.ad_impressions USING btree (created_at);


--
-- Name: idx_ad_impressions_placement; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_impressions_placement ON public.ad_impressions USING btree (placement_id);


--
-- Name: idx_ad_impressions_user; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_impressions_user ON public.ad_impressions USING btree (user_id);


--
-- Name: idx_ad_placements_placement_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ad_placements_placement_id ON public.ad_placements USING btree (placement_id);


--
-- Name: idx_admin_audit_log_created_at; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: idx_admin_audit_log_resource; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_admin_audit_log_resource ON public.admin_audit_log USING btree (resource_type, resource_id);


--
-- Name: idx_ai_snap_label; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ai_snap_label ON public.ai_classification_snapshots USING btree (label);


--
-- Name: idx_ai_snap_raw_drop_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_ai_snap_raw_drop_id ON public.ai_classification_snapshots USING btree (raw_drop_id);


--
-- Name: idx_blacklist_user_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_blacklist_user_id ON public.blacklist USING btree (user_id);


--
-- Name: idx_daily_drops_active; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_daily_drops_active ON public.daily_drops USING btree (active);


--
-- Name: idx_daily_drops_drop_date; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_daily_drops_drop_date ON public.daily_drops USING btree (drop_date DESC);


--
-- Name: idx_drop_admin_actions_target; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_admin_actions_target ON public.drop_admin_actions USING btree (target_type, target_id);


--
-- Name: idx_drop_ai_learning_affiliate_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_ai_learning_affiliate_id ON public.drop_ai_learning USING btree (affiliate_id);


--
-- Name: idx_drop_ai_learning_raw_drop_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_ai_learning_raw_drop_id ON public.drop_ai_learning USING btree (raw_drop_id);


--
-- Name: idx_drop_notifications_sent_promo_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_notifications_sent_promo_id ON public.drop_notifications_sent USING btree (drop_promo_id);


--
-- Name: idx_drop_notifications_sent_user_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_notifications_sent_user_id ON public.drop_notifications_sent USING btree (user_id);


--
-- Name: idx_drop_promos_affiliate_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_affiliate_id ON public.drop_promos USING btree (affiliate_id);


--
-- Name: idx_drop_promos_candidate_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_candidate_id ON public.drop_promos USING btree (promo_candidate_id);


--
-- Name: idx_drop_promos_expires_at; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_expires_at ON public.drop_promos USING btree (expires_at);


--
-- Name: idx_drop_promos_featured; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_featured ON public.drop_promos USING btree (featured);


--
-- Name: idx_drop_promos_is_active; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_is_active ON public.drop_promos USING btree (is_active);


--
-- Name: idx_drop_promos_is_featured; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_is_featured ON public.drop_promos USING btree (is_featured);


--
-- Name: idx_drop_promos_jurisdiction_tags; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_jurisdiction_tags ON public.drop_promos USING gin (jurisdiction_tags);


--
-- Name: idx_drop_promos_mapped_casino_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_mapped_casino_id ON public.drop_promos USING btree (mapped_casino_id);


--
-- Name: idx_drop_promos_status; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_promos_status ON public.drop_promos USING btree (status);


--
-- Name: idx_drop_user_reports_promo_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_drop_user_reports_promo_id ON public.drop_user_reports USING btree (drop_promo_id);


--
-- Name: idx_newsletter_campaigns_segment; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_newsletter_campaigns_segment ON public.newsletter_campaigns USING btree (segment);


--
-- Name: idx_newsletter_campaigns_status; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_newsletter_campaigns_status ON public.newsletter_campaigns USING btree (status);


--
-- Name: idx_newsletter_subscribers_email; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers USING btree (email);


--
-- Name: idx_promo_candidates_affiliate_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_candidates_affiliate_id ON public.promo_candidates USING btree (affiliate_id);


--
-- Name: idx_promo_candidates_ai_snapshot_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_candidates_ai_snapshot_id ON public.promo_candidates USING btree (ai_snapshot_id);


--
-- Name: idx_promo_candidates_is_valid; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_candidates_is_valid ON public.promo_candidates USING btree (is_valid);


--
-- Name: idx_promo_candidates_mapped_casino_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_candidates_mapped_casino_id ON public.promo_candidates USING btree (mapped_casino_id);


--
-- Name: idx_promo_candidates_raw_drop_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_candidates_raw_drop_id ON public.promo_candidates USING btree (raw_drop_id);


--
-- Name: idx_promo_candidates_status; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_candidates_status ON public.promo_candidates USING btree (status);


--
-- Name: idx_promo_decisions_decision; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_decisions_decision ON public.promo_decisions USING btree (decision);


--
-- Name: idx_promo_decisions_promo_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promo_decisions_promo_id ON public.promo_decisions USING btree (promo_id);


--
-- Name: idx_promos_affiliate_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promos_affiliate_id ON public.promos USING btree (affiliate_id);


--
-- Name: idx_promos_channel; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promos_channel ON public.promos USING btree (channel);


--
-- Name: idx_promos_created_at; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promos_created_at ON public.promos USING btree (created_at DESC);


--
-- Name: idx_promos_status; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_promos_status ON public.promos USING btree (status);


--
-- Name: idx_raw_drops_affiliate_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_raw_drops_affiliate_id ON public.raw_drops USING btree (affiliate_id);


--
-- Name: idx_raw_drops_ingested_at; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_raw_drops_ingested_at ON public.raw_drops USING btree (ingested_at);


--
-- Name: idx_raw_drops_is_processed; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_raw_drops_is_processed ON public.raw_drops USING btree (is_processed);


--
-- Name: idx_raw_drops_source; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_raw_drops_source ON public.raw_drops USING btree (source);


--
-- Name: idx_raw_drops_source_user_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_raw_drops_source_user_id ON public.raw_drops USING btree (source_user_id);


--
-- Name: idx_raw_drops_status; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_raw_drops_status ON public.raw_drops USING btree (status);


--
-- Name: idx_redirects_slug; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_redirects_slug ON public.redirects USING btree (slug);


--
-- Name: idx_users_cwallet_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_users_cwallet_id ON public.users USING btree (cwallet_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_telegram_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_users_telegram_id ON public.users USING btree (telegram_id);


--
-- Name: idx_users_user_id; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_users_user_id ON public.users USING btree (user_id);


--
-- Name: idx_wheel_prize_slots_config; Type: INDEX; Schema: public; Owner: gamblecodez
--

CREATE INDEX idx_wheel_prize_slots_config ON public.wheel_prize_slots USING btree (wheel_config_id);


--
-- Name: drop_promos trg_drop_promos_updated_at; Type: TRIGGER; Schema: public; Owner: gamblecodez
--

CREATE TRIGGER trg_drop_promos_updated_at BEFORE UPDATE ON public.drop_promos FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: promo_candidates trg_promo_candidates_updated_at; Type: TRIGGER; Schema: public; Owner: gamblecodez
--

CREATE TRIGGER trg_promo_candidates_updated_at BEFORE UPDATE ON public.promo_candidates FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: user_notification_settings trg_user_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: gamblecodez
--

CREATE TRIGGER trg_user_notification_settings_updated_at BEFORE UPDATE ON public.user_notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: ad_clicks ad_clicks_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id);


--
-- Name: ad_clicks ad_clicks_placement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.ad_placements(id);


--
-- Name: ad_impressions ad_impressions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id);


--
-- Name: ad_impressions ad_impressions_placement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.ad_placements(id);


--
-- Name: ai_classification_snapshots ai_class_snap_raw_drop_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ai_classification_snapshots
    ADD CONSTRAINT ai_class_snap_raw_drop_fk FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: ai_classification_snapshots ai_classification_snapshots_raw_drop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.ai_classification_snapshots
    ADD CONSTRAINT ai_classification_snapshots_raw_drop_id_fkey FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: daily_drops daily_drops_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.daily_drops
    ADD CONSTRAINT daily_drops_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id);


--
-- Name: drop_ai_learning drop_ai_learning_affiliate_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_affiliate_fk FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: drop_ai_learning drop_ai_learning_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: drop_ai_learning drop_ai_learning_candidate_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_candidate_fk FOREIGN KEY (promo_candidate_id) REFERENCES public.promo_candidates(id) ON DELETE SET NULL;


--
-- Name: drop_ai_learning drop_ai_learning_promo_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_promo_candidate_id_fkey FOREIGN KEY (promo_candidate_id) REFERENCES public.promo_candidates(id) ON DELETE SET NULL;


--
-- Name: drop_ai_learning drop_ai_learning_raw_drop_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_raw_drop_fk FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: drop_ai_learning drop_ai_learning_raw_drop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_raw_drop_id_fkey FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: drop_notifications_sent drop_notifications_sent_drop_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_notifications_sent
    ADD CONSTRAINT drop_notifications_sent_drop_promo_id_fkey FOREIGN KEY (drop_promo_id) REFERENCES public.drop_promos(id) ON DELETE CASCADE;


--
-- Name: drop_notifications_sent drop_notifications_sent_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_notifications_sent
    ADD CONSTRAINT drop_notifications_sent_promo_fk FOREIGN KEY (drop_promo_id) REFERENCES public.drop_promos(id) ON DELETE CASCADE;


--
-- Name: drop_promos drop_promos_affiliate_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_affiliate_fk FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: drop_promos drop_promos_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: drop_promos drop_promos_candidate_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_candidate_fk FOREIGN KEY (promo_candidate_id) REFERENCES public.promo_candidates(id) ON DELETE CASCADE;


--
-- Name: drop_promos drop_promos_mapped_casino_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_mapped_casino_fk FOREIGN KEY (mapped_casino_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: drop_promos drop_promos_promo_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_promo_candidate_id_fkey FOREIGN KEY (promo_candidate_id) REFERENCES public.promo_candidates(id) ON DELETE CASCADE;


--
-- Name: drop_promos drop_promos_raw_drop_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_raw_drop_fk FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: drop_promos drop_promos_raw_drop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_promos
    ADD CONSTRAINT drop_promos_raw_drop_id_fkey FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: drop_user_reports drop_user_reports_drop_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_user_reports
    ADD CONSTRAINT drop_user_reports_drop_promo_id_fkey FOREIGN KEY (drop_promo_id) REFERENCES public.drop_promos(id) ON DELETE CASCADE;


--
-- Name: drop_user_reports drop_user_reports_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.drop_user_reports
    ADD CONSTRAINT drop_user_reports_promo_fk FOREIGN KEY (drop_promo_id) REFERENCES public.drop_promos(id) ON DELETE CASCADE;


--
-- Name: promo_candidates promo_candidates_affiliate_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_affiliate_fk FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: promo_candidates promo_candidates_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: promo_candidates promo_candidates_ai_snapshot_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_ai_snapshot_fk FOREIGN KEY (ai_snapshot_id) REFERENCES public.ai_classification_snapshots(id) ON DELETE SET NULL;


--
-- Name: promo_candidates promo_candidates_classification_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_classification_snapshot_id_fkey FOREIGN KEY (classification_snapshot_id) REFERENCES public.ai_classification_snapshots(id) ON DELETE SET NULL;


--
-- Name: promo_candidates promo_candidates_mapped_casino_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_mapped_casino_fk FOREIGN KEY (mapped_casino_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: promo_candidates promo_candidates_raw_drop_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_raw_drop_fk FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: promo_candidates promo_candidates_raw_drop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_raw_drop_id_fkey FOREIGN KEY (raw_drop_id) REFERENCES public.raw_drops(id) ON DELETE CASCADE;


--
-- Name: promo_candidates promo_candidates_snapshot_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_candidates
    ADD CONSTRAINT promo_candidates_snapshot_fk FOREIGN KEY (classification_snapshot_id) REFERENCES public.ai_classification_snapshots(id) ON DELETE SET NULL;


--
-- Name: promo_decisions promo_decisions_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_decisions
    ADD CONSTRAINT promo_decisions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: promo_decisions promo_decisions_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promo_decisions
    ADD CONSTRAINT promo_decisions_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promos(id) ON DELETE CASCADE;


--
-- Name: promos promos_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT promos_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id) ON DELETE SET NULL;


--
-- Name: raffle_entries raffle_entries_raffle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_entries
    ADD CONSTRAINT raffle_entries_raffle_id_fkey FOREIGN KEY (raffle_id) REFERENCES public.raffles(id) ON DELETE CASCADE;


--
-- Name: raffle_winners raffle_winners_raffle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffle_winners
    ADD CONSTRAINT raffle_winners_raffle_id_fkey FOREIGN KEY (raffle_id) REFERENCES public.raffles(id) ON DELETE CASCADE;


--
-- Name: raffles raffles_prize_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raffles
    ADD CONSTRAINT raffles_prize_site_id_fkey FOREIGN KEY (prize_site_id) REFERENCES public.affiliates_master(id);


--
-- Name: raw_drops raw_drops_affiliate_fk; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raw_drops
    ADD CONSTRAINT raw_drops_affiliate_fk FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id);


--
-- Name: raw_drops raw_drops_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.raw_drops
    ADD CONSTRAINT raw_drops_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates_master(id);


--
-- Name: wheel_config wheel_config_target_raffle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.wheel_config
    ADD CONSTRAINT wheel_config_target_raffle_id_fkey FOREIGN KEY (target_raffle_id) REFERENCES public.raffles(id);


--
-- Name: wheel_prize_slots wheel_prize_slots_wheel_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gamblecodez
--

ALTER TABLE ONLY public.wheel_prize_slots
    ADD CONSTRAINT wheel_prize_slots_wheel_config_id_fkey FOREIGN KEY (wheel_config_id) REFERENCES public.wheel_config(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict YzwHS6Px239jsWLETwjpJPWsAcKzzsMzdmJYOblZK0MhJbmqMQQWIpTqApX2AK4

