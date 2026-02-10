/*
  # Enable pgcrypto Extension

  1. Changes
    - Enable pgcrypto extension for gen_random_bytes function
    
  2. Security
    - Standard PostgreSQL extension for cryptographic functions
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;