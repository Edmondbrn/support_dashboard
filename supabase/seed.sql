SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict eKjBKkhloNXtpDWWDBQc9IcVJlwUF7ozgPw7RghkYAniqIVukdkX2G5ICkNevot

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Insert into vaults
--

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'app_supabase_url') THEN
		PERFORM vault.update_secret(
			(SELECT id FROM vault.secrets WHERE name = 'app_supabase_url'),
			'http://kong:8000'
		);
	ELSE
		PERFORM vault.create_secret(
		'http://kong:8000',
		'app_supabase_url'
		);
	END IF;
END
$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'edge_function_resend_secret') THEN
		PERFORM vault.update_secret(
			(SELECT id FROM vault.secrets WHERE name = 'edge_function_resend_secret'),
			'/Vsw3+7Ns8WRKgtjt5DfGEuaeKSPkn+n2bUTNpopzrs='
		);
	ELSE
		PERFORM vault.create_secret(
		'/Vsw3+7Ns8WRKgtjt5DfGEuaeKSPkn+n2bUTNpopzrs=',
		'edge_function_resend_secret'
		);
	END IF;
END
$$;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '9e03719c-40a7-4b78-a333-b3bcf3404de9', '{"action":"user_signedup","actor_id":"ff4310b4-dbcc-4901-80d9-1dd49e51d626","actor_username":"agent1@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-15 08:17:35.654153+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cd505b9b-97ba-4ba9-bfed-d2872d17739c', '{"action":"login","actor_id":"ff4310b4-dbcc-4901-80d9-1dd49e51d626","actor_username":"agent1@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:17:35.665216+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dd08a784-97b6-4dc5-be78-0149996b373e', '{"action":"logout","actor_id":"ff4310b4-dbcc-4901-80d9-1dd49e51d626","actor_username":"agent1@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:17:35.73936+00', ''),
	('00000000-0000-0000-0000-000000000000', '1ec6edaa-d302-40dd-9ac0-21114bbe6991', '{"action":"user_signedup","actor_id":"80686b90-fa82-45a3-b9d0-b13807f1bdc5","actor_username":"agent2@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-15 08:18:01.6386+00', ''),
	('00000000-0000-0000-0000-000000000000', '311e80f6-0c7d-4769-88e3-a12ddc7913f3', '{"action":"login","actor_id":"80686b90-fa82-45a3-b9d0-b13807f1bdc5","actor_username":"agent2@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:18:01.656966+00', ''),
	('00000000-0000-0000-0000-000000000000', '3fe09f83-2379-47d1-8b78-15b3cbcdd9ce', '{"action":"logout","actor_id":"80686b90-fa82-45a3-b9d0-b13807f1bdc5","actor_username":"agent2@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:18:01.723996+00', ''),
	('00000000-0000-0000-0000-000000000000', '0912fb40-edc2-4f45-beb8-9b19372181f3', '{"action":"login","actor_id":"ff4310b4-dbcc-4901-80d9-1dd49e51d626","actor_username":"agent1@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:18:13.890254+00', ''),
	('00000000-0000-0000-0000-000000000000', '1606b9e5-a099-431e-945b-32b052455ea4', '{"action":"logout","actor_id":"ff4310b4-dbcc-4901-80d9-1dd49e51d626","actor_username":"agent1@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:18:19.2418+00', ''),
	('00000000-0000-0000-0000-000000000000', '909c332f-cb49-46b1-9668-4cf1ee59d929', '{"action":"user_signedup","actor_id":"4db67921-e23b-4725-84ec-38470b5fd65f","actor_username":"client1@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-15 08:18:42.548062+00', ''),
	('00000000-0000-0000-0000-000000000000', '8174c8a8-dcda-49fa-9611-cc3cebee75f6', '{"action":"login","actor_id":"4db67921-e23b-4725-84ec-38470b5fd65f","actor_username":"client1@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:18:42.566791+00', ''),
	('00000000-0000-0000-0000-000000000000', '678ac4f0-2b1e-439b-986d-a0e3ce0beb68', '{"action":"logout","actor_id":"4db67921-e23b-4725-84ec-38470b5fd65f","actor_username":"client1@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:18:42.633155+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da7858cf-9812-44e1-867b-47473379359f', '{"action":"user_signedup","actor_id":"e1e9492e-ec66-4705-bcb6-59839d5589f6","actor_username":"client2@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-15 08:19:03.101877+00', ''),
	('00000000-0000-0000-0000-000000000000', '4a3b2b7b-d441-4e7d-8dd7-0b101fab4d7e', '{"action":"login","actor_id":"e1e9492e-ec66-4705-bcb6-59839d5589f6","actor_username":"client2@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:19:03.120306+00', ''),
	('00000000-0000-0000-0000-000000000000', '05582a05-ffe7-4515-a0ab-3e93ade626c0', '{"action":"logout","actor_id":"e1e9492e-ec66-4705-bcb6-59839d5589f6","actor_username":"client2@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:19:03.185413+00', ''),
	('00000000-0000-0000-0000-000000000000', '1551a550-a75a-4f86-91fc-26cecf7b5933', '{"action":"user_signedup","actor_id":"f26ffa9a-915a-48eb-a9bc-2359341c26e5","actor_username":"client3@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-15 08:19:22.748377+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cc9676e4-443c-4c3e-9c0e-6fa2de61e486', '{"action":"login","actor_id":"f26ffa9a-915a-48eb-a9bc-2359341c26e5","actor_username":"client3@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:19:22.76682+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e82bfe6f-d48b-46d8-ad76-d3fe6a2d096a', '{"action":"logout","actor_id":"f26ffa9a-915a-48eb-a9bc-2359341c26e5","actor_username":"client3@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:19:22.831675+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c4687606-1d65-49b0-854a-9edd2850fa13', '{"action":"user_signedup","actor_id":"2097c67f-eab9-45cb-9bea-4fa2835bf0b3","actor_username":"admin@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-08-15 08:19:47.58808+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cc26e33e-4d00-4401-9b5f-e4f327f7ceaf', '{"action":"login","actor_id":"2097c67f-eab9-45cb-9bea-4fa2835bf0b3","actor_username":"admin@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:19:47.606783+00', ''),
	('00000000-0000-0000-0000-000000000000', '7b62e3c6-557c-48a6-a968-665c15d768b7', '{"action":"logout","actor_id":"2097c67f-eab9-45cb-9bea-4fa2835bf0b3","actor_username":"admin@example.com","actor_via_sso":false,"log_type":"account"}', '2026-08-15 08:19:47.672782+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa582326-0914-43c3-944f-0f90abd7d77c', '{"action":"login","actor_id":"2097c67f-eab9-45cb-9bea-4fa2835bf0b3","actor_username":"admin@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-08-15 08:20:07.120786+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '2097c67f-eab9-45cb-9bea-4fa2835bf0b3', 'authenticated', 'authenticated', 'admin@example.com', '$2a$10$8LBmmuFnczdA4xX3Z6232uXfAp.Nhxzg3ZDM8WirH/cuPr5HUQ142', '2026-08-15 08:19:47.588576+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-15 08:20:07.121655+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "2097c67f-eab9-45cb-9bea-4fa2835bf0b3", "email": "admin@example.com", "username": "admin", "email_verified": true, "phone_verified": false}', NULL, '2026-08-15 08:19:47.580461+00', '2026-08-15 08:20:07.12333+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4db67921-e23b-4725-84ec-38470b5fd65f', 'authenticated', 'authenticated', 'client1@example.com', '$2a$10$8LBmmuFnczdA4xX3Z6232uXfAp.Nhxzg3ZDM8WirH/cuPr5HUQ142', '2026-08-15 08:18:42.548401+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-15 08:18:42.567991+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "4db67921-e23b-4725-84ec-38470b5fd65f", "email": "client1@example.com", "username": "client1", "email_verified": true, "phone_verified": false}', NULL, '2026-08-15 08:18:42.542153+00', '2026-08-15 08:18:42.570888+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f26ffa9a-915a-48eb-a9bc-2359341c26e5', 'authenticated', 'authenticated', 'client3@example.com', '$2a$10$8LBmmuFnczdA4xX3Z6232uXfAp.Nhxzg3ZDM8WirH/cuPr5HUQ142', '2026-08-15 08:19:22.748916+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-15 08:19:22.768016+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "f26ffa9a-915a-48eb-a9bc-2359341c26e5", "email": "client3@example.com", "username": "client3", "email_verified": true, "phone_verified": false}', NULL, '2026-08-15 08:19:22.741143+00', '2026-08-15 08:19:22.771088+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e1e9492e-ec66-4705-bcb6-59839d5589f6', 'authenticated', 'authenticated', 'client2@example.com', '$2a$10$8LBmmuFnczdA4xX3Z6232uXfAp.Nhxzg3ZDM8WirH/cuPr5HUQ142', '2026-08-15 08:19:03.102306+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-15 08:19:03.121477+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "e1e9492e-ec66-4705-bcb6-59839d5589f6", "email": "client2@example.com", "username": "client2", "email_verified": true, "phone_verified": false}', NULL, '2026-08-15 08:19:03.094694+00', '2026-08-15 08:19:03.124415+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '80686b90-fa82-45a3-b9d0-b13807f1bdc5', 'authenticated', 'authenticated', 'agent2@example.com', '$2a$10$8LBmmuFnczdA4xX3Z6232uXfAp.Nhxzg3ZDM8WirH/cuPr5HUQ142', '2026-08-15 08:18:01.639024+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-15 08:18:01.658105+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "80686b90-fa82-45a3-b9d0-b13807f1bdc5", "email": "agent2@example.com", "username": "agent2", "email_verified": true, "phone_verified": false}', NULL, '2026-08-15 08:18:01.630779+00', '2026-08-15 08:18:01.661004+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ff4310b4-dbcc-4901-80d9-1dd49e51d626', 'authenticated', 'authenticated', 'agent1@example.com', '$2a$10$8LBmmuFnczdA4xX3Z6232uXfAp.Nhxzg3ZDM8WirH/cuPr5HUQ142', '2026-08-15 08:17:35.654843+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-15 08:18:13.891576+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "ff4310b4-dbcc-4901-80d9-1dd49e51d626", "email": "agent1@example.com", "username": "agent1", "email_verified": true, "phone_verified": false}', NULL, '2026-08-15 08:17:35.648472+00', '2026-08-15 08:18:13.894869+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('ff4310b4-dbcc-4901-80d9-1dd49e51d626', 'ff4310b4-dbcc-4901-80d9-1dd49e51d626', '{"sub": "ff4310b4-dbcc-4901-80d9-1dd49e51d626", "email": "agent1@example.com", "username": "agent1", "email_verified": false, "phone_verified": false}', 'email', '2026-08-15 08:17:35.652761+00', '2026-08-15 08:17:35.652796+00', '2026-08-15 08:17:35.652796+00', '6cfe571c-922c-4253-b1a8-ec7b18a7ca3b'),
	('80686b90-fa82-45a3-b9d0-b13807f1bdc5', '80686b90-fa82-45a3-b9d0-b13807f1bdc5', '{"sub": "80686b90-fa82-45a3-b9d0-b13807f1bdc5", "email": "agent2@example.com", "username": "agent2", "email_verified": false, "phone_verified": false}', 'email', '2026-08-15 08:18:01.636681+00', '2026-08-15 08:18:01.636714+00', '2026-08-15 08:18:01.636714+00', '5ac42a6a-5216-494d-872c-9406feb1cce6'),
	('4db67921-e23b-4725-84ec-38470b5fd65f', '4db67921-e23b-4725-84ec-38470b5fd65f', '{"sub": "4db67921-e23b-4725-84ec-38470b5fd65f", "email": "client1@example.com", "username": "client1", "email_verified": false, "phone_verified": false}', 'email', '2026-08-15 08:18:42.546715+00', '2026-08-15 08:18:42.546765+00', '2026-08-15 08:18:42.546765+00', '14a72e69-e2d6-453b-a779-c379710733e5'),
	('e1e9492e-ec66-4705-bcb6-59839d5589f6', 'e1e9492e-ec66-4705-bcb6-59839d5589f6', '{"sub": "e1e9492e-ec66-4705-bcb6-59839d5589f6", "email": "client2@example.com", "username": "client2", "email_verified": false, "phone_verified": false}', 'email', '2026-08-15 08:19:03.100108+00', '2026-08-15 08:19:03.100144+00', '2026-08-15 08:19:03.100144+00', '64ea22d6-e92b-47e6-bbbc-4e770c79b17a'),
	('f26ffa9a-915a-48eb-a9bc-2359341c26e5', 'f26ffa9a-915a-48eb-a9bc-2359341c26e5', '{"sub": "f26ffa9a-915a-48eb-a9bc-2359341c26e5", "email": "client3@example.com", "username": "client3", "email_verified": false, "phone_verified": false}', 'email', '2026-08-15 08:19:22.746393+00', '2026-08-15 08:19:22.746423+00', '2026-08-15 08:19:22.746423+00', '54a39c24-f3d5-477c-af1b-74716c0024f0'),
	('2097c67f-eab9-45cb-9bea-4fa2835bf0b3', '2097c67f-eab9-45cb-9bea-4fa2835bf0b3', '{"sub": "2097c67f-eab9-45cb-9bea-4fa2835bf0b3", "email": "admin@example.com", "username": "admin", "email_verified": false, "phone_verified": false}', 'email', '2026-08-15 08:19:47.586183+00', '2026-08-15 08:19:47.586214+00', '2026-08-15 08:19:47.586214+00', 'fa4836a2-32a3-42a7-8fb5-69867a43f359');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('5d70479d-f4b6-4e13-b865-13a15a734d7f', '2097c67f-eab9-45cb-9bea-4fa2835bf0b3', '2026-08-15 08:20:07.121716+00', '2026-08-15 08:20:07.121716+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '172.23.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('5d70479d-f4b6-4e13-b865-13a15a734d7f', '2026-08-15 08:20:07.123583+00', '2026-08-15 08:20:07.123583+00', 'password', '9d2cec47-be0d-429e-92fd-7ca647a1d2f1');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 8, 'nv6w5qba25ep', '2097c67f-eab9-45cb-9bea-4fa2835bf0b3', false, '2026-08-15 08:20:07.12281+00', '2026-08-15 08:20:07.12281+00', NULL, '5d70479d-f4b6-4e13-b865-13a15a734d7f');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "created_at", "username", "role") VALUES
	('4db67921-e23b-4725-84ec-38470b5fd65f', '2026-08-15 08:18:42.541892+00', 'client1', 'client'),
	('e1e9492e-ec66-4705-bcb6-59839d5589f6', '2026-08-15 08:19:03.094327+00', 'client2', 'client'),
	('f26ffa9a-915a-48eb-a9bc-2359341c26e5', '2026-08-15 08:19:22.740877+00', 'client3', 'client'),
	('2097c67f-eab9-45cb-9bea-4fa2835bf0b3', '2026-08-15 08:19:47.579855+00', 'admin', 'admin'),
	('ff4310b4-dbcc-4901-80d9-1dd49e51d626', '2026-08-15 08:17:35.648192+00', 'agent1', 'agent'),
	('80686b90-fa82-45a3-b9d0-b13807f1bdc5', '2026-08-15 08:18:01.630517+00', 'agent2', 'agent');


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- ----------------------------------------------------------------------------
-- Tickets
--   7 tickets spanning every status / priority / category,
--   some assigned, some not, with varied created_at.
-- ----------------------------------------------------------------------------
INSERT INTO public.tickets (id, client_id, category, description, priority)
VALUES
  -- client1
  ('a0000000-0000-0000-0000-000000000001', '4db67921-e23b-4725-84ec-38470b5fd65f',
   'software', 'Cannot access the internal portal after password reset', 'high'),
  ('a0000000-0000-0000-0000-000000000002', '4db67921-e23b-4725-84ec-38470b5fd65f',
   'hardware', 'Laptop keyboard not responding', 'low'),
  -- client2
  ('a0000000-0000-0000-0000-000000000003', 'e1e9492e-ec66-4705-bcb6-59839d5589f6',
   'payment', 'Invoice 2045 charged twice', 'high'),
  ('a0000000-0000-0000-0000-000000000004', 'e1e9492e-ec66-4705-bcb6-59839d5589f6',
   'delivery', 'Package marked delivered but not received', 'medium'),
  ('a0000000-0000-0000-0000-000000000007', 'e1e9492e-ec66-4705-bcb6-59839d5589f6',
   'software', 'New antivirus deployment request', 'high'),
  -- client3
  ('a0000000-0000-0000-0000-000000000005', 'f26ffa9a-915a-48eb-a9bc-2359341c26e5',
   'hardware', 'Monitor flickering since update', 'medium'),
  ('a0000000-0000-0000-0000-000000000006', 'f26ffa9a-915a-48eb-a9bc-2359341c26e5',
   'software', 'VPN keeps disconnecting', 'low')
ON CONFLICT (id) DO NOTHING;

-- Set status, assignment and timestamps (trigger resets them on INSERT)
UPDATE public.tickets SET created_at = '2026-08-10T08:00:00Z'  WHERE id = 'a0000000-0000-0000-0000-000000000001'; -- open (default)

UPDATE public.tickets
SET status = 'in_progress',
    agent_id = 'ff4310b4-dbcc-4901-80d9-1dd49e51d626',
    created_at = '2026-08-12T09:30:00Z'
WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE public.tickets SET created_at = '2026-08-14T11:15:00Z'  WHERE id = 'a0000000-0000-0000-0000-000000000003'; -- open (default)

UPDATE public.tickets
SET status = 'closed',
    agent_id = '80686b90-fa82-45a3-b9d0-b13807f1bdc5',
    created_at = '2026-07-01T10:00:00Z'
WHERE id = 'a0000000-0000-0000-0000-000000000004';

UPDATE public.tickets
SET status = 'closed',
    agent_id = 'ff4310b4-dbcc-4901-80d9-1dd49e51d626',
    closed_by = '2097c67f-eab9-45cb-9bea-4fa2835bf0b3',
    created_at = '2026-06-15T09:30:00Z'
WHERE id = 'a0000000-0000-0000-0000-000000000005';

UPDATE public.tickets
SET status = 'closed',
    agent_id = '80686b90-fa82-45a3-b9d0-b13807f1bdc5',
    closed_by = '80686b90-fa82-45a3-b9d0-b13807f1bdc5',
    created_at = '2026-06-20T14:00:00Z'
WHERE id = 'a0000000-0000-0000-0000-000000000006';

UPDATE public.tickets SET created_at = '2026-08-15T07:45:00Z'  WHERE id = 'a0000000-0000-0000-0000-000000000007'; -- open (default)



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- ----------------------------------------------------------------------------
-- Messages for the in-progress ticket
-- ----------------------------------------------------------------------------
INSERT INTO public.messages (ticket_id, sender_id, content)
VALUES
  ('a0000000-0000-0000-0000-000000000002', '4db67921-e23b-4725-84ec-38470b5fd65f',
   'Hello, the keyboard stopped responding after the latest OS update.'),
  ('a0000000-0000-0000-0000-000000000002', 'ff4310b4-dbcc-4901-80d9-1dd49e51d626',
   'Thanks for the report, I am investigating and will get back to you.')
ON CONFLICT DO NOTHING;


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 8, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict eKjBKkhloNXtpDWWDBQc9IcVJlwUF7ozgPw7RghkYAniqIVukdkX2G5ICkNevot

RESET ALL;
