# --- !Ups

create table "tokens" ("email" text PRIMARY KEY NOT NULL, "token" uuid NOT NULL, "created" bigint NOT NULL);

# --- !Downs

drop table "tokens"