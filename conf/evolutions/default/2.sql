# --- !Ups

create table "tokens" ("email" text PRIMARY KEY, "token" uuid UNIQUE NOT NULL, "created" bigint NOT NULL);

# --- !Downs

drop table "tokens"
