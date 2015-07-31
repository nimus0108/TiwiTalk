# --- !Ups

create table "tokens" ("token" uuid PRIMARY KEY NOT NULL, "created" bigint NOT NULL);

# --- !Downs

drop table "tokens"
