CREATE TABLE public.presale_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain TEXT NOT NULL CHECK (chain IN ('SOL','LTC')),
  tx_hash TEXT NOT NULL,
  payer_address TEXT,
  recipient_solana_address TEXT NOT NULL,
  amount_native NUMERIC NOT NULL DEFAULT 0,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  tokens NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'verified',
  delivery_tx TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (chain, tx_hash)
);

GRANT ALL ON public.presale_purchases TO service_role;
ALTER TABLE public.presale_purchases ENABLE ROW LEVEL SECURITY;
