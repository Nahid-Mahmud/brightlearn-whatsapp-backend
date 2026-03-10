import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';

interface ErrorResponse {
  statusCode: number;
  message: string;
  errorDetails: {
    type: string;
    code: string;
    meta?: Record<string, unknown>;
  };
}

export const handlePrismaKnownRequestError = (
  err: PrismaClientKnownRequestError
): ErrorResponse => {
  const { code, meta } = err;
  let statusCode = StatusCodes.BAD_REQUEST;
  let message = 'Database operation failed. Please try again.';

  switch (code) {
    // P1xxx - Common/Connection Errors
    case 'P1000':
      statusCode = StatusCodes.UNAUTHORIZED;
      message = `Database authentication failed. Please check your database credentials.`;
      break;
    case 'P1001':
      statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      message = `Cannot reach database server. Please ensure the database is running and accessible.`;
      break;
    case 'P1002':
      statusCode = StatusCodes.REQUEST_TIMEOUT;
      message = `Database server connection timed out. Please try again.`;
      break;
    case 'P1003':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Database does not exist. Please contact support.`;
      break;
    case 'P1008':
      statusCode = StatusCodes.REQUEST_TIMEOUT;
      message = `Operation timed out. Please try again or contact support if the issue persists.`;
      break;
    case 'P1009':
      statusCode = StatusCodes.CONFLICT;
      message = `Database already exists.`;
      break;
    case 'P1010':
      statusCode = StatusCodes.FORBIDDEN;
      message = `Access denied to the database. Please check your permissions.`;
      break;
    case 'P1011':
      statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      message = `TLS connection error. Please check your database connection settings.`;
      break;
    case 'P1012':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Invalid database schema configuration. Please check your Prisma schema.`;
      break;
    case 'P1013':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Invalid database connection string. Please check your database URL.`;
      break;
    case 'P1014':
      statusCode = StatusCodes.NOT_FOUND;
      message = `The underlying database table or view does not exist.`;
      break;
    case 'P1015':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Your database version doesn't support the features used in your schema.`;
      break;
    case 'P1016':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Incorrect number of parameters in your query. Please check your input.`;
      break;
    case 'P1017':
      statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      message = `Database connection was closed. Please try again.`;
      break;

    // P2xxx - Query Engine Errors
    case 'P2000':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `The provided value is too long for the database field.`;
      break;
    case 'P2001':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Record not found. The requested resource does not exist.`;
      break;
    case 'P2002':
      statusCode = StatusCodes.CONFLICT;
      message = `Duplicate entry. The ${meta?.target || 'field'} already exists.`;
      break;
    case 'P2003':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Invalid reference. The referenced record does not exist.`;
      break;
    case 'P2004':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Database constraint violation occurred.`;
      break;
    case 'P2005':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Invalid value stored in database field. Please contact support.`;
      break;
    case 'P2006':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `The provided value is not valid for this field.`;
      break;
    case 'P2007':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Data validation error. Please check your input values.`;
      break;
    case 'P2008':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Failed to parse the query. Please check your request format.`;
      break;
    case 'P2009':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Failed to validate the query. Please check your request parameters.`;
      break;
    case 'P2010':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Raw query execution failed. Please contact support.`;
      break;
    case 'P2011':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Required field is missing. Please provide all required information.`;
      break;
    case 'P2012':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Missing required value. Please check your input data.`;
      break;
    case 'P2013':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Missing required argument. Please provide all necessary fields.`;
      break;
    case 'P2014':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Cannot delete record due to related data. Please remove related records first.`;
      break;
    case 'P2015':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Related record not found. The referenced data does not exist.`;
      break;
    case 'P2016':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Query interpretation error. Please check your request format.`;
      break;
    case 'P2017':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Records are not properly connected. Please establish the required relationships.`;
      break;
    case 'P2018':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Required connected records were not found.`;
      break;
    case 'P2019':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Input error. Please check your data format.`;
      break;
    case 'P2020':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Value is out of range for the specified type.`;
      break;
    case 'P2021':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Database table does not exist. Please contact support.`;
      break;
    case 'P2022':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Database column does not exist. Please contact support.`;
      break;
    case 'P2023':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Inconsistent column data detected. Please contact support.`;
      break;
    case 'P2024':
      statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      message = `Database connection timeout. Please try again later.`;
      break;
    case 'P2025':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Record not found. The operation failed because required records were not found.`;
      break;
    case 'P2026':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `This feature is not supported by your current database provider.`;
      break;
    case 'P2027':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Multiple database errors occurred during query execution.`;
      break;
    case 'P2028':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Transaction API error occurred.`;
      break;
    case 'P2029':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Query parameter limit exceeded. Please reduce the number of parameters.`;
      break;
    case 'P2030':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Cannot find a fulltext index for the search. Please add @@fulltext to your schema.`;
      break;
    case 'P2031':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `MongoDB server must be run as a replica set for transactions.`;
      break;
    case 'P2033':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Number too large for 64-bit integer. Consider using BigInt.`;
      break;
    case 'P2034':
      statusCode = StatusCodes.CONFLICT;
      message = `Transaction failed due to a conflict. Please try again.`;
      break;
    case 'P2035':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Database assertion violation occurred.`;
      break;
    case 'P2036':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `External connector error occurred.`;
      break;
    case 'P2037':
      statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      message = `Too many database connections opened. Please try again later.`;
      break;

    // P3xxx - Migration Errors
    case 'P3000':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Failed to create database during migration.`;
      break;
    case 'P3001':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Migration would cause destructive changes and possible data loss.`;
      break;
    case 'P3002':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `The attempted migration was rolled back.`;
      break;
    case 'P3003':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Migration format has changed. Saved migrations are no longer valid.`;
      break;
    case 'P3004':
      statusCode = StatusCodes.FORBIDDEN;
      message = `Cannot migrate system database.`;
      break;
    case 'P3005':
      statusCode = StatusCodes.CONFLICT;
      message = `Database schema is not empty. Cannot run initial migration.`;
      break;
    case 'P3006':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Migration failed to apply to shadow database.`;
      break;
    case 'P3007':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Preview features are not allowed in migrations.`;
      break;
    case 'P3008':
      statusCode = StatusCodes.CONFLICT;
      message = `Migration is already recorded as applied.`;
      break;
    case 'P3009':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Failed migrations found in database. New migrations cannot be applied.`;
      break;
    case 'P3010':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Migration name is too long. Must be 200 characters or less.`;
      break;
    case 'P3011':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Migration cannot be rolled back because it was never applied.`;
      break;
    case 'P3012':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Migration cannot be rolled back because it is not in a failed state.`;
      break;
    case 'P3013':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Datasource provider arrays are no longer supported.`;
      break;
    case 'P3014':
      statusCode = StatusCodes.FORBIDDEN;
      message = `Could not create shadow database. Please check database permissions.`;
      break;
    case 'P3015':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Migration file not found. Please restore the migration file.`;
      break;
    case 'P3016':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Database reset fallback method failed.`;
      break;
    case 'P3017':
      statusCode = StatusCodes.NOT_FOUND;
      message = `Migration could not be found.`;
      break;
    case 'P3018':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `A migration failed to apply. Please resolve before applying new migrations.`;
      break;
    case 'P3019':
      statusCode = StatusCodes.CONFLICT;
      message = `Datasource provider mismatch with migration lock file.`;
      break;
    case 'P3020':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Shadow database creation is disabled on Azure SQL.`;
      break;
    case 'P3021':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Foreign keys cannot be created on this database.`;
      break;
    case 'P3022':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Direct DDL execution is disabled on this database.`;
      break;

    // P4xxx - Introspection Errors
    case 'P4000':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Introspection operation failed to produce a schema file.`;
      break;
    case 'P4001':
      statusCode = StatusCodes.NOT_FOUND;
      message = `The introspected database was empty.`;
      break;
    case 'P4002':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `The introspected database schema was inconsistent.`;
      break;

    // P6xxx - Prisma Accelerate Errors
    case 'P6000':
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      message = `Prisma Accelerate server error occurred.`;
      break;
    case 'P6001':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Invalid Prisma Accelerate data source URL.`;
      break;
    case 'P6002':
      statusCode = StatusCodes.UNAUTHORIZED;
      message = `Invalid Prisma Accelerate API key.`;
      break;
    case 'P6003':
      statusCode = StatusCodes.PAYMENT_REQUIRED;
      message = `Prisma Accelerate plan limit reached.`;
      break;
    case 'P6004':
      statusCode = StatusCodes.REQUEST_TIMEOUT;
      message = `Prisma Accelerate query timeout exceeded.`;
      break;
    case 'P6005':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Invalid parameters provided to Prisma Accelerate.`;
      break;
    case 'P6006':
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Prisma version not supported by Accelerate.`;
      break;
    case 'P6008':
      statusCode = StatusCodes.SERVICE_UNAVAILABLE;
      message = `Prisma Accelerate engine failed to start.`;
      break;
    case 'P6009':
      statusCode = StatusCodes.REQUEST_TOO_LONG;
      message = `Response size limit exceeded in Prisma Accelerate.`;
      break;
    case 'P6010':
      statusCode = StatusCodes.FORBIDDEN;
      message = `Prisma Accelerate project is disabled.`;
      break;
    case 'P5011':
      statusCode = StatusCodes.TOO_MANY_REQUESTS;
      message = `Too many requests to Prisma Accelerate. Please try again later.`;
      break;

    default:
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Database operation failed: ${err.message}`;
  }

  return {
    statusCode,
    message,
    errorDetails: {
      type: 'DatabaseError',
      code,
      meta,
    },
  };
};
