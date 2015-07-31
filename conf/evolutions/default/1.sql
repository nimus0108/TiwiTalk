# --- !Ups

create table "users" ("email" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "referred_by" text);

# --- !Downs

drop table "users"
