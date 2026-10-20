CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_color" text NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"itad_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"release_date" text,
	"image_url" text,
	CONSTRAINT "games_itad_id_unique" UNIQUE("itad_id"),
	CONSTRAINT "games_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_genres" (
	"game_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "game_genres_game_id_genre_id_pk" PRIMARY KEY("game_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "game_platforms" (
	"game_id" integer NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"store_url" text NOT NULL,
	CONSTRAINT "game_platforms_game_id_provider_pk" PRIMARY KEY("game_id","provider")
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"game_id" integer NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'backlog' NOT NULL,
	"price_paid" integer,
	"acquired_at" text,
	"playtime_minutes" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_games_user_game" UNIQUE("user_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"provider" text NOT NULL,
	"currency" text NOT NULL,
	"base_price" integer NOT NULL,
	"final_price" integer NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"history_low" integer,
	"store_low" integer,
	"url" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	CONSTRAINT "prices_game_provider_currency" UNIQUE("game_id","provider","currency")
);
--> statement-breakpoint
CREATE TABLE "price_cache" (
	"game_id" integer PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"items_found" integer DEFAULT 0 NOT NULL,
	"error" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_platforms" ADD CONSTRAINT "game_platforms_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_cache_expires_at" ON "price_cache" USING btree ("expires_at");