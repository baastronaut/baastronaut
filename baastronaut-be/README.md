# Baastronaut Backend

This setup requires Docker and Docker Compose. The instructions are geared towards setting up for local development but as of this writing, it's also the only way to setup the app as a user.

## Local Development

Once you have done the initial installation and setup, you can start using the scripts in [sample-scripts](/sample-scripts/) for local development each time. See [Local Development Scripts](#local-development-scripts) for details. But before that, it is better to go through the installation steps first.

### Install PostgREST

[Install PostgREST](https://postgrest.org/en/stable/tutorials/tut0.html#step-2-install-postgresql) for your platform. It will be more convenient if you put PostgREST binary in a location that is present in your `$PATH`. The scripts used in this project assumes `postgrest` is in your `$PATH`.

If you do not already have a `postgrest.conf` file, create one and put `db-schemas = ""` in it.

### Copy sample files

Copy `sample.env` to `.env` and `postgrest.conf.sample` to `postgrest.conf`. Update the values in `sample.env` accordingly. Most of the values should be good to start with. The values that require mentioning are:

- **BAAS_ENCRYPTION_KEY_HEX**: A random 256-bit hex for encrypting login credentials for users' schemas.
- **BAAS_APP_JWT_PRIVATE_KEY_FILE** and **BAAS_APP_JWT_PUBLIC_KEY_FILE**: RS512 private and public key pair for signing JWT tokens by Baastronaut.
- **PGRST_JWT_PRIVATE_KEY_JWK_FILE** and **PGRST_JWT_PUBLIC_KEY_JWK_FILE**: Private and public key files for signing and verifying JWT tokens by PostgREST. JWK format is expected. https://github.com/panva/jose is a good tool for generating JWK files.

### Start Databases

```
APP_PGDATA_DIR=<dir-to-store-app-db-data> USER_PGDATA_DIR=<dir-to-store-user-db-data> docker compose up
```

This starts 2 database instances required for this project.

If this is your first time running this project, you should create the databases and users required. The credentials provided below are just examples. If you change them (and you should if you are running it in production), remember to update the details in `.env` too.

#### Create user for app DB

Login as postgres user (see docker-compose.yml for password):

```
psql -h localhost -U postgres -p 5432
```

Create user and database:

```
create user johnwick with password 'johnwick' login;
alter user johnwick with Superuser Createrole Createdb;
create database platform with owner johnwick;
```

Logout of postgres and login as johnwick into the database that you just created:

```
psql -h localhost -U johnwick -d platform -p 5432
```

Create schema and alter `search_path`:

```
create schema johnwick;
alter role johnwick set search_path = "$user"; -- relogin and run "show search_path;" to see this change take effect
```

#### Create user for user data DB

Login as postgres user (see docker-compose.yml for password):

```
psql -h localhost -U postgres -p 17385
```

Create user and database:

```
create user user_data_admin with password 'user_data_admin' login;
alter user user_data_admin with Superuser Createrole Createdb;
create database user_data with owner user_data_admin;
```

Logout of postgres and login as user_data_admin into the database that you just created:

```
psql -h localhost -U user_data_admin -d user_data -p 17385
```

Revoke access to public schema for security reasons.

```
REVOKE ALL ON SCHEMA public FROM public;
```

That's it.

### Install dependencies

```
yarn install
```

### Run database migrations

We use [Flyway command line](https://flywaydb.org/documentation/usage/commandline/) to manage migrations. Install it first before attempting to run database migrations (You can use `brew install flyway` on a Mac.). As of this writing, the version of Flyway we are using is 9.3.1. Once installed, copy `flyway.conf.sample` to `flyway.conf` (this file is ignored by `.gitignore`) and change the values in `flyway.conf` accordingly. After that, you can run migrations with:

```
flyway migrate
```

#### Side note: database migrations

We use Flyway to manage database schema migrations. Read more about it [here](https://flywaydb.org/documentation/concepts/migrations.html), especially the section on [file name conventions](https://flywaydb.org/documentation/concepts/migrations.html#naming-1), and [their configuration options](https://flywaydb.org/documentation/configuration/configfile.html).

A few key points to note:

- Files prefixed with `V` means a forward migration, which is the only type of migration file we use.
- We don't use undo migrations, i.e. migration that starts with `U`.
- We use `YYYYDDMMHHMMSS` as the version in our migration files.
- We put our migration files in [migrations](migrations) folder.

### Start app locally

You can run the app locally now with:

```
yarn start:dev
```

## Production Build

```
yarn install
yarn build .
```

Production build is now in `dist/`.

### Local Development Scripts

For convenience, there are sample start and stop scripts for development in [sample-scripts](/sample-scripts/) folder. Copy them into this project's root folder (where `docker-compose.yml` is) and name them `local-start.sh` and `local-stop.sh` respectively (these two filenames have been added to `.gitignore`).

Fill in the variables with the appropriate values and you can use them to start and stop services needed for local development. The only variable that requires being passed in as an env var everytime is `PGRST_PID` in the stop script. This is the PID of the `postgrest` process that is running. You can get it by either running `ps aux | grep postgrest` or `pgrep postgrest`. If you are sure there's only going to be one PostgREST process running, you can even modify the script to make `PGRST_PID=$(pgrep postgrest)`.

Note: the start script starts the external services that are required for this service but not this service itself. You still need to run `yarn start:dev` to start this service.
