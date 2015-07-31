# --- !Ups

create table "users" ("email" text PRIMARY KEY, "name" text NOT NULL, "referred_by" text, "access_code" uuid UNIQUE NOT NULL);

# --- !Downs

drop table "users"
