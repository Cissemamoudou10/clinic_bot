const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabase;
